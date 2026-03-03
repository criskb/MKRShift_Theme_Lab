// Theme Lab - v2.0.0
// Modal studio + saved theme library for ComfyUI frontend.

import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { ComfyDialog } from "/scripts/ui/dialog.js";
import { ThemeLabTemplateStudio } from "./studio/template-studio.js";

const EXT_ID = "ThemeLab";
const VERSION = "2.0.0";

const LEGACY_CURRENT_KEY = "themelab.currentTheme";
const LIBRARY_CACHE_KEY = "themelab.library.cache";
const USER_LIBRARY_FILE = "themelab.themes.json";
const USER_PREVIEW_DIR = "themelab/previews";
const USER_COMFY_THEME_DIR = "themes";
const USER_COMFY_THEME_FILE = `${USER_COMFY_THEME_DIR}/Theme Lab.json`;
const COMFY_SETTING_COLOR_PALETTE = "Comfy.ColorPalette";
const COMFY_SETTING_CUSTOM_PALETTES = "Comfy.CustomColorPalettes";
const COMFY_THEME_LAB_ID = "themelab-theme-lab";
const COMFY_THEME_LAB_COMPAT_IDS = [
  COMFY_THEME_LAB_ID,
  "themelab-theme-lab-a",
  "themelab-theme-lab-b",
];
const DEFAULT_THEME_ID = "custom-theme-lab";

const SETTINGS = {
  LIVE_PREVIEW: "themelab.livePreview",
  BOTTOM_PANEL: "themelab.bottomPanelTab",
  RESET_CONFIRM: "themelab.confirmReset",
  PROVIDER_URLS: "themelab.providerManifestUrls",
};

const COMMANDS = {
  OPEN_STUDIO: "themelab.openStudio",
  OPEN_EDITOR: "themelab.openEditor",
  APPLY_THEME: "themelab.applyTheme",
  IMPORT_THEME: "themelab.importTheme",
  EXPORT_THEME: "themelab.exportTheme",
  RESET_THEME: "themelab.resetTheme",
};

const BASE = (() => {
  try {
    const url = new URL(import.meta.url, location.href);
    return url.href.replace(/[^/]+$/, "");
  } catch {
    return "";
  }
})();

function resolveExtensionUrl(relativePath) {
  try {
    return new URL(relativePath, BASE || location.href).href;
  } catch {
    return relativePath;
  }
}

const BUNDLED_THEME_LIBRARY_URL = resolveExtensionUrl("../themes/library.json");
const BUNDLED_THEME_ROOT_URL = resolveExtensionUrl("../themes/");

const DEFAULT_PROVIDER_URLS = [];

const TEMPLATE = {
  id: DEFAULT_THEME_ID,
  name: "Theme Lab",
  colors: {
    node_slot: {
      CLIP: "#FFD500",
      CLIP_VISION: "#A8DADC",
      CLIP_VISION_OUTPUT: "#AD7452",
      CONDITIONING: "#FFA931",
      CONTROL_NET: "#6EE7B7",
      IMAGE: "#64B5F6",
      LATENT: "#FF9CF9",
      MASK: "#81C784",
      MODEL: "#B39DDB",
      STYLE_MODEL: "#C2FFAE",
      VAE: "#FF6E6E",
      NOISE: "#B0B0B0",
      GUIDER: "#66FFFF",
      SAMPLER: "#ECB4B4",
      SIGMAS: "#CDFFCD",
      TAESD: "#DCC274",
    },
    litegraph_base: {
      BACKGROUND_IMAGE: "",
      CLEAR_BACKGROUND_COLOR: "#222222",
      NODE_TITLE_COLOR: "#999999",
      NODE_SELECTED_TITLE_COLOR: "#FFFFFF",
      NODE_TEXT_SIZE: 14,
      NODE_TEXT_COLOR: "#AAAAAA",
      NODE_TEXT_HIGHLIGHT_COLOR: "#FFFFFF",
      NODE_SUBTEXT_SIZE: 12,
      NODE_DEFAULT_COLOR: "#333333",
      NODE_DEFAULT_BGCOLOR: "#353535",
      NODE_DEFAULT_BOXCOLOR: "#666666",
      NODE_DEFAULT_SHAPE: 2,
      NODE_BOX_OUTLINE_COLOR: "#FFFFFF",
      NODE_BYPASS_BGCOLOR: "#FF00FF",
      NODE_ERROR_COLOUR: "#EE0000",
      DEFAULT_SHADOW_COLOR: "rgba(0,0,0,0.5)",
      DEFAULT_GROUP_FONT: 24,
      WIDGET_BGCOLOR: "#222222",
      WIDGET_OUTLINE_COLOR: "#666666",
      WIDGET_TEXT_COLOR: "#DDDDDD",
      WIDGET_SECONDARY_TEXT_COLOR: "#999999",
      WIDGET_DISABLED_TEXT_COLOR: "#666666",
      LINK_COLOR: "#99AA99",
      EVENT_LINK_COLOR: "#AA8866",
      CONNECTING_LINK_COLOR: "#AAFFAA",
      BADGE_FG_COLOR: "#FFFFFF",
      BADGE_BG_COLOR: "#0F1F0F",
    },
    comfy_base: {
      "fg-color": "#FFFFFF",
      "bg-color": "#202020",
      "comfy-menu-bg": "#353535",
      "comfy-menu-secondary-bg": "#303030",
      "comfy-input-bg": "#222222",
      "input-text": "#DDDDDD",
      "descrip-text": "#999999",
      "drag-text": "#CCCCCC",
      "error-text": "#FF4444",
      "border-color": "#4E4E4E",
      "tr-even-bg-color": "#222222",
      "tr-odd-bg-color": "#353535",
      "content-bg": "#4E4E4E",
      "content-fg": "#FFFFFF",
      "content-hover-bg": "#222222",
      "content-hover-fg": "#FFFFFF",
      "bar-shadow": "rgba(16,16,16,0.5) 0 0 0.5rem",
      "contrast-mix-color": "#FFFFFF",
      "interface-stroke": "#4E4E4E",
      "interface-panel-surface": "#303030",
      "interface-panel-box-shadow": "0 0 0.5rem rgba(16,16,16,0.5)",
      "interface-panel-drop-shadow": "0 16px 24px rgba(0,0,0,0.32)",
      "interface-panel-hover-surface": "#3A3A3A",
      "interface-panel-selected-surface": "#4E4E4E",
      "interface-button-hover-surface": "#2E2E2E",
      "base-foreground": "#FFFFFF",
      "base-background": "#202020",
      "muted-foreground": "#A6A6A6",
      "muted-background": "#2A2A2A",
      "secondary-background": "#3A3A3A",
      "secondary-background-hover": "#4A4A4A",
      "secondary-background-selected": "#5A5A5A",
      "primary-background": "#2563EB",
      "primary-background-hover": "#1D4ED8",
      "destructive-background": "#7D2E2E",
      "destructive-background-hover": "#973232",
      "warning-background": "#B9770A",
      "warning-background-hover": "#D89216",
      "success-background": "#1E8E4A",
      "border-default": "#4E4E4E",
      "border-subtle": "#3D3D3D",
      "interface-menu-component-surface-hovered": "#2B2B2B",
      "interface-menu-component-surface-selected": "#464646",
      "modal-card-background": "#363636",
      "modal-card-background-hovered": "#434343",
      "modal-card-border-highlighted": "#5A5A5A",
      "modal-panel-background": "#2A2A2A",
      "accent-background": "#2563EB",
      "accent-primary": "#93C5FD",
      "font-inter": "'Inter', sans-serif",
      "comfy-textarea-font-size": "13px",
      "comfy-tree-explorer-item-padding": "6px 4px",
      "comfy-topbar-height": "2.5rem",
      "comfy-widget-min-height": "24",
      "comfy-widget-max-height": "320",
      "comfy-widget-height": "auto",
      "comfy-img-preview-width": "384px",
      "comfy-img-preview-height": "256px",
    },
    extensions: {},
  },
  custom_css: {
    scope: ":root",
    vars: [],
    raw: "",
  },
  preview: {
    image_file: "",
  },
};

const COMFY_CORE_COLOR_FIELDS = [
  { key: "fg-color", type: "color" },
  { key: "bg-color", type: "color" },
  { key: "comfy-menu-bg", type: "color" },
  { key: "comfy-menu-secondary-bg", type: "color" },
  { key: "comfy-input-bg", type: "color" },
  { key: "input-text", type: "color" },
  { key: "descrip-text", type: "color" },
  { key: "drag-text", type: "color" },
  { key: "error-text", type: "color" },
  { key: "border-color", type: "color" },
  { key: "tr-even-bg-color", type: "color" },
  { key: "tr-odd-bg-color", type: "color" },
  { key: "content-bg", type: "color" },
  { key: "content-fg", type: "color" },
  { key: "content-hover-bg", type: "color" },
  { key: "content-hover-fg", type: "color" },
];

const COMFY_OPTIONAL_COLOR_FIELDS = [
  { key: "contrast-mix-color", type: "color" },
  { key: "interface-stroke", type: "color" },
  { key: "interface-panel-surface", type: "color" },
  { key: "interface-panel-hover-surface", type: "color" },
  { key: "interface-panel-selected-surface", type: "color" },
  { key: "interface-button-hover-surface", type: "color" },
];

const COMFY_DESIGN_SYSTEM_COLOR_FIELDS = [
  { key: "base-foreground", type: "color" },
  { key: "base-background", type: "color" },
  { key: "muted-foreground", type: "color" },
  { key: "muted-background", type: "color" },
  { key: "secondary-background", type: "color" },
  { key: "secondary-background-hover", type: "color" },
  { key: "secondary-background-selected", type: "color" },
  { key: "primary-background", type: "color" },
  { key: "primary-background-hover", type: "color" },
  { key: "destructive-background", type: "color" },
  { key: "destructive-background-hover", type: "color" },
  { key: "warning-background", type: "color" },
  { key: "warning-background-hover", type: "color" },
  { key: "success-background", type: "color" },
  { key: "border-default", type: "color" },
  { key: "border-subtle", type: "color" },
  { key: "interface-menu-component-surface-hovered", type: "color" },
  { key: "interface-menu-component-surface-selected", type: "color" },
  { key: "modal-card-background", type: "color" },
  { key: "modal-card-background-hovered", type: "color" },
  { key: "modal-card-border-highlighted", type: "color" },
  { key: "modal-panel-background", type: "color" },
  { key: "accent-background", type: "color" },
  { key: "accent-primary", type: "color" },
];

const COMFY_STYLE_FIELDS = [
  { key: "bar-shadow", type: "text", placeholder: "box-shadow CSS value" },
  { key: "interface-panel-box-shadow", type: "text", placeholder: "0 0 0.5rem rgba(16,16,16,0.5)" },
  { key: "interface-panel-drop-shadow", type: "text", placeholder: "0 16px 24px rgba(0,0,0,0.32)" },
  { key: "bg-img", type: "text", placeholder: "url('...')" },
];

const COMFY_TYPOGRAPHY_FIELDS = [
  { key: "font-inter", type: "text", placeholder: "'Inter', sans-serif" },
  { key: "comfy-textarea-font-size", type: "text", placeholder: "13px" },
  { key: "comfy-tree-explorer-item-padding", type: "text", placeholder: "6px 4px" },
  { key: "comfy-topbar-height", type: "text", placeholder: "2.5rem" },
  { key: "comfy-widget-min-height", type: "text", placeholder: "24" },
  { key: "comfy-widget-max-height", type: "text", placeholder: "320" },
  { key: "comfy-widget-height", type: "text", placeholder: "auto" },
  { key: "comfy-img-preview-width", type: "text", placeholder: "384px" },
  { key: "comfy-img-preview-height", type: "text", placeholder: "256px" },
];

const runtime = {
  library: null,
  loadPromise: null,
  persistTimer: null,
  persistPromise: null,
  bundledThemes: null,
  bundledThemesPromise: null,
  providersPromise: null,
  providerIndex: {},
  previewIndexLoaded: false,
  previewIndexPromise: null,
  previewByKey: {},
  studioDialog: null,
  cssLoaded: false,
  vuePromise: null,
};

const log = (...args) => console.log("%c[ThemeLab]", "color:#8AF;font-weight:700", ...args);
const warn = (...args) => console.warn("[ThemeLab]", ...args);
const errorLog = (...args) => console.error("[ThemeLab]", ...args);

const clone = (obj) => JSON.parse(JSON.stringify(obj));

function cleanPreviewKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "");
}

function slugifyThemeName(value, fallback = "theme") {
  const slug = cleanPreviewKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function previewKeyCandidates(value) {
  const raw = cleanPreviewKey(value);
  if (!raw) {
    return [];
  }

  const slug = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = raw.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([raw, slug, compact].filter(Boolean)));
}

function getPreviewExtPriority(path) {
  const ext = String(path || "").split(".").pop()?.toLowerCase() || "";
  if (ext === "avif" || ext === "webp") {
    return 4;
  }
  if (ext === "png") {
    return 3;
  }
  if (ext === "jpg" || ext === "jpeg") {
    return 2;
  }
  if (ext === "gif") {
    return 1;
  }
  return 0;
}

function getPreviewPathFromTheme(theme) {
  if (!theme || typeof theme !== "object") {
    return "";
  }

  const explicit = String(theme.preview?.image_file || "").trim();
  if (explicit) {
    return explicit;
  }

  const legacy = String(theme.preview_image || "").trim();
  if (legacy) {
    return legacy;
  }

  return "";
}

function normalizeBundledThemePreviewPath(path) {
  const raw = String(path || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.startsWith("bundled:")) {
    return raw;
  }

  if (/^(data:|blob:|https?:\/\/|\/)/i.test(raw)) {
    return raw;
  }

  const candidate = raw.includes("/") ? raw : `previews/${raw}`;
  return `bundled:${candidate.replace(/^\/+/, "")}`;
}

function normalizeUserDataPreviewPath(path) {
  const raw = String(path || "").trim();
  if (!raw) {
    return "";
  }
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(raw)) {
    return raw;
  }
  return raw.replace(/^\/+/, "");
}

function previewUrlFromPath(path, cacheBuster = "") {
  const normalized = normalizeUserDataPreviewPath(path);
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("bundled:")) {
    const bundledPath = normalized.slice("bundled:".length).replace(/^\/+/, "");
    try {
      const baseUrl = new URL(bundledPath, BUNDLED_THEME_ROOT_URL).href;
      if (!cacheBuster) {
        return baseUrl;
      }
      const sep = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${sep}v=${encodeURIComponent(String(cacheBuster))}`;
    } catch {
      return "";
    }
  }

  if (/^(data:|blob:|https?:\/\/|\/)/i.test(normalized)) {
    return normalized;
  }

  const route = `/userdata/${encodeURIComponent(normalized)}`;
  const baseUrl = typeof api?.apiURL === "function" ? api.apiURL(route) : route;
  if (!cacheBuster) {
    return baseUrl;
  }

  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}v=${encodeURIComponent(String(cacheBuster))}`;
}

function ensureThemePreview(theme) {
  if (!theme || typeof theme !== "object") {
    return { image_file: "" };
  }

  const preview = theme.preview && typeof theme.preview === "object" ? theme.preview : {};
  const direct = String(preview.image_file || "").trim();
  const legacy = String(theme.preview_image || "").trim();

  preview.image_file = direct || legacy || "";
  theme.preview = preview;
  return preview;
}

function pickPreviewFilename(record, file) {
  const extFromName = String(file?.name || "").match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mime = String(file?.type || "").toLowerCase();

  let ext = extFromName || "";
  if (!ext && mime === "image/jpeg") {
    ext = "jpg";
  } else if (!ext && mime === "image/png") {
    ext = "png";
  } else if (!ext && mime === "image/webp") {
    ext = "webp";
  } else if (!ext && mime === "image/avif") {
    ext = "avif";
  } else if (!ext && mime === "image/gif") {
    ext = "gif";
  }

  if (!ext) {
    ext = "png";
  }

  const baseName = slugifyThemeName(record?.name || record?.data?.name || record?.id, "theme-preview");
  return `${USER_PREVIEW_DIR}/${baseName}.${ext}`;
}

function rememberPreviewNamePath(themeName, path) {
  const normalizedPath = normalizeUserDataPreviewPath(path);
  if (!normalizedPath) {
    return;
  }
  for (const key of previewKeyCandidates(themeName)) {
    runtime.previewByKey[key] = normalizedPath;
  }
}

async function loadBundledThemes() {
  if (Array.isArray(runtime.bundledThemes)) {
    return runtime.bundledThemes;
  }

  if (runtime.bundledThemesPromise) {
    return runtime.bundledThemesPromise;
  }

  runtime.bundledThemesPromise = (async () => {
    let payload = null;
    try {
      const response = await fetch(BUNDLED_THEME_LIBRARY_URL, { cache: "no-store" });
      if (response.status === 404) {
        runtime.bundledThemes = [];
        return runtime.bundledThemes;
      }
      if (!response.ok) {
        warn(`Bundled theme library load returned ${response.status} ${response.statusText}`);
        runtime.bundledThemes = [];
        return runtime.bundledThemes;
      }
      payload = await response.json();
    } catch (bundledError) {
      warn("Unable to load bundled Theme Lab library", bundledError);
      runtime.bundledThemes = [];
      return runtime.bundledThemes;
    }

    const sourceThemes = Array.isArray(payload?.themes)
      ? payload.themes
      : Array.isArray(payload)
        ? payload
        : [];

    const bundled = [];
    for (const [index, item] of sourceThemes.entries()) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = normalizeThemeRecord(item, index);
      record.source = "bundled";

      const preview = ensureThemePreview(record.data);
      if (preview.image_file) {
        preview.image_file = normalizeBundledThemePreviewPath(preview.image_file);
        rememberPreviewNamePath(record.name, preview.image_file);
      }

      bundled.push(record);
    }

    runtime.bundledThemes = bundled;
    return runtime.bundledThemes;
  })().finally(() => {
    runtime.bundledThemesPromise = null;
  });

  return runtime.bundledThemesPromise;
}

async function mergeBundledThemesIntoLibrary(library) {
  const bundledThemes = await loadBundledThemes();
  if (!bundledThemes.length || !library?.themes) {
    return false;
  }

  const existingIds = new Set(library.themes.map((record) => String(record?.id || "")));
  let changed = false;

  for (const record of bundledThemes) {
    if (!record?.id || existingIds.has(record.id)) {
      continue;
    }
    library.themes.push(clone(record));
    existingIds.add(record.id);
    changed = true;
  }

  if (!library.activeThemeId && library.themes.length) {
    library.activeThemeId = library.themes[0].id;
    changed = true;
  }

  if (changed) {
    library.updatedAt = nowIso();
  }

  return changed;
}

async function ensurePreviewIndexLoaded({ force = false } = {}) {
  if (runtime.previewIndexLoaded && !force) {
    return runtime.previewByKey;
  }

  if (runtime.previewIndexPromise) {
    return runtime.previewIndexPromise;
  }

  runtime.previewIndexPromise = (async () => {
    const seed = { ...(runtime.previewByKey || {}) };
    const next = {};

    if (typeof api?.listUserDataFullInfo === "function") {
      try {
        const files = await api.listUserDataFullInfo(USER_PREVIEW_DIR);
        const bestByKey = {};

        for (const file of files || []) {
          const rawPath = String(file?.path || "").trim();
          if (!rawPath) {
            continue;
          }

          const fullPath = rawPath.startsWith(`${USER_PREVIEW_DIR}/`) ? rawPath : `${USER_PREVIEW_DIR}/${rawPath}`;
          const filename = fullPath.split("/").pop() || "";
          const base = filename.replace(/\.[^.]+$/, "");
          const priority = getPreviewExtPriority(fullPath);

          for (const key of previewKeyCandidates(base)) {
            const current = bestByKey[key];
            if (!current || priority >= current.priority) {
              bestByKey[key] = { path: fullPath, priority };
            }
          }
        }

        for (const [key, info] of Object.entries(bestByKey)) {
          next[key] = info.path;
        }
      } catch (previewError) {
        warn("Failed to index Theme Lab preview images", previewError);
      }
    }

    runtime.previewByKey = { ...seed, ...next };
    runtime.previewIndexLoaded = true;
    return runtime.previewByKey;
  })().finally(() => {
    runtime.previewIndexPromise = null;
  });

  return runtime.previewIndexPromise;
}

function getThemePreviewUrl(record) {
  const theme = record?.data ?? record;
  if (!theme || typeof theme !== "object") {
    return "";
  }

  const explicit = getPreviewPathFromTheme(theme);
  if (explicit) {
    return previewUrlFromPath(explicit, record?.updatedAt || theme?.updatedAt || "");
  }

  const name = String(record?.name || theme?.name || "").trim();
  for (const key of previewKeyCandidates(name)) {
    const indexed = runtime.previewByKey[key];
    if (indexed) {
      return previewUrlFromPath(indexed, record?.updatedAt || "");
    }
  }

  return "";
}

function buildVueRuntimeCandidates() {
  const candidates = [];

  const files = [
    "assets/lib/vue/dist/vue.esm-browser.prod.js",
    "assets/lib/vue/dist/vue.runtime.esm-browser.prod.js",
  ];

  const pathname = String(location?.pathname || "/");
  const basePath = pathname.endsWith("/") ? pathname : pathname.replace(/[^/]*$/, "/");
  const prefixes = ["/"];
  if (basePath && basePath !== "/") {
    prefixes.push(basePath);
  }

  for (const prefix of prefixes) {
    for (const file of files) {
      const path = `${prefix}${file}`.replace(/\/{2,}/g, "/");
      candidates.push(new URL(path, location.origin).href);
    }
  }

  for (const file of files) {
    candidates.push(new URL(`./${file}`, location.href).href);
  }

  return Array.from(new Set(candidates));
}

async function getVueRuntime() {
  if (!runtime.vuePromise) {
    runtime.vuePromise = (async () => {
      const globalVue = globalThis.Vue;
      if (globalVue?.defineComponent && globalVue?.h) {
        return globalVue;
      }

      // On modern frontend builds, these runtime module paths are frequently unavailable.
      // Fall back immediately to native UI to avoid noisy 404 import errors.
      warn("Vue runtime unavailable; using native overlay fallback.");
      return null;
    })();
  }
  return runtime.vuePromise;
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix = "theme") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getManager() {
  return app?.extensionManager;
}

function tryExecuteCommand(commandId) {
  const manager = getManager();

  // Preferred path: directly toggle tab through workspace sidebar store if exposed.
  if (commandId === "Workspace.ToggleSidebarTab.themeLabTab") {
    const toggleSidebarTab = manager?.sidebarTab?.toggleSidebarTab;
    if (typeof toggleSidebarTab === "function") {
      try {
        toggleSidebarTab("themeLabTab");
        return true;
      } catch {
        // continue with command executors
      }
    }
  }

  const executors = [
    manager?.command?.execute,
    manager?.commands?.execute,
    manager?.command?.run,
    manager?.commands?.run,
  ];

  for (const exec of executors) {
    if (typeof exec !== "function") {
      continue;
    }
    try {
      exec.call(manager?.command ?? manager?.commands ?? manager, commandId);
      return true;
    } catch {
      // continue with fallback executors
    }
  }

  return false;
}

function getSetting(id, fallbackValue) {
  try {
    const value = getManager()?.setting?.get?.(id);
    return value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function isLivePreviewEnabled() {
  return Boolean(getSetting(SETTINGS.LIVE_PREVIEW, true));
}

function isBottomPanelEnabled() {
  return Boolean(getSetting(SETTINGS.BOTTOM_PANEL, true));
}

function shouldConfirmReset() {
  return Boolean(getSetting(SETTINGS.RESET_CONFIRM, true));
}

function showToast({ severity = "info", summary = "Theme Lab", detail = "", life = 2600 } = {}) {
  const toast = getManager()?.toast;
  if (typeof toast?.add === "function") {
    toast.add({ severity, summary, detail, life });
    return;
  }

  const message = `${summary}: ${detail}`;
  if (severity === "error") {
    errorLog(message);
  } else if (severity === "warn") {
    warn(message);
  } else {
    log(message);
  }
}

async function confirmDialog({ title, message, type = "default" }) {
  const dialog = getManager()?.dialog;
  if (typeof dialog?.confirm === "function") {
    try {
      const result = await dialog.confirm({ title, message, type });
      return result === true;
    } catch {
      return false;
    }
  }

  try {
    return window.confirm(`${title}\n\n${message}`);
  } catch {
    return false;
  }
}

async function promptDialog({ title, message, defaultValue = "" }) {
  const dialog = getManager()?.dialog;
  if (typeof dialog?.prompt === "function") {
    try {
      return await dialog.prompt({ title, message, defaultValue });
    } catch {
      return null;
    }
  }

  try {
    return window.prompt(`${title}\n\n${message}`, defaultValue);
  } catch {
    return null;
  }
}

function loadCssOnce() {
  if (runtime.cssLoaded) {
    return;
  }

  const id = "themelab-css";
  if (document.getElementById(id)) {
    runtime.cssLoaded = true;
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `${BASE}theme-lab.css`;
  document.head.appendChild(link);
  runtime.cssLoaded = true;
}

function migrateTheme(themeLike) {
  const base = clone(TEMPLATE);
  const input = themeLike && typeof themeLike === "object" ? themeLike : {};

  try {
    for (const section of Object.keys(base.colors)) {
      if (section === "extensions") {
        continue;
      }
      if (input.colors?.[section]) {
        Object.assign(base.colors[section], input.colors[section]);
      }
    }

    if (input.colors?.extensions && typeof input.colors.extensions === "object") {
      base.colors.extensions = clone(input.colors.extensions);
    }

    if (input.custom_css && typeof input.custom_css === "object") {
      base.custom_css.scope = input.custom_css.scope ?? base.custom_css.scope;
      base.custom_css.vars = Array.isArray(input.custom_css.vars) ? clone(input.custom_css.vars) : [];
      base.custom_css.raw = input.custom_css.raw ?? "";
    }

    ensureThemePreview(base);
    if (input.preview && typeof input.preview === "object") {
      base.preview.image_file = String(input.preview.image_file || base.preview.image_file || "").trim();
    } else if (input.preview_image) {
      base.preview.image_file = String(input.preview_image).trim();
    }

    if (input.id) {
      base.id = String(input.id);
    }

    if (input.name) {
      base.name = String(input.name);
    }
  } catch {
    // keep defaults if migration fails
  }

  return base;
}

function normalizeThemeRecord(rawRecord, index = 0) {
  const source = rawRecord && typeof rawRecord === "object" ? rawRecord : {};
  const candidateTheme = source.data ?? source.theme ?? source;
  const data = migrateTheme(candidateTheme);

  const fallbackName = data.name || `Theme ${index + 1}`;
  const id = String(source.id || data.id || uid("theme"));
  const name = String(source.name || fallbackName);

  data.id = id;
  data.name = name;

  const createdAt = source.createdAt ? String(source.createdAt) : nowIso();
  const updatedAt = source.updatedAt ? String(source.updatedAt) : createdAt;

  return {
    id,
    name,
    createdAt,
    updatedAt,
    data,
  };
}

function normalizeLibrary(input) {
  const base = {
    version: 2,
    activeThemeId: "",
    themes: [],
    updatedAt: nowIso(),
  };

  const source = input && typeof input === "object" ? input : {};

  let sourceThemes = [];
  if (Array.isArray(source.themes)) {
    sourceThemes = source.themes;
  } else if (Array.isArray(source)) {
    sourceThemes = source;
  } else if (source.theme) {
    sourceThemes = [source.theme];
  }

  base.themes = sourceThemes.map((theme, index) => normalizeThemeRecord(theme, index));

  if (!base.themes.length) {
    const defaultTheme = migrateTheme(clone(TEMPLATE));
    const record = normalizeThemeRecord(defaultTheme, 0);
    base.themes = [record];
  }

  const activeFromSource = source.activeThemeId ? String(source.activeThemeId) : "";
  const activeExists = base.themes.some((record) => record.id === activeFromSource);
  base.activeThemeId = activeExists ? activeFromSource : base.themes[0].id;
  base.updatedAt = source.updatedAt ? String(source.updatedAt) : nowIso();

  return base;
}

function libraryFromLegacyStorage() {
  try {
    const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return normalizeLibrary(parsed);
    }
  } catch {
    // continue with legacy key
  }

  let legacyTheme = null;
  try {
    legacyTheme = JSON.parse(localStorage.getItem(LEGACY_CURRENT_KEY) || "null");
  } catch {
    legacyTheme = null;
  }

  if (legacyTheme && typeof legacyTheme === "object") {
    const record = normalizeThemeRecord(legacyTheme, 0);
    return {
      version: 2,
      activeThemeId: record.id,
      themes: [record],
      updatedAt: nowIso(),
    };
  }

  return normalizeLibrary(null);
}

function getLibrary() {
  if (!runtime.library) {
    runtime.library = libraryFromLegacyStorage();
  }
  return runtime.library;
}

function getThemeRecords() {
  return getLibrary().themes;
}

function getThemeRecordById(id) {
  return getThemeRecords().find((record) => record.id === id) || null;
}

function getActiveThemeRecord() {
  const library = getLibrary();
  const record = getThemeRecordById(library.activeThemeId);
  if (record) {
    return record;
  }

  if (!library.themes.length) {
    const defaultRecord = normalizeThemeRecord(clone(TEMPLATE), 0);
    library.themes.push(defaultRecord);
  }

  library.activeThemeId = library.themes[0].id;
  return library.themes[0];
}

function getActiveTheme() {
  return getActiveThemeRecord().data;
}

function markRecordUpdated(record) {
  record.updatedAt = nowIso();
  record.name = String(record.data?.name || record.name || "Theme");
  record.data.name = record.name;
  record.data.id = record.id;

  const library = getLibrary();
  library.updatedAt = nowIso();
}

function setActiveThemeId(id, { apply = false } = {}) {
  const library = getLibrary();
  const record = getThemeRecordById(id);
  if (!record) {
    return null;
  }

  library.activeThemeId = record.id;
  library.updatedAt = nowIso();
  scheduleLibraryPersist();

  if (apply) {
    applyTheme(record.data);
  }

  return record;
}

function createThemeRecord({ baseTheme = null, name = "New Theme" } = {}) {
  const data = migrateTheme(baseTheme || clone(TEMPLATE));
  const id = uid("theme");

  data.id = id;
  data.name = String(name || "New Theme");

  return {
    id,
    name: data.name,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    data,
  };
}

function createTheme({ baseTheme = null, name = "New Theme" } = {}) {
  const library = getLibrary();
  const record = createThemeRecord({ baseTheme, name });
  library.themes.unshift(record);
  library.activeThemeId = record.id;
  library.updatedAt = nowIso();
  scheduleLibraryPersist();
  return record;
}

function duplicateTheme(id) {
  const source = getThemeRecordById(id) || getActiveThemeRecord();
  if (!source) {
    return null;
  }

  return createTheme({
    baseTheme: clone(source.data),
    name: `${source.name} Copy`,
  });
}

function renameTheme(id, newName) {
  const record = getThemeRecordById(id);
  if (!record) {
    return null;
  }

  const name = String(newName || "").trim();
  if (!name) {
    return null;
  }

  record.name = name;
  record.data.name = name;
  markRecordUpdated(record);
  scheduleLibraryPersist();
  return record;
}

function deleteTheme(id) {
  const library = getLibrary();
  if (library.themes.length <= 1) {
    return false;
  }

  const index = library.themes.findIndex((record) => record.id === id);
  if (index === -1) {
    return false;
  }

  library.themes.splice(index, 1);

  if (!library.themes.some((record) => record.id === library.activeThemeId)) {
    library.activeThemeId = library.themes[0]?.id || "";
  }

  library.updatedAt = nowIso();
  scheduleLibraryPersist();
  return true;
}

function resetActiveTheme() {
  const record = getActiveThemeRecord();
  const fresh = migrateTheme(clone(TEMPLATE));
  fresh.id = record.id;
  fresh.name = record.name;
  record.data = fresh;
  markRecordUpdated(record);
  scheduleLibraryPersist();
  return record;
}

function syncLegacyCurrentTheme() {
  try {
    localStorage.setItem(LEGACY_CURRENT_KEY, JSON.stringify(getActiveTheme()));
  } catch {
    // ignore localStorage failures
  }
}

async function persistLibraryNow() {
  const library = getLibrary();
  const json = JSON.stringify(library, null, 2);

  try {
    localStorage.setItem(LIBRARY_CACHE_KEY, json);
  } catch {
    // ignore localStorage failures
  }

  syncLegacyCurrentTheme();

  try {
    await api.storeUserData(USER_LIBRARY_FILE, json, { stringify: false });
  } catch (persistError) {
    warn("Failed to store theme library in user data", persistError);
  }
}

function scheduleLibraryPersist(delayMs = 350) {
  if (runtime.persistTimer) {
    clearTimeout(runtime.persistTimer);
  }

  runtime.persistTimer = setTimeout(() => {
    runtime.persistTimer = null;
    runtime.persistPromise = persistLibraryNow().finally(() => {
      runtime.persistPromise = null;
    });
  }, delayMs);
}

async function ensureLibraryLoaded() {
  if (runtime.library) {
    return runtime.library;
  }

  if (!runtime.loadPromise) {
    runtime.loadPromise = (async () => {
      let library = null;
      let loadedFromUserData = false;
      let mergedBundled = false;

      try {
        const response = await api.getUserData(USER_LIBRARY_FILE);
        if (response.status === 200) {
          const parsed = await response.json();
          library = normalizeLibrary(parsed);
          loadedFromUserData = true;
        } else if (response.status !== 404) {
          warn(`Theme library load returned ${response.status} ${response.statusText}`);
        }
      } catch (loadError) {
        warn("Unable to load Theme Lab library from user data", loadError);
      }

      if (!library) {
        library = libraryFromLegacyStorage();
      }

      mergedBundled = await mergeBundledThemesIntoLibrary(library);

      runtime.library = library;
      syncLegacyCurrentTheme();

      if (!loadedFromUserData || mergedBundled) {
        scheduleLibraryPersist(0);
      }

      return runtime.library;
    })().finally(() => {
      runtime.loadPromise = null;
    });
  }

  return runtime.loadPromise;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

function exportThemeRecord(record) {
  if (!record) {
    return;
  }
  const fileName = `${record.name.replace(/\s+/g, "-") || "Theme"}.json`;
  downloadJson(fileName, record.data);
}

function exportThemeLibrary() {
  const payload = {
    version: 2,
    exportedAt: nowIso(),
    activeThemeId: getLibrary().activeThemeId,
    themes: getThemeRecords(),
  };
  downloadJson("theme-lab-library.json", payload);
}

function pickJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    const done = (file) => {
      input.remove();
      resolve(file || null);
    };

    input.onchange = () => done(input.files?.[0] || null);
    input.oncancel = () => done(null);

    document.body.appendChild(input);
    input.click();
  });
}

function pickImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/avif,image/gif,image/*";
    input.style.display = "none";

    const done = (file) => {
      input.remove();
      resolve(file || null);
    };

    input.onchange = () => done(input.files?.[0] || null);
    input.oncancel = () => done(null);

    document.body.appendChild(input);
    input.click();
  });
}

async function setThemePreviewFromFile(record, file) {
  if (!record || !file) {
    return false;
  }

  const fileName = pickPreviewFilename(record, file);

  try {
    await api.storeUserData(fileName, file, {
      overwrite: true,
      stringify: false,
      throwOnError: true,
    });
  } catch (persistError) {
    warn("Failed to store theme preview image", persistError);
    showToast({
      severity: "error",
      summary: "Theme Lab",
      detail: "Could not save preview image.",
    });
    return false;
  }

  const preview = ensureThemePreview(record.data);
  preview.image_file = fileName;

  rememberPreviewNamePath(record.name, fileName);
  markRecordUpdated(record);
  scheduleLibraryPersist();

  showToast({
    severity: "success",
    summary: "Theme Lab",
    detail: "Preview image saved.",
  });
  return true;
}

async function setThemePreviewFromPicker(record) {
  const file = await pickImageFile();
  if (!file) {
    return false;
  }
  return setThemePreviewFromFile(record, file);
}

function clearThemePreview(record) {
  if (!record?.data) {
    return false;
  }

  const preview = ensureThemePreview(record.data);
  const hadPreview = Boolean(preview.image_file);
  preview.image_file = "";

  if (!hadPreview) {
    return false;
  }

  markRecordUpdated(record);
  scheduleLibraryPersist();
  showToast({
    severity: "success",
    summary: "Theme Lab",
    detail: "Preview image cleared.",
  });
  return true;
}

function importThemesFromPayload(payload) {
  const added = [];

  const addOne = (item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    const record = normalizeThemeRecord(item, getThemeRecords().length + added.length);
    // ensure unique IDs in current library
    if (getThemeRecordById(record.id) || added.some((entry) => entry.id === record.id)) {
      record.id = uid("theme");
      record.data.id = record.id;
    }
    added.push(record);
  };

  if (Array.isArray(payload?.themes)) {
    for (const item of payload.themes) {
      addOne(item);
    }
  } else {
    addOne(payload);
  }

  if (!added.length) {
    return 0;
  }

  const library = getLibrary();
  library.themes.unshift(...added);
  library.activeThemeId = added[0].id;
  library.updatedAt = nowIso();
  scheduleLibraryPersist();

  return added.length;
}

async function importThemesFromFilePicker() {
  const file = await pickJsonFile();
  if (!file) {
    return 0;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const count = importThemesFromPayload(payload);
    if (count > 0) {
      showToast({ severity: "success", summary: "Theme Lab", detail: `Imported ${count} theme${count > 1 ? "s" : ""}.` });
    } else {
      showToast({ severity: "warn", summary: "Theme Lab", detail: "No valid themes found in file." });
    }
    return count;
  } catch (importError) {
    showToast({ severity: "error", summary: "Theme Lab", detail: "Invalid JSON file." });
    warn("Import failed", importError);
    return 0;
  }
}

function parseProviderUrls() {
  const raw = String(getSetting(SETTINGS.PROVIDER_URLS, "") || "").trim();
  if (!raw) {
    return [...DEFAULT_PROVIDER_URLS];
  }

  const custom = raw
    .split(/[\n,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_PROVIDER_URLS, ...custom]));
}

function compatManifest(json) {
  const out = {
    id: json.id || "ext",
    title: json.title || "Extension",
    sections: {},
  };

  if (json.sections && typeof json.sections === "object") {
    out.sections = json.sections;
    return out;
  }

  if (Array.isArray(json.groups)) {
    for (const group of json.groups) {
      const items = (group.items || []).map((item) => ({
        key: item.key,
        label: item.label || item.key,
        type: item.type || "text",
        default: item.default,
        cssVar: item.cssVar,
        step: item.step,
        placeholder: item.placeholder,
      }));
      out.sections[group.title || "Theme"] = items;
    }
    return out;
  }

  if (Array.isArray(json.fields)) {
    out.sections.Theme = json.fields.map((item) => ({
      key: item.key,
      label: item.label || item.key,
      type: item.type || "text",
      default: item.default,
      cssVar: item.cssVar,
      step: item.step,
      placeholder: item.placeholder,
    }));
    return out;
  }

  const items = Object.keys(json || {})
    .filter((key) => !["id", "title"].includes(key))
    .map((key) => ({
      key,
      label: key,
      type: typeof json[key] === "string" && json[key].startsWith("#") ? "color" : "text",
      default: json[key],
    }));

  out.sections.Theme = items;
  return out;
}

async function loadProviders() {
  const found = [];
  const seen = new Set();

  for (const url of parseProviderUrls()) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const manifest = compatManifest(await response.json());
      const key = `${(manifest.id || "").toLowerCase()}:${(manifest.title || "").toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      found.push(manifest);
    } catch {
      // ignore failed provider URL
    }
  }

  return found;
}

function getProviders() {
  if (!runtime.providersPromise) {
    runtime.providersPromise = loadProviders().then((providers) => {
      runtime.providerIndex = {};
      for (const provider of providers) {
        runtime.providerIndex[provider.id] = provider;
      }
      return providers;
    }).catch((providerError) => {
      runtime.providersPromise = null;
      warn("Provider load failed", providerError);
      return [];
    });
  }
  return runtime.providersPromise;
}

function applyComfyBase(colors) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors || {})) {
    if (typeof value !== "string") {
      continue;
    }
    root.style.setProperty(`--${key}`, value);
    if (!key.startsWith("comfy-")) {
      root.style.setProperty(`--comfy-${key}`, value);
    }
  }
}

function applyNodeSlotColors(slotColors) {
  const palette = slotColors || {};

  try {
    const canvasColors = app?.canvas?.default_connection_color_byType;
    if (canvasColors && typeof canvasColors === "object") {
      Object.assign(canvasColors, palette);
    }
  } catch {
    // ignore
  }

  try {
    const litegraph = window.LiteGraph;
    if (litegraph?.NODE_SLOT_COLORS && typeof litegraph.NODE_SLOT_COLORS === "object") {
      Object.assign(litegraph.NODE_SLOT_COLORS, palette);
    }
  } catch {
    // ignore
  }
}

function applyLiteGraph(litegraphColors) {
  const litegraph = window.LiteGraph;
  if (!litegraph) {
    return;
  }

  for (const [key, value] of Object.entries(litegraphColors || {})) {
    if (key in litegraph) {
      litegraph[key] = value;
    }
  }

  try {
    app.graph?.setDirtyCanvas(true, true);
  } catch {
    // ignore
  }
}

function ensureStyleTag(id = "themelab-custom-css-style") {
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = id;
    document.head.appendChild(styleTag);
  }
  return styleTag;
}

function applyCustomCSS(customCss) {
  if (!customCss) {
    return;
  }

  let scope = (customCss.scope || ":root").trim() || ":root";
  let targets = [];

  try {
    targets = scope === ":root" ? [document.documentElement] : Array.from(document.querySelectorAll(scope));
  } catch {
    scope = ":root";
    targets = [document.documentElement];
  }

  const vars = Array.isArray(customCss.vars) ? customCss.vars : [];
  for (const el of targets) {
    for (const { name, value } of vars) {
      if (!name) {
        continue;
      }
      const property = name.startsWith("--") ? name : `--${name}`;
      try {
        el.style.setProperty(property, String(value ?? ""));
      } catch {
        // ignore
      }
    }
  }

  ensureStyleTag().textContent = String(customCss.raw || "");
}

function applyExtensionVars(extensionValues) {
  const root = document.documentElement;

  for (const [providerId, valueMap] of Object.entries(extensionValues || {})) {
    const manifest = runtime.providerIndex[providerId];
    if (!manifest) {
      continue;
    }

    for (const sectionItems of Object.values(manifest.sections || {})) {
      for (const item of sectionItems || []) {
        const cssVar = item.cssVar;
        if (!cssVar) {
          continue;
        }

        const key = item.key;
        if (!Object.prototype.hasOwnProperty.call(valueMap || {}, key)) {
          continue;
        }

        root.style.setProperty(cssVar, valueMap[key]);
      }
    }
  }
}

function applyTheme(theme = getActiveTheme()) {
  applyComfyBase(theme.colors?.comfy_base);
  applyNodeSlotColors(theme.colors?.node_slot);
  applyLiteGraph(theme.colors?.litegraph_base);
  applyExtensionVars(theme.colors?.extensions);
  applyCustomCSS(theme.custom_css);
}

function isThemeLabPaletteId(id) {
  const value = String(id || "");
  return COMFY_THEME_LAB_COMPAT_IDS.includes(value);
}

function buildComfyPaletteId(record, { currentPaletteId = "" } = {}) {
  void record;
  void currentPaletteId;
  return COMFY_THEME_LAB_ID;
}

function inferComfyLightTheme(theme) {
  const comfy = theme?.colors?.comfy_base || {};
  const bgHex = parseHexColor(comfy["bg-color"] || comfy["base-background"] || "", { allowAlpha: true });
  if (!bgHex) {
    return false;
  }
  const body = bgHex.slice(1, 7);
  const r = Number.parseInt(body.slice(0, 2), 16);
  const g = Number.parseInt(body.slice(2, 4), 16);
  const b = Number.parseInt(body.slice(4, 6), 16);
  const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
  return luma >= 160;
}

function buildComfyPaletteFromRecord(record, paletteId = buildComfyPaletteId(record)) {
  const data = record?.data || {};
  return {
    id: paletteId,
    name: String(record?.name || data?.name || "Theme Lab Theme"),
    light_theme: inferComfyLightTheme(data),
    colors: {
      node_slot: clone(data?.colors?.node_slot || {}),
      litegraph_base: clone(data?.colors?.litegraph_base || {}),
      comfy_base: clone(data?.colors?.comfy_base || {}),
    },
  };
}

function buildPaletteAlias(palette, aliasId) {
  if (!palette || !aliasId) {
    return null;
  }
  const alias = clone(palette);
  alias.id = aliasId;
  return alias;
}

function addThemeLabPaletteEntries(targetMap, sourceRecord, primaryId) {
  const mainId = primaryId || COMFY_THEME_LAB_ID;
  const mainPalette = buildComfyPaletteFromRecord(sourceRecord, mainId);
  targetMap[mainPalette.id] = mainPalette;

  for (const compatId of COMFY_THEME_LAB_COMPAT_IDS) {
    if (compatId === mainPalette.id) {
      continue;
    }
    const compatAlias = buildPaletteAlias(mainPalette, compatId);
    if (compatAlias) {
      targetMap[compatAlias.id] = compatAlias;
    }
  }

  return mainPalette;
}

function normalizeCustomPaletteMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return clone(value);
}

function pruneLegacyThemeLabPalettes(palettes, activeId) {
  const next = normalizeCustomPaletteMap(palettes);
  for (const key of Object.keys(next)) {
    if (key === activeId) {
      continue;
    }
    if (key === DEFAULT_THEME_ID || key.startsWith("themelab-")) {
      delete next[key];
    }
  }
  return next;
}

async function setComfySettingValue(id, value) {
  const settingApi = getManager()?.setting;
  const managerSetter = settingApi?.set;
  if (typeof managerSetter === "function") {
    try {
      await Promise.resolve(managerSetter.call(settingApi, id, value));
      return true;
    } catch (settingError) {
      warn(`Failed to set ${id} through extension manager`, settingError);
    }
  }

  if (typeof api?.storeSetting === "function") {
    try {
      const response = await api.storeSetting(id, value);
      return response?.ok !== false;
    } catch (apiError) {
      warn(`Failed to set ${id} through API`, apiError);
    }
  }

  return false;
}

async function getComfySettingValue(id, fallbackValue) {
  const settingApi = getManager()?.setting;
  const managerGetter = settingApi?.get;
  if (typeof managerGetter === "function") {
    try {
      const value = managerGetter.call(settingApi, id);
      if (value !== undefined) {
        return value;
      }
    } catch (settingError) {
      warn(`Failed to read ${id} through extension manager`, settingError);
    }
  }

  if (typeof api?.getSetting === "function") {
    try {
      const value = await api.getSetting(id);
      if (value !== undefined) {
        return value;
      }
    } catch (apiError) {
      warn(`Failed to read ${id} through API`, apiError);
    }
  }

  return fallbackValue;
}

async function exportPaletteToComfyThemeFolder(palette) {
  if (!palette || typeof api?.storeUserData !== "function") {
    return false;
  }

  try {
    await api.storeUserData(USER_COMFY_THEME_FILE, palette, {
      overwrite: true,
      stringify: true,
      throwOnError: false,
    });
    return true;
  } catch (persistError) {
    warn("Failed to export palette into Comfy user themes folder", persistError);
    return false;
  }
}

async function cleanupLegacyThemeLabThemeFiles() {
  if (typeof api?.listUserDataFullInfo !== "function" || typeof api?.deleteUserData !== "function") {
    return;
  }

  try {
    const files = await api.listUserDataFullInfo(USER_COMFY_THEME_DIR);
    const keepPath = USER_COMFY_THEME_FILE.toLowerCase();
    for (const entry of files || []) {
      const path = String(entry?.path || "");
      const lowerPath = path.toLowerCase();
      if (!lowerPath.startsWith(`${USER_COMFY_THEME_DIR}/`)) {
        continue;
      }
      if (lowerPath === keepPath) {
        continue;
      }
      if (!(lowerPath.endsWith(".json"))) {
        continue;
      }

      const fileName = lowerPath.slice((`${USER_COMFY_THEME_DIR}/`).length);
      const isLegacyThemeLabFile =
        fileName.startsWith("themelab-")
        || fileName === `${DEFAULT_THEME_ID}.json`
        || fileName.startsWith("theme lab");
      if (!isLegacyThemeLabFile) {
        continue;
      }
      await api.deleteUserData(path);
    }
  } catch (cleanupError) {
    warn("Failed to cleanup legacy Theme Lab exports from Comfy themes folder", cleanupError);
  }
}

async function repairMissingThemeLabPalette({ notify = false } = {}) {
  const activePaletteId = await getComfySettingValue(
    COMFY_SETTING_COLOR_PALETTE,
    getSetting(COMFY_SETTING_COLOR_PALETTE, ""),
  );
  if (!isThemeLabPaletteId(activePaletteId)) {
    return true;
  }

  const storedPalettes = await getComfySettingValue(
    COMFY_SETTING_CUSTOM_PALETTES,
    getSetting(COMFY_SETTING_CUSTOM_PALETTES, {}),
  );
  let currentPalettes = normalizeCustomPaletteMap(storedPalettes);
  const alreadyRepaired = COMFY_THEME_LAB_COMPAT_IDS.every((id) => Boolean(currentPalettes[id]));
  if (alreadyRepaired) {
    return true;
  }

  currentPalettes = pruneLegacyThemeLabPalettes(currentPalettes, COMFY_THEME_LAB_ID);
  const palette = addThemeLabPaletteEntries(currentPalettes, getActiveThemeRecord(), COMFY_THEME_LAB_ID);

  const palettesOk = await setComfySettingValue(COMFY_SETTING_CUSTOM_PALETTES, currentPalettes);
  if (palettesOk) {
    syncRuntimeColorPaletteStore(currentPalettes, COMFY_THEME_LAB_ID);
  }
  const activeOk = palettesOk
    ? await setComfySettingValue(COMFY_SETTING_COLOR_PALETTE, COMFY_THEME_LAB_ID)
    : false;
  const exportOk = palettesOk ? await exportPaletteToComfyThemeFolder(palette) : false;
  if (exportOk) {
    await cleanupLegacyThemeLabThemeFiles();
  }

  const success = palettesOk && activeOk && exportOk;
  if (notify && !success) {
    showToast({
      severity: "warn",
      summary: "Theme Lab",
      detail: "Theme palette repair failed. Click Apply in Theme Lab once to resync.",
    });
  }
  return success;
}

function syncRuntimeColorPaletteStore(customPalettes, activePaletteId) {
  const piniaCandidates = [
    getManager()?.store?.$pinia,
    getManager()?.stores?.$pinia,
    getManager()?.$pinia,
    app?.$pinia,
    globalThis?.pinia,
    globalThis?.__PINIA__,
  ];

  for (const pinia of piniaCandidates) {
    const stateRoot = pinia?.state?.value;
    if (!stateRoot || typeof stateRoot !== "object") {
      continue;
    }

    for (const state of Object.values(stateRoot)) {
      if (!state || typeof state !== "object") {
        continue;
      }

      if (!("customPalettes" in state) || !("activePaletteId" in state)) {
        continue;
      }

      try {
        state.customPalettes = clone(customPalettes);
        state.activePaletteId = activePaletteId;
        return true;
      } catch (syncError) {
        warn("Failed to sync runtime color palette store", syncError);
      }
    }
  }

  return false;
}

function refreshStylingAfterApply(theme, customPalettes, activePaletteId) {
  const refreshCanvas = () => {
    try {
      app?.graph?.setDirtyCanvas?.(true, true);
    } catch {
      // ignore
    }
    try {
      app?.canvas?.setDirty?.(true, true);
    } catch {
      // ignore
    }
    try {
      app?.canvas?.draw?.(true, true);
    } catch {
      // ignore
    }
  };

  // Reapply immediately, then again after potential async Comfy watchers run.
  applyTheme(theme);

  try {
    const isLight = inferComfyLightTheme(theme);
    document.body?.classList?.toggle("dark-theme", !isLight);
  } catch {
    // ignore
  }

  // Best effort sync for Comfy runtime palette store so components update without full page reload.
  syncRuntimeColorPaletteStore(customPalettes, activePaletteId);

  refreshCanvas();

  try {
    window.dispatchEvent(new Event("resize"));
  } catch {
    // ignore
  }

  try {
    requestAnimationFrame(() => {
      applyTheme(theme);
      refreshCanvas();
    });
  } catch {
    // ignore
  }

  setTimeout(() => {
    applyTheme(theme);
    refreshCanvas();
  }, 120);
}

async function applyThemeAndPersist(record = getActiveThemeRecord(), { notify = true, refresh = true } = {}) {
  const target = record?.data ? record : getActiveThemeRecord();
  if (!target?.data) {
    return false;
  }

  applyTheme(target.data);

  const activePaletteId = await getComfySettingValue(
    COMFY_SETTING_COLOR_PALETTE,
    getSetting(COMFY_SETTING_COLOR_PALETTE, ""),
  );
  const paletteId = buildComfyPaletteId(target, { currentPaletteId: activePaletteId });
  const storedPalettes = await getComfySettingValue(
    COMFY_SETTING_CUSTOM_PALETTES,
    getSetting(COMFY_SETTING_CUSTOM_PALETTES, {}),
  );
  const currentPalettes = pruneLegacyThemeLabPalettes(storedPalettes, paletteId);
  const palette = addThemeLabPaletteEntries(currentPalettes, target, paletteId);

  const palettesOk = await setComfySettingValue(COMFY_SETTING_CUSTOM_PALETTES, currentPalettes);
  if (palettesOk) {
    syncRuntimeColorPaletteStore(currentPalettes, COMFY_THEME_LAB_ID);
  }
  const activeOk = palettesOk
    ? await setComfySettingValue(COMFY_SETTING_COLOR_PALETTE, COMFY_THEME_LAB_ID)
    : false;
  const exportOk = palettesOk ? await exportPaletteToComfyThemeFolder(palette) : false;
  if (exportOk) {
    await cleanupLegacyThemeLabThemeFiles();
  }

  const success = palettesOk && activeOk && exportOk;
  if (notify) {
    if (success) {
      showToast({
        severity: "success",
        summary: "Theme Lab",
        detail: "Theme applied and synced to ComfyUI theme settings.",
      });
    } else {
      const detail = palettesOk && activeOk
        ? `Theme applied, but writing ${USER_COMFY_THEME_FILE} failed.`
        : "Theme applied locally, but ComfyUI theme sync failed.";
      showToast({
        severity: "warn",
        summary: "Theme Lab",
        detail,
      });
    }
  }

  if (success && refresh) {
    refreshStylingAfterApply(target.data, currentPalettes, palette.id);
  }

  return success;
}

function row(labelText) {
  const wrap = document.createElement("div");
  wrap.className = "tl-row";

  const label = document.createElement("label");
  label.textContent = labelText;

  const right = document.createElement("div");
  right.className = "tl-right";

  wrap.append(label, right);
  return { wrap, right };
}

function parseHexColor(value, { allowAlpha = true } = {}) {
  if (typeof value !== "string") {
    return null;
  }

  let raw = value.trim();
  if (!raw) {
    return null;
  }

  if (!raw.startsWith("#")) {
    raw = `#${raw}`;
  }

  const body = raw.slice(1);
  if (!/^[0-9a-f]+$/i.test(body)) {
    return null;
  }

  if (![3, 4, 6, 8].includes(body.length)) {
    return null;
  }

  if (!allowAlpha && (body.length === 4 || body.length === 8)) {
    return null;
  }

  const expanded = body.length <= 4
    ? body.split("").map((char) => `${char}${char}`).join("")
    : body;

  if (expanded.length !== 6 && expanded.length !== 8) {
    return null;
  }

  if (!allowAlpha && expanded.length !== 6) {
    return null;
  }

  return `#${expanded.toUpperCase()}`;
}

function normalizeHexColor(value, { allowAlpha = true, fallback = "#000000" } = {}) {
  const parsed = parseHexColor(value, { allowAlpha });
  if (parsed) {
    return parsed;
  }
  return parseHexColor(fallback, { allowAlpha: false }) || "#000000";
}

function colorInput(target, key, onAny) {
  const wrap = document.createElement("div");
  wrap.className = "tl-color-control";

  const picker = document.createElement("input");
  picker.type = "color";
  picker.className = "tl-color-picker";

  const hex = document.createElement("input");
  hex.type = "text";
  hex.className = "tl-color-hex";
  hex.placeholder = "#RRGGBB";
  hex.autocomplete = "off";
  hex.autocapitalize = "off";
  hex.spellcheck = false;

  const initial = normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
  hex.value = initial;
  picker.value = initial.slice(0, 7);

  picker.addEventListener("input", () => {
    const current = parseHexColor(target[key], { allowAlpha: true }) || parseHexColor(hex.value, { allowAlpha: true });
    const alpha = current && current.length === 9 ? current.slice(7) : "";
    const next = `${picker.value.toUpperCase()}${alpha}`;
    target[key] = next;
    hex.value = next;
    hex.classList.remove("is-invalid");
    onAny();
  });

  hex.addEventListener("input", () => {
    const parsed = parseHexColor(hex.value, { allowAlpha: true });
    if (!parsed) {
      hex.classList.add("is-invalid");
      return;
    }

    hex.classList.remove("is-invalid");

    const trimmed = String(hex.value || "").trim();
    const bodyLength = trimmed.startsWith("#") ? trimmed.length - 1 : trimmed.length;
    if (bodyLength !== 6 && bodyLength !== 8) {
      return;
    }

    target[key] = parsed;
    hex.value = parsed;
    picker.value = parsed.slice(0, 7);
    onAny();
  });

  hex.addEventListener("blur", () => {
    const parsed = parseHexColor(hex.value, { allowAlpha: true });
    if (!parsed) {
      const fallback = normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
      hex.value = fallback;
      picker.value = fallback.slice(0, 7);
      hex.classList.remove("is-invalid");
      return;
    }

    const normalizedTarget = normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
    target[key] = parsed;
    hex.value = parsed;
    picker.value = parsed.slice(0, 7);
    hex.classList.remove("is-invalid");
    if (parsed !== normalizedTarget) {
      onAny();
    }
  });

  wrap.append(picker, hex);
  return wrap;
}

function textInput(target, key, onAny, placeholder = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.value = target[key] ?? "";

  input.addEventListener("change", () => {
    target[key] = input.value;
    onAny();
  });

  return input;
}

function numberInput(target, key, onAny, step = 1) {
  const input = document.createElement("input");
  input.type = "number";
  input.step = String(step);
  input.value = target[key] ?? 0;

  input.addEventListener("change", () => {
    const parsed = Number(input.value);
    target[key] = Number.isFinite(parsed) ? parsed : 0;
    onAny();
  });

  return input;
}

function textareaInput(target, key, onAny, placeholder = "") {
  const textarea = document.createElement("textarea");
  textarea.className = "tl-textarea";
  textarea.placeholder = placeholder;
  textarea.value = target[key] ?? "";

  textarea.addEventListener("input", () => {
    target[key] = textarea.value;
    onAny();
  });

  return textarea;
}

function section(title) {
  const wrapper = document.createElement("div");
  wrapper.className = "tl-section";

  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.appendChild(heading);

  return wrapper;
}

function addColorGrid(body, title, objectRef, keys, onAny) {
  const sec = section(title);
  const grid = document.createElement("div");
  grid.className = "tl-grid";

  for (const key of keys) {
    const { wrap, right } = row(key);
    right.appendChild(colorInput(objectRef, key, onAny));
    grid.appendChild(wrap);
  }

  sec.appendChild(grid);
  body.appendChild(sec);
}

function addMixedGrid(body, title, objectRef, spec, onAny) {
  const sec = section(title);
  const grid = document.createElement("div");
  grid.className = "tl-grid";

  for (const field of spec) {
    const { key, type, step, placeholder } = field;
    const { wrap, right } = row(key);

    let input;
    if (type === "color") {
      input = colorInput(objectRef, key, onAny);
    } else if (type === "number") {
      input = numberInput(objectRef, key, onAny, step ?? 1);
    } else {
      input = textInput(objectRef, key, onAny, placeholder ?? "");
    }

    right.appendChild(input);
    grid.appendChild(wrap);
  }

  sec.appendChild(grid);
  body.appendChild(sec);
}

function buildAdvancedCssSection(body, theme, onAny) {
  const sec = section("Advanced CSS");

  const scope = row("Scope selector");
  scope.right.appendChild(textInput(theme.custom_css, "scope", onAny, ":root"));
  sec.appendChild(scope.wrap);

  const varsWrap = document.createElement("div");
  varsWrap.className = "tl-vars";

  const varsLabel = document.createElement("div");
  varsLabel.textContent = "CSS Variables";
  sec.append(varsLabel, varsWrap);

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "8px";
  controls.style.marginTop = "6px";

  const addButton = document.createElement("button");
  addButton.className = "tl-mini";
  addButton.textContent = "Add variable";
  addButton.onclick = () => {
    theme.custom_css.vars.push({ name: "--custom-var", value: "" });
    renderVars();
    onAny();
  };

  const clearButton = document.createElement("button");
  clearButton.className = "tl-mini";
  clearButton.textContent = "Clear variables";
  clearButton.onclick = () => {
    theme.custom_css.vars = [];
    renderVars();
    onAny();
  };

  controls.append(addButton, clearButton);
  sec.appendChild(controls);

  function renderVars() {
    varsWrap.replaceChildren();

    for (const [index, entry] of (theme.custom_css.vars || []).entries()) {
      const rowWrap = document.createElement("div");
      rowWrap.className = "tl-var-row";

      const nameInput = document.createElement("input");
      nameInput.placeholder = "--my-var";
      nameInput.value = entry.name || "";

      const valueInput = document.createElement("input");
      valueInput.placeholder = "any CSS value";
      valueInput.value = entry.value || "";

      const remove = document.createElement("button");
      remove.className = "tl-mini";
      remove.textContent = "Remove";

      nameInput.onchange = () => {
        entry.name = nameInput.value;
        onAny();
      };

      valueInput.onchange = () => {
        entry.value = valueInput.value;
        onAny();
      };

      remove.onclick = () => {
        theme.custom_css.vars.splice(index, 1);
        renderVars();
        onAny();
      };

      rowWrap.append(nameInput, valueInput, remove);
      varsWrap.appendChild(rowWrap);
    }
  }

  renderVars();

  const rawLabel = document.createElement("div");
  rawLabel.textContent = "Raw CSS";
  sec.appendChild(rawLabel);

  sec.appendChild(textareaInput(theme.custom_css, "raw", onAny, "/* Write any CSS here */"));

  const hint = document.createElement("div");
  hint.className = "tl-subtle";
  hint.textContent = "Variables apply to the selected scope. Raw CSS is injected into <style>.";
  sec.appendChild(hint);

  body.appendChild(sec);
}

function addExtensionSections(body, theme, providers, onAny) {
  const extensions = theme.colors.extensions || (theme.colors.extensions = {});
  let defaultsApplied = false;

  for (const provider of providers) {
    runtime.providerIndex[provider.id] = provider;

    for (const [sectionName, items] of Object.entries(provider.sections || {})) {
      const sec = section(`Extension - ${provider.title} / ${sectionName}`);
      const grid = document.createElement("div");
      grid.className = "tl-grid";

      for (const item of items || []) {
        if (extensions[provider.id]?.[item.key] === undefined && item.default !== undefined) {
          (extensions[provider.id] ||= {})[item.key] = item.default;
          defaultsApplied = true;
        }

        const { wrap, right } = row(item.label || item.key);
        let input;

        if (item.type === "color") {
          input = colorInput(extensions[provider.id], item.key, onAny);
        } else if (item.type === "number") {
          input = numberInput(extensions[provider.id], item.key, onAny, item.step ?? 1);
        } else {
          input = textInput(extensions[provider.id], item.key, onAny, item.placeholder ?? "");
        }

        right.appendChild(input);
        grid.appendChild(wrap);
      }

      sec.appendChild(grid);
      body.appendChild(sec);
    }
  }

  if (defaultsApplied) {
    onAny();
  }
}

async function buildEditorSections(body, theme, onAny) {
  const meta = section("Theme Meta");
  const metaGrid = document.createElement("div");
  metaGrid.className = "tl-grid";

  const nameRow = row("Theme name");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = theme.name || "Theme";
  nameInput.placeholder = "Theme name";
  nameInput.addEventListener("change", () => {
    theme.name = nameInput.value || "Theme";
    onAny();
  });
  nameRow.right.appendChild(nameInput);

  metaGrid.append(nameRow.wrap);
  meta.appendChild(metaGrid);
  body.appendChild(meta);

  addColorGrid(body, "Node Slot Colors", theme.colors.node_slot, Object.keys(theme.colors.node_slot), onAny);

  const litegraphSpec = [
    { key: "CLEAR_BACKGROUND_COLOR", type: "color" },
    { key: "NODE_TITLE_COLOR", type: "color" },
    { key: "NODE_SELECTED_TITLE_COLOR", type: "color" },
    { key: "NODE_TEXT_SIZE", type: "number", step: 1 },
    { key: "NODE_TEXT_COLOR", type: "color" },
    { key: "NODE_TEXT_HIGHLIGHT_COLOR", type: "color" },
    { key: "NODE_SUBTEXT_SIZE", type: "number", step: 1 },
    { key: "NODE_DEFAULT_COLOR", type: "color" },
    { key: "NODE_DEFAULT_BGCOLOR", type: "color" },
    { key: "NODE_DEFAULT_BOXCOLOR", type: "color" },
    { key: "NODE_DEFAULT_SHAPE", type: "number", step: 1 },
    { key: "NODE_BOX_OUTLINE_COLOR", type: "color" },
    { key: "NODE_BYPASS_BGCOLOR", type: "color" },
    { key: "NODE_ERROR_COLOUR", type: "color" },
    { key: "DEFAULT_SHADOW_COLOR", type: "text", placeholder: "rgba(0,0,0,0.5)" },
    { key: "DEFAULT_GROUP_FONT", type: "number", step: 1 },
    { key: "WIDGET_BGCOLOR", type: "color" },
    { key: "WIDGET_OUTLINE_COLOR", type: "color" },
    { key: "WIDGET_TEXT_COLOR", type: "color" },
    { key: "WIDGET_SECONDARY_TEXT_COLOR", type: "color" },
    { key: "WIDGET_DISABLED_TEXT_COLOR", type: "color" },
    { key: "LINK_COLOR", type: "color" },
    { key: "EVENT_LINK_COLOR", type: "color" },
    { key: "CONNECTING_LINK_COLOR", type: "color" },
    { key: "BADGE_FG_COLOR", type: "color" },
    { key: "BADGE_BG_COLOR", type: "color" },
  ];

  addMixedGrid(body, "LiteGraph Canvas", theme.colors.litegraph_base, litegraphSpec, onAny);

  addMixedGrid(body, "Comfy UI Colors", theme.colors.comfy_base, COMFY_CORE_COLOR_FIELDS, onAny);
  addMixedGrid(body, "Comfy UI Optional Colors", theme.colors.comfy_base, COMFY_OPTIONAL_COLOR_FIELDS, onAny);
  addMixedGrid(body, "Design System Colors", theme.colors.comfy_base, COMFY_DESIGN_SYSTEM_COLOR_FIELDS, onAny);
  addMixedGrid(body, "Comfy UI Styling", theme.colors.comfy_base, COMFY_STYLE_FIELDS, onAny);
  addMixedGrid(body, "Fonts & Layout", theme.colors.comfy_base, COMFY_TYPOGRAPHY_FIELDS, onAny);
  buildAdvancedCssSection(body, theme, onAny);

  const extensionHolder = document.createElement("div");
  extensionHolder.className = "tl-editor-ext";
  body.appendChild(extensionHolder);

  const providers = await getProviders();
  if (providers.length) {
    addExtensionSections(extensionHolder, theme, providers, onAny);
  }
}

function createStudioDialog() {
  return new ThemeLabTemplateStudio({
    ComfyDialog,
    defaultTheme: TEMPLATE,
    clone,
    getManager,
    getVueRuntime,
    getThemeRecords,
    getLibrary,
    getActiveThemeRecord,
    getActiveTheme,
    setActiveThemeId,
    createTheme,
    importThemesFromFilePicker,
    exportThemeLibrary,
    exportThemeRecord,
    applyTheme,
    applyThemeAndPersist,
    showToast,
    promptDialog,
    confirmDialog,
    duplicateTheme,
    renameTheme,
    deleteTheme,
    resetActiveTheme,
    shouldConfirmReset,
    isLivePreviewEnabled,
    getThemePreviewUrl,
    setThemePreviewFromPicker,
    clearThemePreview,
    buildEditorSections,
    markRecordUpdated,
    scheduleLibraryPersist,
  });
}

function getStudioDialog() {
  if (!runtime.studioDialog) {
    runtime.studioDialog = createStudioDialog();
  }
  return runtime.studioDialog;
}

async function openStudio(page = "themes") {
  await ensureLibraryLoaded();
  await ensurePreviewIndexLoaded();
  loadCssOnce();
  await getStudioDialog().open(page);
}

function renderSidebarLauncher(el) {
  try {
    el.replaceChildren();
  } catch {
    el.innerHTML = "";
  }

  loadCssOnce();

  const container = document.createElement("div");
  container.className = "tl-launcher";

  const title = document.createElement("h3");
  title.textContent = "Opening Theme Lab Studio";

  const subtitle = document.createElement("div");
  subtitle.className = "tl-subtle";
  subtitle.textContent = "This tab now launches the Studio directly.";

  const summary = document.createElement("div");
  summary.className = "tl-subtle";
  summary.textContent = "Launching…";

  const reopen = document.createElement("button");
  reopen.className = "tl-mini";
  reopen.textContent = "Re-open Studio";
  reopen.onclick = () => void openStudio("themes");

  ensureLibraryLoaded().then(() => {
    const library = getLibrary();
    const active = getActiveThemeRecord();
    summary.textContent = `${library.themes.length} saved theme${library.themes.length === 1 ? "" : "s"} · Active: ${active.name}`;
  });

  container.append(title, subtitle, reopen, summary);
  el.appendChild(container);

  // Open the studio immediately when the sidebar icon/tab is clicked.
  queueMicrotask(() => {
    void openStudio("themes");
    // Best effort: close the sidebar panel so the icon behaves like a direct launcher.
    setTimeout(() => {
      void tryExecuteCommand("Workspace.ToggleSidebarTab.themeLabTab");
    }, 0);
  });

  return () => {};
}

function renderBottomPanelTab(el) {
  try {
    el.replaceChildren();
  } catch {
    el.innerHTML = "";
  }

  loadCssOnce();

  const container = document.createElement("div");
  container.className = "tl-bottom";

  if (!isBottomPanelEnabled()) {
    const disabled = document.createElement("div");
    disabled.className = "tl-bottom-disabled";
    disabled.textContent = "Theme Lab bottom panel is disabled in settings.";
    container.appendChild(disabled);
    el.appendChild(container);
    return;
  }

  const heading = document.createElement("h3");
  heading.textContent = "Theme Lab";

  const summary = document.createElement("div");
  summary.className = "tl-subtle";
  summary.textContent = "Loading themes...";

  const actions = document.createElement("div");
  actions.className = "tl-toolbar";

  const openButton = document.createElement("button");
  openButton.textContent = "Open Studio";
  openButton.onclick = () => void openStudio("themes");

  const editorButton = document.createElement("button");
  editorButton.textContent = "Open Editor";
  editorButton.onclick = () => void openStudio("editor");

  const applyButton = document.createElement("button");
  applyButton.textContent = "Apply Active";
  applyButton.onclick = async () => {
    await ensureLibraryLoaded();
    await applyThemeAndPersist(getActiveThemeRecord());
  };

  actions.append(openButton, editorButton, applyButton);
  container.append(heading, summary, actions);

  ensureLibraryLoaded().then(() => {
    const library = getLibrary();
    const active = getActiveThemeRecord();
    summary.textContent = `${library.themes.length} saved theme${library.themes.length === 1 ? "" : "s"} · Active: ${active.name}`;
  });

  el.appendChild(container);
}

function registerSidebarTab() {
  const register = getManager()?.registerSidebarTab;
  if (typeof register !== "function") {
    warn("registerSidebarTab unavailable on this frontend build.");
    return;
  }

  try {
    register({
      id: "themeLabTab",
      icon: "icon-[lucide--palette]",
      title: "Theme Lab",
      tooltip: "Open Theme Lab Studio",
      type: "custom",
      render: (el) => renderSidebarLauncher(el),
    });
    log("Sidebar launcher registered.");
  } catch (tabError) {
    warn("registerSidebarTab failed", tabError);
  }
}

async function commandOpenStudio() {
  await openStudio("themes");
}

async function commandOpenEditor() {
  await openStudio("editor");
}

async function commandApplyTheme() {
  await ensureLibraryLoaded();
  await applyThemeAndPersist(getActiveThemeRecord());
}

async function commandImportTheme() {
  await ensureLibraryLoaded();
  const count = await importThemesFromFilePicker();
  if (count > 0 && isLivePreviewEnabled()) {
    applyTheme(getActiveTheme());
  }
  runtime.studioDialog?.refresh();
}

async function commandExportTheme() {
  await ensureLibraryLoaded();
  exportThemeRecord(getActiveThemeRecord());
  showToast({ severity: "success", summary: "Theme Lab", detail: "Active theme exported." });
}

async function commandResetTheme() {
  await ensureLibraryLoaded();

  let confirmed = true;
  if (shouldConfirmReset()) {
    confirmed = await confirmDialog({
      title: "Reset Theme",
      message: "Reset active theme to defaults?",
      type: "default",
    });
  }

  if (!confirmed) {
    return;
  }

  resetActiveTheme();
  if (isLivePreviewEnabled()) {
    applyTheme(getActiveTheme());
  }

  runtime.studioDialog?.refresh();
  showToast({ severity: "success", summary: "Theme Lab", detail: "Active theme reset." });
}

loadCssOnce();

try {
  app.registerExtension({
    name: EXT_ID,

    settings: [
      {
        id: SETTINGS.LIVE_PREVIEW,
        name: "Live preview while editing",
        type: "boolean",
        defaultValue: true,
        category: ["Theme Lab", "Behavior", "Live Preview"],
        tooltip: "If enabled, editor changes are applied immediately to UI and canvas.",
        onChange: (newValue) => {
          if (newValue) {
            ensureLibraryLoaded().then(() => applyTheme(getActiveTheme()));
          }
        },
      },
      {
        id: SETTINGS.BOTTOM_PANEL,
        name: "Enable bottom panel quick tab",
        type: "boolean",
        defaultValue: true,
        category: ["Theme Lab", "UI", "Bottom Panel"],
        tooltip: "Shows Theme Lab quick actions in the bottom panel.",
      },
      {
        id: SETTINGS.RESET_CONFIRM,
        name: "Confirm before reset",
        type: "boolean",
        defaultValue: true,
        category: ["Theme Lab", "Behavior", "Safety"],
        tooltip: "Ask for confirmation before resetting a theme to defaults.",
      },
      {
        id: SETTINGS.PROVIDER_URLS,
        name: "Extra provider manifest URLs",
        type: "text",
        defaultValue: "",
        category: ["Theme Lab", "Providers", "Manifest URLs"],
        tooltip: "Optional comma/newline-separated theme manifest URLs for extension variable discovery.",
        attrs: {
          placeholder: "https://example.com/theme.json",
        },
        onChange: (newValue, oldValue) => {
          if (newValue === oldValue) {
            return;
          }

          runtime.providersPromise = null;
          runtime.providerIndex = {};

          if (isLivePreviewEnabled()) {
            ensureLibraryLoaded().then(() => applyTheme(getActiveTheme()));
          }
        },
      },
    ],

    commands: [
      {
        id: COMMANDS.OPEN_STUDIO,
        label: "Theme Lab: Open Studio",
        icon: "pi pi-window-maximize",
        function: () => commandOpenStudio(),
      },
      {
        id: COMMANDS.OPEN_EDITOR,
        label: "Theme Lab: Open Editor",
        icon: "pi pi-palette",
        function: () => commandOpenEditor(),
      },
      {
        id: COMMANDS.APPLY_THEME,
        label: "Theme Lab: Apply Active Theme",
        icon: "pi pi-check",
        function: () => commandApplyTheme(),
      },
      {
        id: COMMANDS.IMPORT_THEME,
        label: "Theme Lab: Import Theme JSON",
        icon: "pi pi-upload",
        function: () => commandImportTheme(),
      },
      {
        id: COMMANDS.EXPORT_THEME,
        label: "Theme Lab: Export Active Theme",
        icon: "pi pi-download",
        function: () => commandExportTheme(),
      },
      {
        id: COMMANDS.RESET_THEME,
        label: "Theme Lab: Reset Active Theme",
        icon: "pi pi-refresh",
        function: () => commandResetTheme(),
      },
    ],

    keybindings: [
      {
        combo: { key: "t", ctrl: true, shift: true },
        commandId: COMMANDS.OPEN_STUDIO,
      },
    ],

    menuCommands: [
      {
        path: ["Extensions", "Theme Lab"],
        commands: [
          COMMANDS.OPEN_STUDIO,
          COMMANDS.OPEN_EDITOR,
          COMMANDS.APPLY_THEME,
          COMMANDS.IMPORT_THEME,
          COMMANDS.EXPORT_THEME,
          COMMANDS.RESET_THEME,
        ],
      },
    ],

    bottomPanelTabs: [
      {
        id: "themeLabBottomPanel",
        title: "Theme Lab",
        type: "custom",
        icon: "pi pi-palette",
        render: (el) => renderBottomPanelTab(el),
      },
    ],

    aboutPageBadges: [
      {
        label: "Theme Lab",
        url: "https://docs.comfy.org/custom-nodes/js/javascript_overview",
        icon: "pi pi-palette",
      },
      {
        label: "Theme Lab Studio",
        url: "https://docs.comfy.org/custom-nodes/js/javascript_commands_keybindings",
        icon: "pi pi-window-maximize",
      },
    ],

    setup() {
      registerSidebarTab();

      void ensureLibraryLoaded().then(async () => {
        await repairMissingThemeLabPalette();
        void getProviders();
        if (isLivePreviewEnabled()) {
          applyTheme(getActiveTheme());
        }
      });

      log("Extension registered", VERSION, "base:", BASE);
    },
  });
} catch (registerError) {
  errorLog("registerExtension failed", registerError);
}
