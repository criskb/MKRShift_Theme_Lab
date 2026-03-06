from __future__ import annotations

import re
import time
from pathlib import Path

from aiohttp import web
from server import PromptServer

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
CUSTOM_NODES_ROOT = PACKAGE_ROOT.parent
NODE_DIR_NAME = PACKAGE_ROOT.name
API_PREFIX = f"/{NODE_DIR_NAME}/api"

ALLOWED_EXTENSIONS = {".css", ".js", ".ts", ".vue", ".scss"}
SKIP_DIR_NAMES = {
    "__pycache__",
    ".git",
    ".github",
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    "demo",
    "uv-cache",
}
SKIP_EXTENSION_DIRS = {
    NODE_DIR_NAME,
}

CSS_VAR_DECLARATION_RE = re.compile(r"(?P<name>--[A-Za-z0-9_-]+)\s*:\s*(?P<value>[^;{}]+);")
HEX_COLOR_RE = re.compile(r"^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$")
RGB_TRIPLET_RE = re.compile(
    r"^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*$"
)
RGB_FUNCTION_RE = re.compile(
    r"^(?P<fn>rgba?|hsla?)\(\s*(?P<body>[^)]+)\s*\)$",
    re.IGNORECASE,
)
NUMBER_RE = re.compile(r"^-?\d+(?:\.\d+)?$")

STYLE_KEYWORDS = (
    "accent",
    "animation",
    "background",
    "blur",
    "border",
    "button",
    "card",
    "color",
    "colour",
    "contrast",
    "css",
    "fill",
    "font",
    "foreground",
    "gap",
    "glow",
    "gradient",
    "height",
    "highlight",
    "icon",
    "image",
    "ink",
    "line",
    "margin",
    "muted",
    "opacity",
    "outline",
    "padding",
    "panel",
    "radius",
    "ring",
    "scale",
    "shadow",
    "snap",
    "spacing",
    "stroke",
    "surface",
    "text",
    "theme",
    "width",
)

_CACHE: dict[str, object] = {
    "timestamp": 0.0,
    "providers": [],
}
_CACHE_TTL_SECONDS = 5.0


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower()).strip("-")
    return slug or "extension"


def title_case(value: str) -> str:
    clean = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", str(value or ""))
    clean = re.sub(r"[_./-]+", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    if not clean:
        return "Extension"
    return " ".join(part[:1].upper() + part[1:] for part in clean.split(" "))


def build_item_key(css_var_name: str) -> str:
    return css_var_name.lstrip("-").replace("-", "_")


def humanize_css_var(css_var_name: str) -> str:
    return title_case(css_var_name.lstrip("-"))


def should_skip_path(path: Path) -> bool:
    return any(part in SKIP_DIR_NAMES for part in path.parts)


def infer_color_format(raw_value: str) -> str:
    value = raw_value.strip()
    if HEX_COLOR_RE.fullmatch(value):
        return "hex"
    if RGB_TRIPLET_RE.fullmatch(value):
        return "rgba-triplet" if value.count(",") >= 3 else "rgb-triplet"

    match = RGB_FUNCTION_RE.fullmatch(value)
    if not match:
        return ""

    fn = match.group("fn").lower()
    if fn == "rgb":
        return "rgb-function"
    if fn == "rgba":
        return "rgba-function"
    return ""


def infer_item_type(css_var_name: str, raw_value: str) -> tuple[str, str]:
    name = css_var_name.lower()
    value = raw_value.strip()
    combined = f"{name} {value.lower()}"

    color_format = infer_color_format(value)
    if color_format:
        return "color", color_format

    if "gradient" in combined or "color-mix(" in combined:
        return "text", ""

    if NUMBER_RE.fullmatch(value) and any(keyword in combined for keyword in ("radius", "gap", "scale", "opacity", "padding", "margin")):
        return "number", ""

    return "text", ""


def is_themeable_declaration(css_var_name: str, raw_value: str) -> bool:
    name = css_var_name.lower()
    value = raw_value.lower().strip()
    return any(keyword in name or keyword in value for keyword in STYLE_KEYWORDS)


def scan_extension_styles(extension_dir: Path) -> dict[str, object] | None:
    variables: dict[str, dict[str, str]] = {}

    for file_path in extension_dir.rglob("*"):
        if not file_path.is_file() or file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        if should_skip_path(file_path):
            continue

        try:
            text = file_path.read_text("utf-8", errors="ignore")
        except Exception:
            continue

        for match in CSS_VAR_DECLARATION_RE.finditer(text):
            css_var_name = match.group("name").strip()
            raw_value = match.group("value").strip()
            if not css_var_name or not raw_value:
                continue
            if not is_themeable_declaration(css_var_name, raw_value):
                continue
            variables.setdefault(
                css_var_name,
                {
                    "value": raw_value,
                    "source": str(file_path.relative_to(extension_dir)),
                },
            )

    if not variables:
        return None

    items = []
    for css_var_name, entry in sorted(variables.items()):
        item_type, color_format = infer_item_type(css_var_name, entry["value"])
        item = {
            "key": build_item_key(css_var_name),
            "label": humanize_css_var(css_var_name),
            "type": item_type,
            "default": entry["value"],
            "cssVar": css_var_name,
            "source": entry["source"],
        }
        if color_format:
            item["colorFormat"] = color_format
        if item_type == "text":
            item["placeholder"] = entry["value"]
        items.append(item)

    return {
        "id": f"extension-{slugify(extension_dir.name)}",
        "title": title_case(extension_dir.name),
        "sections": {
            "CSS Variables": items,
        },
    }


def scan_all_extension_styles() -> list[dict[str, object]]:
    providers: list[dict[str, object]] = []
    for extension_dir in sorted(CUSTOM_NODES_ROOT.iterdir(), key=lambda path: path.name.lower()):
        if not extension_dir.is_dir():
            continue
        if extension_dir.name.startswith(".") or extension_dir.name in SKIP_EXTENSION_DIRS:
            continue
        provider = scan_extension_styles(extension_dir)
        if provider:
            providers.append(provider)
    return providers


def get_cached_providers(force_refresh: bool = False) -> list[dict[str, object]]:
    now = time.time()
    if not force_refresh and _CACHE["providers"] and now - float(_CACHE["timestamp"]) < _CACHE_TTL_SECONDS:
        return list(_CACHE["providers"])  # type: ignore[arg-type]

    providers = scan_all_extension_styles()
    _CACHE["timestamp"] = now
    _CACHE["providers"] = providers
    return providers


@PromptServer.instance.routes.get(f"{API_PREFIX}/extension-style-providers")
async def get_extension_style_providers(request):
    force_refresh = request.rel_url.query.get("refresh") in {"1", "true", "yes"}
    providers = get_cached_providers(force_refresh=force_refresh)
    return web.json_response({"providers": providers})
