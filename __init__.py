# ComfyUI Theme Lab - v2.0.0 (frontend only)
try:
    from .backend import extension_style_scan as _extension_style_scan  # noqa: F401
except Exception as route_error:
    print(f"[ThemeLab] Backend style scan route unavailable: {route_error}")

WEB_DIRECTORY = "./js"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
__all__ = ["WEB_DIRECTORY","NODE_CLASS_MAPPINGS","NODE_DISPLAY_NAME_MAPPINGS"]
