// Theme Lab - v2.0.0
// Modal studio + saved theme library for ComfyUI frontend.

import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { ComfyDialog } from "/scripts/ui/dialog.js";
import { ThemeLabTemplateStudio } from "./studio/template-studio.js";
import {
  THEME_LAB_CANVAS_DEFAULTS,
  THEME_LAB_CANVAS_FIELDS,
  normalizeThemeLabCanvasConfig,
  ensureThemeLabCanvasConfig,
  applyThemeLabCanvasConfig,
} from "./theme-lab-canvas.js";
import {
  buildRegisteredExtensionProviders,
} from "./providers/extension-settings-provider.js";
import {
  fetchScannedExtensionStyleProviders,
} from "./providers/extension-style-provider.js";

const EXT_ID = "ThemeLab";
const VERSION = "2.0.0";

const LEGACY_CURRENT_KEY = "themelab.currentTheme";
const LIBRARY_CACHE_KEY = "themelab.library.cache";
const EDITOR_SECTION_STATE_KEY = "themelab.editor.sectionState";
const STUDIO_REOPEN_KEY = "themelab.reopenStudio";
const USER_LIBRARY_FILE = "themelab.themes.json";
const USER_PREVIEW_DIR = "themelab/previews";
const USER_COMFY_THEME_DIR = "themes";
const USER_COMFY_THEME_FILE = `${USER_COMFY_THEME_DIR}/Theme Lab.json`;
const COMFY_SETTING_COLOR_PALETTE = "Comfy.ColorPalette";
const COMFY_SETTING_CUSTOM_PALETTES = "Comfy.CustomColorPalettes";
const COMFY_THEME_LAB_ID = "themelab-theme-lab";
const COMFY_THEME_LAB_LEGACY_IDS = [
  "themelab-theme-lab-a",
  "themelab-theme-lab-b",
];
const COMFY_THEME_LAB_COMPAT_IDS = [
  COMFY_THEME_LAB_ID,
  ...COMFY_THEME_LAB_LEGACY_IDS,
];
const DEFAULT_THEME_ID = "custom-theme-lab";
const VUE_LITEGRAPH_THEME_PROPERTY_MAP = {
  NODE_BOX_OUTLINE_COLOR: "component-node-border",
  NODE_DEFAULT_BGCOLOR: "component-node-background",
  NODE_DEFAULT_BOXCOLOR: "node-component-header-icon",
  NODE_DEFAULT_COLOR: "node-component-header-surface",
  NODE_TITLE_COLOR: "node-component-header",
  WIDGET_BGCOLOR: "component-node-widget-background",
  WIDGET_TEXT_COLOR: "component-node-foreground",
};

const SETTINGS = {
  LIVE_PREVIEW: "themelab.livePreview",
  BOTTOM_PANEL: "themelab.bottomPanelTab",
  SIDEBAR_PANEL: "themelab.sidebarCardPanel",
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
const EXTENSION_STYLING_TOOLTIP = "Some extentions might break when adding custom styling and will need to reload canvas after";
const CANVAS_PRESET_LITEGRAPH_FIELDS = [
  { key: "NODE_TEXT_SIZE" },
  { key: "NODE_SUBTEXT_SIZE" },
  { key: "DEFAULT_GROUP_FONT" },
];

const THEME_LAB_CANVAS_PRESETS = Object.freeze({
  compact: Object.freeze({
    canvas: normalizeThemeLabCanvasConfig({
      ...THEME_LAB_CANVAS_DEFAULTS,
      node_title_height: 26,
      node_slot_height: 18,
      node_widget_height: 18,
      node_corner_radius: 6,
      connection_width: 2.25,
      link_render_mode: "linear",
      node_outline_width: 0,
      widget_outline_width: 0.75,
      group_outline_width: 0.75,
      reroute_dot_size: 8,
      reroute_slot_size: 4,
      render_connection_borders: false,
      render_connection_shadows: false,
      render_connection_arrows: false,
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 13,
      NODE_SUBTEXT_SIZE: 11,
      DEFAULT_GROUP_FONT: 20,
    }),
  }),
  default: Object.freeze({
    canvas: normalizeThemeLabCanvasConfig(THEME_LAB_CANVAS_DEFAULTS),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 14,
      NODE_SUBTEXT_SIZE: 12,
      DEFAULT_GROUP_FONT: 24,
    }),
  }),
  spacious: Object.freeze({
    canvas: normalizeThemeLabCanvasConfig({
      ...THEME_LAB_CANVAS_DEFAULTS,
      node_title_height: 34,
      node_slot_height: 22,
      node_widget_height: 22,
      node_corner_radius: 10,
      connection_width: 3.5,
      link_render_mode: "spline",
      node_outline_width: 0.25,
      widget_outline_width: 1.25,
      group_outline_width: 1.25,
      reroute_dot_size: 11,
      reroute_slot_size: 5.5,
      render_connection_borders: true,
      render_connection_shadows: true,
      render_connection_arrows: false,
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 15,
      NODE_SUBTEXT_SIZE: 12,
      DEFAULT_GROUP_FONT: 26,
    }),
  }),
  presentation: Object.freeze({
    canvas: normalizeThemeLabCanvasConfig({
      ...THEME_LAB_CANVAS_DEFAULTS,
      node_title_height: 38,
      node_slot_height: 24,
      node_widget_height: 24,
      node_corner_radius: 12,
      connection_width: 4.5,
      link_render_mode: "spline",
      link_marker_shape: "arrow",
      node_outline_width: 0.5,
      widget_outline_width: 1.5,
      group_outline_width: 1.5,
      reroute_dot_size: 12,
      reroute_slot_size: 6,
      render_connection_borders: true,
      render_connection_shadows: true,
      render_connection_arrows: true,
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 16,
      NODE_SUBTEXT_SIZE: 13,
      DEFAULT_GROUP_FONT: 30,
    }),
  }),
});

const THEME_LAB_CANVAS_PRESET_DESCRIPTIONS = Object.freeze({
  compact: "Tighter node geometry, slimmer links, and smaller canvas labels.",
  default: "Theme Lab default canvas proportions and link behavior.",
  spacious: "More breathing room between slots, widgets, and connections.",
  presentation: "Large nodes, stronger outlines, and clearer presentation-scale links.",
  custom: "Custom canvas geometry and LiteGraph text sizing.",
});

const TEMPLATE = {
  id: DEFAULT_THEME_ID,
  name: "Theme Lab",
  description: "",
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
  theme_lab: {
    canvas: { ...THEME_LAB_CANVAS_DEFAULTS },
    extension_styling_enabled: true,
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

const THEME_LAB_TYPOGRAPHY_PRESETS = Object.freeze({
  compact: Object.freeze({
    comfy_base: Object.freeze({
      "font-inter": TEMPLATE.colors.comfy_base["font-inter"],
      "comfy-textarea-font-size": "12px",
      "comfy-tree-explorer-item-padding": "4px 4px",
      "comfy-topbar-height": "2.25rem",
      "comfy-widget-min-height": "22",
      "comfy-widget-max-height": "280",
      "comfy-widget-height": "auto",
      "comfy-img-preview-width": "320px",
      "comfy-img-preview-height": "216px",
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 13,
      NODE_SUBTEXT_SIZE: 11,
      DEFAULT_GROUP_FONT: 20,
    }),
  }),
  default: Object.freeze({
    comfy_base: Object.freeze(Object.fromEntries(
      COMFY_TYPOGRAPHY_FIELDS.map((field) => [field.key, TEMPLATE.colors.comfy_base[field.key]]),
    )),
    litegraph_base: Object.freeze(Object.fromEntries(
      CANVAS_PRESET_LITEGRAPH_FIELDS.map((field) => [field.key, TEMPLATE.colors.litegraph_base[field.key]]),
    )),
  }),
  comfortable: Object.freeze({
    comfy_base: Object.freeze({
      "font-inter": TEMPLATE.colors.comfy_base["font-inter"],
      "comfy-textarea-font-size": "14px",
      "comfy-tree-explorer-item-padding": "7px 5px",
      "comfy-topbar-height": "2.75rem",
      "comfy-widget-min-height": "26",
      "comfy-widget-max-height": "360",
      "comfy-widget-height": "auto",
      "comfy-img-preview-width": "416px",
      "comfy-img-preview-height": "272px",
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 15,
      NODE_SUBTEXT_SIZE: 12,
      DEFAULT_GROUP_FONT: 24,
    }),
  }),
  presentation: Object.freeze({
    comfy_base: Object.freeze({
      "font-inter": TEMPLATE.colors.comfy_base["font-inter"],
      "comfy-textarea-font-size": "15px",
      "comfy-tree-explorer-item-padding": "8px 6px",
      "comfy-topbar-height": "3rem",
      "comfy-widget-min-height": "28",
      "comfy-widget-max-height": "420",
      "comfy-widget-height": "auto",
      "comfy-img-preview-width": "448px",
      "comfy-img-preview-height": "288px",
    }),
    litegraph_base: Object.freeze({
      NODE_TEXT_SIZE: 16,
      NODE_SUBTEXT_SIZE: 13,
      DEFAULT_GROUP_FONT: 28,
    }),
  }),
});

const THEME_LAB_TYPOGRAPHY_PRESET_DESCRIPTIONS = Object.freeze({
  compact: "Denser controls and smaller text for editing-heavy layouts.",
  default: "Theme Lab default UI density and readable baseline sizing.",
  comfortable: "Looser spacing with easier scanning across panels and widgets.",
  presentation: "Larger text and roomier widgets for showcase-style layouts.",
  custom: "Custom UI density and LiteGraph typography mix.",
});

const runtime = {
  library: null,
  loadPromise: null,
  persistTimer: null,
  persistPromise: null,
  bundledThemes: null,
  bundledThemesPromise: null,
  providersPromise: null,
  scannedStyleProvidersPromise: null,
  providerIndex: {},
  providerAliasIndex: {},
  previewIndexLoaded: false,
  previewIndexPromise: null,
  previewByKey: {},
  studioDialog: null,
  cssLoaded: false,
  vuePromise: null,
  sidebarHost: null,
  sidebarCleanup: null,
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

function canonicalExtensionProviderId(value, fallback = "extension") {
  const raw = String(value || "").trim();
  if (!raw) {
    return `extension-${fallback}`;
  }

  const stripped = raw.replace(/^extension-/, "");
  return `extension-${slugifyThemeName(stripped, fallback)}`;
}

function registerProviderAlias(alias, canonicalId) {
  const raw = String(alias || "").trim();
  const target = String(canonicalId || "").trim();
  if (!raw || !target) {
    return;
  }

  runtime.providerAliasIndex[raw] = target;
  runtime.providerAliasIndex[canonicalExtensionProviderId(raw)] = target;
}

function buildProviderAliasCandidates(providerLike) {
  const provider = providerLike && typeof providerLike === "object" ? providerLike : {};
  const rawId = String(provider.id || "").trim();
  const rawTitle = String(provider.title || "").trim();
  const aliases = new Set();

  if (rawId) {
    aliases.add(rawId);
    aliases.add(rawId.replace(/^extension-/, ""));
  }

  if (rawTitle) {
    aliases.add(rawTitle);
    aliases.add(rawTitle.replace(/^Extension\s*-\s*/i, ""));
  }

  if (rawTitle || rawId) {
    aliases.add(slugifyThemeName(rawTitle || rawId, "extension"));
  }

  return Array.from(aliases).filter(Boolean);
}

function getProviderItemKeys(manifest) {
  const keys = new Set();
  for (const sectionItems of Object.values(manifest?.sections || {})) {
    for (const item of sectionItems || []) {
      if (item?.key) {
        keys.add(String(item.key));
      }
    }
  }
  return keys;
}

function findBestMatchingExtensionProviderId(providerValues) {
  const valueKeys = Object.keys(providerValues || {});
  if (!valueKeys.length) {
    return "";
  }

  let bestId = "";
  let bestScore = 0;
  let bestRatio = 0;

  for (const manifest of Object.values(runtime.providerIndex || {})) {
    const itemKeys = getProviderItemKeys(manifest);
    if (!itemKeys.size) {
      continue;
    }

    let overlap = 0;
    for (const key of valueKeys) {
      if (itemKeys.has(key)) {
        overlap += 1;
      }
    }

    if (!overlap) {
      continue;
    }

    const ratio = overlap / Math.max(valueKeys.length, itemKeys.size);
    if (overlap > bestScore || (overlap === bestScore && ratio > bestRatio)) {
      bestId = String(manifest.id || "");
      bestScore = overlap;
      bestRatio = ratio;
    }
  }

  if (bestScore >= 2 || bestRatio >= 0.45) {
    return bestId;
  }

  return "";
}

function resolveExtensionProviderId(providerId, providerValues = null) {
  const raw = String(providerId || "").trim();
  if (!raw) {
    return "";
  }

  if (runtime.providerIndex[raw]) {
    return raw;
  }

  const canonical = canonicalExtensionProviderId(raw);
  if (runtime.providerIndex[canonical]) {
    return canonical;
  }

  if (runtime.providerAliasIndex[raw]) {
    return runtime.providerAliasIndex[raw];
  }

  if (runtime.providerAliasIndex[canonical]) {
    return runtime.providerAliasIndex[canonical];
  }

  const matched = findBestMatchingExtensionProviderId(providerValues);
  if (matched) {
    registerProviderAlias(raw, matched);
    return matched;
  }

  return "";
}

function mergeExtensionProviderValues(target, source, { preferSource = false } = {}) {
  for (const [key, value] of Object.entries(source || {})) {
    if (preferSource || target[key] === undefined) {
      target[key] = clone(value);
    }
  }
}

function normalizeExtensionValueMap(extensionValues) {
  const rawMap = extensionValues && typeof extensionValues === "object" ? extensionValues : {};
  const normalized = {};

  const entries = Object.entries(rawMap);
  const orderedEntries = [
    ...entries.filter(([providerId]) => !resolveExtensionProviderId(providerId)),
    ...entries.filter(([providerId]) => Boolean(resolveExtensionProviderId(providerId))),
  ];

  for (const [providerId, providerValues] of orderedEntries) {
    const valueObject = providerValues && typeof providerValues === "object" ? providerValues : {};
    const resolvedId = resolveExtensionProviderId(providerId, valueObject);

    if (!resolvedId) {
      normalized[providerId] = clone(valueObject);
      continue;
    }

    const target = normalized[resolvedId] || (normalized[resolvedId] = {});
    const preferSource = resolvedId === providerId;
    mergeExtensionProviderValues(target, valueObject, { preferSource });
  }

  const rawKeys = Object.keys(rawMap);
  const normalizedKeys = Object.keys(normalized);
  let changed = rawKeys.length !== normalizedKeys.length;
  if (!changed && rawKeys.length === normalizedKeys.length) {
    changed = rawKeys.some((key) => {
      if (!Object.prototype.hasOwnProperty.call(normalized, key)) {
        return true;
      }
      return JSON.stringify(rawMap[key]) !== JSON.stringify(normalized[key]);
    });
  }

  return { values: normalized, changed };
}

function normalizeThemeExtensionValues(theme) {
  if (!theme?.colors || typeof theme.colors !== "object") {
    return false;
  }

  const { values, changed } = normalizeExtensionValueMap(theme.colors.extensions);
  if (!theme.colors.extensions || changed) {
    theme.colors.extensions = values;
    return true;
  }

  return false;
}

function normalizeLibraryExtensionValues() {
  let changed = false;

  for (const record of getThemeRecords()) {
    if (!record?.data) {
      continue;
    }
    if (normalizeThemeExtensionValues(record.data)) {
      markRecordUpdated(record);
      changed = true;
    }
  }

  return changed;
}

function normalizeThemeLabBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function ensureThemeLabOptions(theme) {
  if (!theme || typeof theme !== "object") {
    return { canvas: normalizeThemeLabCanvasConfig(null), extension_styling_enabled: true };
  }

  const themeLabRoot = theme.theme_lab && typeof theme.theme_lab === "object"
    ? theme.theme_lab
    : (theme.theme_lab = {});

  themeLabRoot.canvas = ensureThemeLabCanvasConfig(theme);
  themeLabRoot.extension_styling_enabled = normalizeThemeLabBoolean(
    themeLabRoot.extension_styling_enabled,
    true,
  );
  return themeLabRoot;
}

function isThemeLabExtensionStylingEnabled(theme) {
  return ensureThemeLabOptions(theme).extension_styling_enabled !== false;
}

function setThemeLabExtensionStylingEnabled(theme, enabled) {
  ensureThemeLabOptions(theme).extension_styling_enabled = Boolean(enabled);
}

function readEditorSectionState() {
  try {
    const raw = localStorage.getItem(EDITOR_SECTION_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeEditorSectionState(state) {
  try {
    localStorage.setItem(EDITOR_SECTION_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore local storage failures.
  }
}

function getEditorSectionOpen(sectionId, fallback = true) {
  const state = readEditorSectionState();
  return typeof state?.[sectionId] === "boolean" ? state[sectionId] : fallback;
}

function setEditorSectionOpen(sectionId, isOpen) {
  const state = readEditorSectionState();
  state[sectionId] = Boolean(isOpen);
  writeEditorSectionState(state);
}

function flattenSearchTerms(value, target = []) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      flattenSearchTerms(entry, target);
    }
    return target;
  }

  if (value && typeof value === "object") {
    flattenSearchTerms(Object.values(value), target);
    return target;
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return target;
  }

  const text = raw.toLowerCase();
  const normalized = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  target.push(text);
  if (normalized && normalized !== text) {
    target.push(normalized);
  }
  return target;
}

function buildSearchIndex(...values) {
  return Array.from(new Set(flattenSearchTerms(values))).join(" ");
}

function matchesSearchIndex(index, query) {
  const terms = String(query || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) {
    return true;
  }

  return terms.every((term) => index.includes(term));
}

function setSectionFilterState(sectionRef, query, { changedOnly = false } = {}) {
  const rows = Array.from(sectionRef.wrap.querySelectorAll("[data-tl-row-search]"));
  const groups = Array.from(sectionRef.wrap.querySelectorAll("[data-tl-extension-group]"));
  const sectionMatch = matchesSearchIndex(sectionRef.wrap.dataset.search || "", query);
  const sectionChanged = sectionRef.wrap.dataset.tlSectionChanged === "true";
  let visibleRows = 0;

  if ((!query || sectionMatch) && !changedOnly) {
    for (const rowEl of rows) {
      rowEl.hidden = false;
    }
    for (const groupEl of groups) {
      groupEl.hidden = false;
    }
    visibleRows = rows.length;
  } else {
    for (const rowEl of rows) {
      const searchMatch = !query || sectionMatch || matchesSearchIndex(rowEl.dataset.tlRowSearch || "", query);
      const changedMatch = !changedOnly || rowEl.dataset.tlRowChanged === "true";
      const match = searchMatch && changedMatch;
      rowEl.hidden = !match;
      if (match) {
        visibleRows += 1;
      }
    }

    for (const groupEl of groups) {
      const groupRows = Array.from(groupEl.querySelectorAll("[data-tl-row-search]"));
      groupEl.hidden = groupRows.length > 0 && !groupRows.some((rowEl) => !rowEl.hidden);
    }
  }

  const match = (
    (!query || sectionMatch || visibleRows > 0)
    && (!changedOnly || sectionChanged || visibleRows > 0)
  );
  sectionRef.wrap.hidden = !match;
  sectionRef.wrap.classList.toggle("is-search-open", Boolean(query) && match);
  return {
    match,
    visibleRows: match ? visibleRows : 0,
    totalRows: rows.length,
  };
}

function assignFieldDefaults(target, source, fields) {
  if (!target || !source) {
    return;
  }

  for (const field of fields || []) {
    const key = typeof field === "string" ? field : field?.key;
    if (!key) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = clone(source[key]);
    }
  }
}

function applyCanvasPreset(theme, presetKey) {
  const canvas = ensureThemeLabCanvasConfig(theme);
  const preset = THEME_LAB_CANVAS_PRESETS[presetKey] || THEME_LAB_CANVAS_PRESETS.default;
  Object.assign(canvas, normalizeThemeLabCanvasConfig(preset.canvas));
  assignFieldDefaults(theme?.colors?.litegraph_base, preset.litegraph_base, CANVAS_PRESET_LITEGRAPH_FIELDS);
}

function applyTypographyPreset(theme, presetKey) {
  const comfyBase = theme?.colors?.comfy_base;
  if (!comfyBase) {
    return;
  }

  const preset = THEME_LAB_TYPOGRAPHY_PRESETS[presetKey] || THEME_LAB_TYPOGRAPHY_PRESETS.default;
  assignFieldDefaults(comfyBase, preset.comfy_base, COMFY_TYPOGRAPHY_FIELDS);
  assignFieldDefaults(theme?.colors?.litegraph_base, preset.litegraph_base, CANVAS_PRESET_LITEGRAPH_FIELDS);
}

function matchesPresetValues(source, preset, fields) {
  const keys = (fields || []).map((field) => (typeof field === "string" ? field : field?.key)).filter(Boolean);
  return keys.every((key) => String(source?.[key] ?? "") === String(preset?.[key] ?? ""));
}

function resolveCanvasPresetKey(theme) {
  const canvas = normalizeThemeLabCanvasConfig(theme?.theme_lab?.canvas || {});
  for (const [presetKey, preset] of Object.entries(THEME_LAB_CANVAS_PRESETS)) {
    if (
      matchesPresetValues(canvas, preset.canvas, THEME_LAB_CANVAS_FIELDS)
      && matchesPresetValues(theme?.colors?.litegraph_base || {}, preset.litegraph_base, CANVAS_PRESET_LITEGRAPH_FIELDS)
    ) {
      return presetKey;
    }
  }
  return "";
}

function resolveTypographyPresetKey(theme) {
  const comfyBase = theme?.colors?.comfy_base || {};
  for (const [presetKey, preset] of Object.entries(THEME_LAB_TYPOGRAPHY_PRESETS)) {
    if (
      matchesPresetValues(comfyBase, preset.comfy_base, COMFY_TYPOGRAPHY_FIELDS)
      && matchesPresetValues(theme?.colors?.litegraph_base || {}, preset.litegraph_base, CANVAS_PRESET_LITEGRAPH_FIELDS)
    ) {
      return presetKey;
    }
  }
  return "";
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

function scheduleStudioReopen(page = "editor") {
  try {
    sessionStorage.setItem(STUDIO_REOPEN_KEY, JSON.stringify({
      page: String(page || "editor"),
      at: Date.now(),
    }));
  } catch {
    // ignore storage failures
  }
}

function consumeStudioReopenRequest() {
  try {
    const raw = sessionStorage.getItem(STUDIO_REOPEN_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(STUDIO_REOPEN_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const page = String(parsed.page || "editor");
    const at = Number(parsed.at || 0);
    if (Number.isFinite(at) && at > 0 && (Date.now() - at) > 10 * 60 * 1000) {
      return null;
    }
    return { page };
  } catch {
    return null;
  }
}

function reloadAndReopenStudio(page = "editor") {
  scheduleStudioReopen(page);
  location.reload();
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

function suppressSidebarLauncherHost(el) {
  return [
    el,
    el?.parentElement,
  ]
    .filter((target) => target instanceof HTMLElement)
    .map((target) => {
      target.classList.add("tl-sidebar-launch-suppress");
      return target;
    });
}

function restoreSidebarLauncherHost(targets) {
  for (const target of targets || []) {
    if (target instanceof HTMLElement) {
      target.classList.remove("tl-sidebar-launch-suppress");
    }
  }
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

function isGlobalSidebarCardsEnabled() {
  return Boolean(getSetting(SETTINGS.SIDEBAR_PANEL, false));
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

function syncGlobalSidebarCardMode() {
  const enabled = isGlobalSidebarCardsEnabled();
  document.body?.classList.toggle("tl-global-sidebar-cards", enabled);
}

function themePreviewGradient(theme) {
  const comfy = theme?.colors?.comfy_base || {};
  const bg = comfy["bg-color"] || comfy["base-background"] || "#1f1f24";
  const panel = comfy["comfy-menu-bg"] || comfy["secondary-background"] || "#32353f";
  const accentA = comfy["primary-background"] || theme?.colors?.node_slot?.IMAGE || "#64B5F6";
  const accentB = comfy["accent-primary"] || theme?.colors?.node_slot?.LATENT || "#FF9CF9";
  return `linear-gradient(135deg, ${bg} 0%, ${panel} 45%, ${accentA} 72%, ${accentB} 100%)`;
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

    if (input.description) {
      base.description = String(input.description);
    }

    ensureThemeLabCanvasConfig(base);
    if (input.theme_lab || input.themeLab || input.canvas) {
      base.theme_lab.canvas = ensureThemeLabCanvasConfig({
        theme_lab: input.theme_lab,
        themeLab: input.themeLab,
        canvas: input.canvas,
      });
    }

    const extensionStylingEnabled =
      input.theme_lab?.extension_styling_enabled
      ?? input.theme_lab?.extensionStylingEnabled
      ?? input.theme_lab?.save_extension_styling
      ?? input.themeLab?.extension_styling_enabled
      ?? input.themeLab?.extensionStylingEnabled
      ?? input.themeLab?.saveExtensionStyling;
    if (extensionStylingEnabled !== undefined) {
      base.theme_lab.extension_styling_enabled = normalizeThemeLabBoolean(extensionStylingEnabled, true);
    }
  } catch {
    // keep defaults if migration fails
  }

  ensureThemeLabOptions(base);
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
    applyTheme(record.data, { applyExtensionSettings: true });
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
  const payload = clone(record.data);
  normalizeThemeExtensionValues(payload);
  downloadJson(fileName, payload);
}

function exportThemeLibrary() {
  const themes = getThemeRecords().map((record) => {
    const copy = clone(record);
    normalizeThemeExtensionValues(copy.data);
    return copy;
  });
  const payload = {
    version: 2,
    exportedAt: nowIso(),
    activeThemeId: getLibrary().activeThemeId,
    themes,
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
        colorFormat: item.colorFormat,
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
      colorFormat: item.colorFormat,
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

function getBuiltinProviders() {
  return buildRegisteredExtensionProviders({
    app,
    settingApis: [
      getManager()?.setting,
      app?.ui?.settings,
    ],
  });
}

function mergeProviders(providers) {
  const found = [];
  const merged = new Map();
  runtime.providerIndex = {};
  runtime.providerAliasIndex = {};

  for (const provider of providers || []) {
    const manifest = compatManifest(provider);
    const key = canonicalExtensionProviderId(manifest.title || manifest.id, "extension");
    if (!merged.has(key)) {
      merged.set(key, {
        ...manifest,
        id: key,
        sections: {},
      });
    }

    const target = merged.get(key);
    if (!target.title && manifest.title) {
      target.title = manifest.title;
    }
    for (const [sectionName, items] of Object.entries(manifest.sections || {})) {
      const sectionItems = (target.sections[sectionName] ||= []);
      const seenItems = new Set(sectionItems.map((item) => String(item?.settingId || item?.key || "")));
      for (const item of items || []) {
        const itemKey = String(item?.settingId || item?.key || "");
        if (seenItems.has(itemKey)) {
          continue;
        }
        seenItems.add(itemKey);
        sectionItems.push(item);
      }
      sectionItems.sort((left, right) => String(left?.label || "").localeCompare(String(right?.label || "")));
    }

    for (const alias of [
      ...buildProviderAliasCandidates(provider),
      ...buildProviderAliasCandidates(manifest),
      key,
    ]) {
      registerProviderAlias(alias, key);
    }
  }

  for (const manifest of merged.values()) {
    found.push(manifest);
    runtime.providerIndex[manifest.id] = manifest;
  }

  return found;
}

async function loadProviders() {
  const found = [];

  for (const url of parseProviderUrls()) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      found.push(await response.json());
    } catch {
      // ignore failed provider URL
    }
  }

  return found;
}

async function getScannedStyleProviders({ force = false } = {}) {
  if (force) {
    runtime.scannedStyleProvidersPromise = null;
  }

  if (!runtime.scannedStyleProvidersPromise) {
    runtime.scannedStyleProvidersPromise = fetchScannedExtensionStyleProviders({
      api,
      force,
    }).catch((providerError) => {
      runtime.scannedStyleProvidersPromise = null;
      warn("Scanned extension style provider load failed", providerError);
      return [];
    });
  }

  return runtime.scannedStyleProvidersPromise;
}

async function getProviders({ force = false } = {}) {
  if (force) {
    runtime.providersPromise = null;
  }

  if (!runtime.providersPromise) {
    runtime.providersPromise = loadProviders().catch((providerError) => {
      runtime.providersPromise = null;
      warn("Provider load failed", providerError);
      return [];
    });
  }

  const [externalProviders, scannedStyleProviders] = await Promise.all([
    runtime.providersPromise,
    getScannedStyleProviders({ force }),
  ]);

  return mergeProviders([
    ...getBuiltinProviders(),
    ...scannedStyleProviders,
    ...externalProviders,
  ]);
}

async function refreshExtensionProviders({ refreshStudio = false } = {}) {
  await getProviders({ force: true });
  if (normalizeLibraryExtensionValues()) {
    scheduleLibraryPersist(0);
  }
  if (refreshStudio && runtime.studioDialog?.isOpen) {
    runtime.studioDialog.refresh();
  }
  return runtime.providerIndex;
}

function scheduleStartupProviderRefreshes() {
  const refresh = () => void refreshExtensionProviders();

  queueMicrotask(refresh);

  try {
    requestAnimationFrame(refresh);
  } catch {
    // ignore RAF failures
  }

  setTimeout(refresh, 1200);
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

  const backgroundImage = String(getSetting("Comfy.Canvas.BackgroundImage", "") || "");
  if (backgroundImage) {
    root.style.setProperty("--bg-img", `url('${backgroundImage}')`);
  } else {
    root.style.removeProperty("--bg-img");
  }
}

function applyNodeSlotColors(slotColors) {
  const palette = slotColors || {};
  const nodeDefStore = getRuntimeNodeDefStore();
  const nodeDataTypes = Array.from(nodeDefStore?.nodeDataTypes || []);
  const emptyTypes = Object.fromEntries(nodeDataTypes.map((type) => [type, ""]));

  try {
    const canvasColors = app?.canvas?.default_connection_color_byType;
    if (canvasColors && typeof canvasColors === "object") {
      Object.assign(canvasColors, emptyTypes, palette);
    }
  } catch {
    // ignore
  }

  try {
    const graphCanvasCtor = window.LGraphCanvas || app?.canvas?.constructor;
    if (graphCanvasCtor?.link_type_colors && typeof graphCanvasCtor.link_type_colors === "object") {
      Object.assign(graphCanvasCtor.link_type_colors, emptyTypes, palette);
    }
  } catch {
    // ignore
  }

  try {
    const litegraph = window.LiteGraph;
    if (litegraph?.NODE_SLOT_COLORS && typeof litegraph.NODE_SLOT_COLORS === "object") {
      Object.assign(litegraph.NODE_SLOT_COLORS, emptyTypes, palette);
    }
  } catch {
    // ignore
  }

  try {
    const bodyStyle = document.body?.style;
    if (!bodyStyle) {
      return;
    }
    for (const dataType of nodeDataTypes) {
      const cssVar = `--color-datatype-${dataType}`;
      const value = palette[dataType];
      if (value) {
        bodyStyle.setProperty(cssVar, value);
      } else {
        bodyStyle.removeProperty(cssVar);
      }
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
    const canvas = app?.canvas;
    if (canvas) {
      canvas.node_title_color = litegraphColors?.NODE_TITLE_COLOR;
      canvas.default_link_color = litegraphColors?.LINK_COLOR;
      const backgroundImage = String(getSetting("Comfy.Canvas.BackgroundImage", "") || "");
      if (backgroundImage) {
        canvas.clear_background_color = "transparent";
      } else {
        canvas.background_image = litegraphColors?.BACKGROUND_IMAGE || "";
        canvas.clear_background_color = litegraphColors?.CLEAR_BACKGROUND_COLOR || "#222222";
      }
      canvas._pattern = undefined;
    }
  } catch {
    // ignore
  }

  try {
    const bodyStyle = document.body?.style;
    if (bodyStyle) {
      for (const [themeKey, cssVar] of Object.entries(VUE_LITEGRAPH_THEME_PROPERTY_MAP)) {
        const value = litegraphColors?.[themeKey];
        if (value) {
          bodyStyle.setProperty(`--${cssVar}`, value);
        } else {
          bodyStyle.removeProperty(`--${cssVar}`);
        }
      }
    }
  } catch {
    // ignore
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

function applyProviderSettingValue(settingId, value) {
  if (!settingId) {
    return;
  }

  void setComfySettingValue(settingId, value).catch((settingError) => {
    warn(`Failed to apply extension setting ${settingId}`, settingError);
  });
}

function clearExtensionCssVars() {
  const root = document.documentElement;
  for (const manifest of Object.values(runtime.providerIndex || {})) {
    for (const sectionItems of Object.values(manifest?.sections || {})) {
      for (const item of sectionItems || []) {
        if (item?.cssVar) {
          root.style.removeProperty(item.cssVar);
        }
      }
    }
  }
}

function applyExtensionVars(extensionValues, { applySettings = false } = {}) {
  const root = document.documentElement;
  const valueMap = extensionValues && typeof extensionValues === "object" ? extensionValues : {};
  const appliedProviders = new Set();

  for (const [providerId, providerValues] of Object.entries(valueMap)) {
    const resolvedId = resolveExtensionProviderId(providerId, providerValues);
    const manifest = runtime.providerIndex[resolvedId];
    if (!manifest) {
      continue;
    }
    if (appliedProviders.has(resolvedId)) {
      continue;
    }
    appliedProviders.add(resolvedId);

    for (const sectionItems of Object.values(manifest.sections || {})) {
      for (const item of sectionItems || []) {
        const key = item.key;
        if (!Object.prototype.hasOwnProperty.call(providerValues || {}, key)) {
          continue;
        }

        if (applySettings && item.settingId) {
          applyProviderSettingValue(item.settingId, providerValues[key]);
        }

        const cssVar = item.cssVar;
        if (!cssVar) {
          continue;
        }

        root.style.setProperty(cssVar, providerValues[key]);
      }
    }
  }
}

function applyTheme(theme = getActiveTheme(), { applyExtensionSettings = false } = {}) {
  ensureThemeLabOptions(theme);
  normalizeThemeExtensionValues(theme);
  applyComfyBase(theme.colors?.comfy_base);
  applyNodeSlotColors(theme.colors?.node_slot);
  applyLiteGraph(theme.colors?.litegraph_base);
  applyThemeLabCanvasConfig(ensureThemeLabCanvasConfig(theme), { app });
  if (isThemeLabExtensionStylingEnabled(theme)) {
    applyExtensionVars(theme.colors?.extensions, { applySettings: applyExtensionSettings });
  } else {
    clearExtensionCssVars();
  }
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

function addThemeLabPaletteEntries(targetMap, sourceRecord, primaryId) {
  const mainId = primaryId || COMFY_THEME_LAB_ID;
  const mainPalette = buildComfyPaletteFromRecord(sourceRecord, mainId);
  targetMap[mainPalette.id] = mainPalette;
  return mainPalette;
}

function getRuntimePiniaCandidates() {
  return [
    getManager()?.store?.$pinia,
    getManager()?.stores?.$pinia,
    getManager()?.$pinia,
    app?.$pinia,
    globalThis?.pinia,
    globalThis?.__PINIA__,
  ];
}

function getRuntimeColorPaletteStore() {
  for (const pinia of getRuntimePiniaCandidates()) {
    const storeMap = pinia?._s;
    if (storeMap && typeof storeMap.get === "function") {
      const store = storeMap.get("colorPalette");
      if (store) {
        return store;
      }
    }
  }
  return null;
}

function getRuntimeNodeDefStore() {
  for (const pinia of getRuntimePiniaCandidates()) {
    const storeMap = pinia?._s;
    if (storeMap && typeof storeMap.get === "function") {
      const store = storeMap.get("nodeDef");
      if (store) {
        return store;
      }
    }
  }
  return null;
}

function getRuntimeActivePaletteId() {
  const store = getRuntimeColorPaletteStore();
  if (!store) {
    return "";
  }
  return String(store.activePaletteId ?? store.$state?.activePaletteId ?? "");
}

async function loadThemeLabPaletteInRuntime(paletteId) {
  const paletteApi = getManager()?.colorPalette;
  const loadPalette = paletteApi?.loadColorPalette;
  if (typeof loadPalette !== "function") {
    return false;
  }

  try {
    await Promise.resolve(loadPalette.call(paletteApi, paletteId));
    return true;
  } catch (runtimeError) {
    warn("Theme Lab runtime color palette reload failed", runtimeError);
    return false;
  }
}

async function upsertThemeLabPaletteViaService(palette) {
  const paletteId = String(palette?.id || "");
  if (!paletteId) {
    return false;
  }

  const paletteApi = getManager()?.colorPalette;
  const addPalette = paletteApi?.addCustomColorPalette;
  const deletePalette = paletteApi?.deleteCustomColorPalette;
  if (typeof addPalette !== "function") {
    return false;
  }

  const runtimeStore = getRuntimeColorPaletteStore();
  const existingPalettes = {
    ...normalizeCustomPaletteMap(await getComfySettingValue(
      COMFY_SETTING_CUSTOM_PALETTES,
      getSetting(COMFY_SETTING_CUSTOM_PALETTES, {}),
    )),
    ...normalizeCustomPaletteMap(runtimeStore?.customPalettes),
  };

  for (const legacyId of [COMFY_THEME_LAB_ID, ...COMFY_THEME_LAB_LEGACY_IDS]) {
    if (!existingPalettes[legacyId] || typeof deletePalette !== "function") {
      continue;
    }
    try {
      await Promise.resolve(deletePalette.call(paletteApi, legacyId));
    } catch {
      // ignore
    }
  }

  try {
    await Promise.resolve(addPalette.call(paletteApi, clone(palette)));
    return true;
  } catch (serviceError) {
    warn("Theme Lab color palette service add failed", serviceError);
    return false;
  }
}

async function activateThemeLabPalette(customPalettes, { includeMain = true } = {}) {
  if (!includeMain) {
    return true;
  }

  const paletteId = COMFY_THEME_LAB_ID;
  const palette = customPalettes?.[paletteId];
  if (!palette) {
    return false;
  }

  await upsertThemeLabPaletteViaService(palette);

  // Keep the live Pinia store aligned with the palette we just persisted so
  // Comfy's own loadColorPalette() reads the new colors, not stale startup state.
  syncRuntimeColorPaletteStore(customPalettes, paletteId);

  const runtimeStore = getRuntimeColorPaletteStore();
  if (runtimeStore) {
    try {
      runtimeStore.customPalettes = clone(customPalettes);
      runtimeStore.activePaletteId = paletteId;
    } catch (runtimeError) {
      warn("Failed to prime runtime color palette store", runtimeError);
    }
  }

  const currentPaletteId = String(await getComfySettingValue(
    COMFY_SETTING_COLOR_PALETTE,
    getSetting(COMFY_SETTING_COLOR_PALETTE, ""),
  ) || "");

  if (currentPaletteId === paletteId) {
    // Force GraphCanvas to re-run its setting watcher even when Theme Lab keeps
    // reusing the same palette id across edits.
    await setComfySettingValue(COMFY_SETTING_COLOR_PALETTE, "dark");
    await new Promise((resolve) => setTimeout(resolve, 32));
  }

  await setComfySettingValue(COMFY_SETTING_COLOR_PALETTE, paletteId);
  await new Promise((resolve) => setTimeout(resolve, 16));
  syncRuntimeColorPaletteStore(customPalettes, paletteId);
  await loadThemeLabPaletteInRuntime(paletteId);

  const confirmedPaletteId = String(await getComfySettingValue(
    COMFY_SETTING_COLOR_PALETTE,
    getSetting(COMFY_SETTING_COLOR_PALETTE, ""),
  ) || "");
  const runtimeActivePaletteId = getRuntimeActivePaletteId();

  return (
    confirmedPaletteId === paletteId
    && (!runtimeActivePaletteId || runtimeActivePaletteId === paletteId)
  );
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

async function setComfySettingValue(id, value, { allowApiFallback = true } = {}) {
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

  if (!allowApiFallback) {
    return false;
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
  const hasMainPalette = Boolean(currentPalettes[COMFY_THEME_LAB_ID]);
  const needsPaletteMigration = String(activePaletteId || "") !== COMFY_THEME_LAB_ID;
  const hasLegacyPalettes = COMFY_THEME_LAB_LEGACY_IDS.some((id) => Boolean(currentPalettes[id]));
  const alreadyRepaired = hasMainPalette && !needsPaletteMigration && !hasLegacyPalettes;
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
    ? await activateThemeLabPalette(currentPalettes)
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
  const directStore = getRuntimeColorPaletteStore();
  if (directStore) {
    try {
      directStore.customPalettes = clone(customPalettes);
      directStore.activePaletteId = activePaletteId;
      return true;
    } catch (syncError) {
      warn("Failed to sync runtime color palette store via direct Pinia store", syncError);
    }
  }

  for (const pinia of getRuntimePiniaCandidates()) {
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
  applyTheme(theme, { applyExtensionSettings: true });

  try {
    const isLight = inferComfyLightTheme(theme);
    document.body?.classList?.toggle("dark-theme", !isLight);
  } catch {
    // ignore
  }

  // Best effort sync for Comfy runtime palette store so components update without full page reload.
  syncRuntimeColorPaletteStore(customPalettes, activePaletteId);
  void loadThemeLabPaletteInRuntime(activePaletteId);

  refreshCanvas();

  try {
    window.dispatchEvent(new Event("resize"));
  } catch {
    // ignore
  }

  try {
    requestAnimationFrame(() => {
      void loadThemeLabPaletteInRuntime(activePaletteId);
      applyTheme(theme);
      refreshCanvas();
    });
  } catch {
    // ignore
  }

  setTimeout(() => {
    void loadThemeLabPaletteInRuntime(activePaletteId);
    applyTheme(theme);
    refreshCanvas();
  }, 120);
}

async function applyThemeAndPersist(record = getActiveThemeRecord(), { notify = true, refresh = true } = {}) {
  const target = record?.data ? record : getActiveThemeRecord();
  if (!target?.data) {
    return false;
  }

  applyTheme(target.data, { applyExtensionSettings: true });

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
    ? await activateThemeLabPalette(currentPalettes)
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
        : `Theme applied locally, but ComfyUI theme sync failed (palettes:${palettesOk ? "ok" : "fail"}, activate:${activeOk ? "ok" : "fail"}, export:${exportOk ? "ok" : "fail"}).`;
      showToast({
        severity: "warn",
        summary: "Theme Lab",
        detail,
      });
    }
  }

  if (refresh) {
    refreshStylingAfterApply(target.data, currentPalettes, palette.id);
  }

  return success;
}

function row(labelText, searchTerms = []) {
  const wrap = document.createElement("div");
  wrap.className = "tl-row";
  wrap.dataset.tlRowSearch = buildSearchIndex(labelText, searchTerms);

  const label = document.createElement("label");
  label.textContent = labelText;

  const right = document.createElement("div");
  right.className = "tl-right";

  wrap.append(label, right);
  return {
    wrap,
    right,
    setSearchTerms(nextTerms) {
      wrap.dataset.tlRowSearch = buildSearchIndex(labelText, nextTerms);
    },
    setChanged(changed) {
      const next = Boolean(changed);
      wrap.dataset.tlRowChanged = String(next);
      wrap.classList.toggle("is-changed", next);
    },
  };
}

function setControlDisabled(control, disabled) {
  if (!control) {
    return;
  }

  if ("disabled" in control) {
    control.disabled = Boolean(disabled);
  }

  for (const field of control.querySelectorAll?.("input, select, textarea, button") || []) {
    field.disabled = Boolean(disabled);
  }
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

function clampColorByte(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.min(255, Math.max(0, Math.round(number)));
}

function clampAlpha(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 1;
  }
  return Math.min(1, Math.max(0, number));
}

function hexToColorParts(value) {
  const parsed = parseHexColor(value, { allowAlpha: true });
  if (!parsed) {
    return null;
  }

  const body = parsed.slice(1);
  const r = Number.parseInt(body.slice(0, 2), 16);
  const g = Number.parseInt(body.slice(2, 4), 16);
  const b = Number.parseInt(body.slice(4, 6), 16);
  const a = body.length === 8 ? Number.parseInt(body.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function colorPartsToHex({ r = 0, g = 0, b = 0, a = 1 } = {}) {
  const alpha = clampAlpha(a);
  const toHex = (number) => clampColorByte(number).toString(16).padStart(2, "0").toUpperCase();
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (alpha >= 0.999) {
    return base;
  }
  return `${base}${toHex(Math.round(alpha * 255))}`;
}

function parseCssColorValue(value, preferredFormat = "") {
  const hex = parseHexColor(value, { allowAlpha: true });
  if (hex) {
    return { hex, format: preferredFormat || "hex" };
  }

  const tripletMatch = String(value || "").trim().match(
    /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?$/,
  );
  if (tripletMatch) {
    return {
      hex: colorPartsToHex({
        r: tripletMatch[1],
        g: tripletMatch[2],
        b: tripletMatch[3],
        a: tripletMatch[4] ?? 1,
      }),
      format: preferredFormat || (tripletMatch[4] ? "rgba-triplet" : "rgb-triplet"),
    };
  }

  const rgbMatch = String(value || "").trim().match(
    /^(rgba?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i,
  );
  if (rgbMatch) {
    return {
      hex: colorPartsToHex({
        r: rgbMatch[2],
        g: rgbMatch[3],
        b: rgbMatch[4],
        a: rgbMatch[5] ?? 1,
      }),
      format: preferredFormat || (rgbMatch[1].toLowerCase() === "rgba" ? "rgba-function" : "rgb-function"),
    };
  }

  return null;
}

function formatCssColorValue(hexValue, { colorFormat = "", fallbackValue = "" } = {}) {
  const parts = hexToColorParts(hexValue) || hexToColorParts(fallbackValue) || { r: 0, g: 0, b: 0, a: 1 };
  const format = colorFormat || parseCssColorValue(fallbackValue)?.format || "hex";

  if (format === "rgb-triplet") {
    return `${parts.r},${parts.g},${parts.b}`;
  }
  if (format === "rgba-triplet") {
    return `${parts.r},${parts.g},${parts.b},${Number(parts.a.toFixed(3))}`;
  }
  if (format === "rgb-function") {
    return `rgb(${parts.r}, ${parts.g}, ${parts.b})`;
  }
  if (format === "rgba-function") {
    return `rgba(${parts.r}, ${parts.g}, ${parts.b}, ${Number(parts.a.toFixed(3))})`;
  }

  return colorPartsToHex(parts);
}

function colorInput(target, key, onAny, options = {}) {
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

  const initial = parseCssColorValue(target[key], options.colorFormat)?.hex
    || normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
  hex.value = initial;
  picker.value = initial.slice(0, 7);

  const syncValue = () => {
    const next = parseCssColorValue(target[key], options.colorFormat)?.hex
      || normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
    hex.value = next;
    picker.value = next.slice(0, 7);
    hex.classList.remove("is-invalid");
  };

  picker.addEventListener("input", () => {
    const current = parseCssColorValue(target[key], options.colorFormat)?.hex
      || parseHexColor(hex.value, { allowAlpha: true });
    const alpha = current && current.length === 9 ? current.slice(7) : "";
    const next = `${picker.value.toUpperCase()}${alpha}`;
    target[key] = formatCssColorValue(next, {
      colorFormat: options.colorFormat,
      fallbackValue: target[key],
    });
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

    target[key] = formatCssColorValue(parsed, {
      colorFormat: options.colorFormat,
      fallbackValue: target[key],
    });
    hex.value = parsed;
    picker.value = parsed.slice(0, 7);
    onAny();
  });

  hex.addEventListener("blur", () => {
    const parsed = parseHexColor(hex.value, { allowAlpha: true });
    if (!parsed) {
      const fallback = parseCssColorValue(target[key], options.colorFormat)?.hex
        || normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
      hex.value = fallback;
      picker.value = fallback.slice(0, 7);
      hex.classList.remove("is-invalid");
      return;
    }

    const normalizedTarget = parseCssColorValue(target[key], options.colorFormat)?.hex
      || normalizeHexColor(target[key], { allowAlpha: true, fallback: "#000000" });
    target[key] = formatCssColorValue(parsed, {
      colorFormat: options.colorFormat,
      fallbackValue: target[key],
    });
    hex.value = parsed;
    picker.value = parsed.slice(0, 7);
    hex.classList.remove("is-invalid");
    if (parsed !== normalizedTarget) {
      onAny();
    }
  });

  wrap._tlSync = syncValue;
  wrap.append(picker, hex);
  return wrap;
}

function textInput(target, key, onAny, placeholder = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tl-text-input";
  input.placeholder = placeholder;
  input.value = target[key] ?? "";

  input.addEventListener("change", () => {
    target[key] = input.value;
    onAny();
  });

  input._tlSync = () => {
    input.value = target[key] ?? "";
  };
  return input;
}

function numberInput(target, key, onAny, step = 1, min, max) {
  const input = document.createElement("input");
  input.type = "number";
  input.step = String(step);
  input.value = target[key] ?? 0;
  if (Number.isFinite(min)) {
    input.min = String(min);
  }
  if (Number.isFinite(max)) {
    input.max = String(max);
  }

  input.addEventListener("change", () => {
    const parsed = Number(input.value);
    let next = Number.isFinite(parsed) ? parsed : 0;
    if (Number.isFinite(min)) {
      next = Math.max(min, next);
    }
    if (Number.isFinite(max)) {
      next = Math.min(max, next);
    }
    target[key] = next;
    input.value = String(next);
    onAny();
  });

  input._tlSync = () => {
    input.value = target[key] ?? 0;
  };
  return input;
}

function booleanInput(target, key, onAny) {
  const wrap = document.createElement("label");
  wrap.className = "tl-toggle-control";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "tl-toggle";
  input.checked = Boolean(target[key]);

  const text = document.createElement("span");
  text.textContent = input.checked ? "On" : "Off";

  input.addEventListener("change", () => {
    target[key] = input.checked;
    text.textContent = input.checked ? "On" : "Off";
    onAny();
  });

  wrap._tlSync = () => {
    input.checked = Boolean(target[key]);
    text.textContent = input.checked ? "On" : "Off";
  };
  wrap.append(input, text);
  return wrap;
}

function selectInput(target, key, onAny, options = []) {
  const input = document.createElement("select");
  input.className = "tl-text-input tl-select-input";

  for (const option of options || []) {
    const optionEl = document.createElement("option");
    optionEl.value = String(option?.value ?? "");
    optionEl.textContent = String(option?.label ?? option?.value ?? "");
    input.appendChild(optionEl);
  }

  const current = String(target[key] ?? options?.[0]?.value ?? "");
  input.value = current;
  if (input.value !== current && options?.length) {
    input.value = String(options[0].value);
  }
  if (input.value) {
    target[key] = input.value;
  }

  input.addEventListener("change", () => {
    target[key] = input.value;
    onAny();
  });

  input._tlSync = () => {
    const current = String(target[key] ?? options?.[0]?.value ?? "");
    input.value = current;
    if (input.value !== current && options?.length) {
      input.value = String(options[0].value);
    }
    if (input.value) {
      target[key] = input.value;
    }
  };
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

  textarea._tlSync = () => {
    textarea.value = target[key] ?? "";
  };

  return textarea;
}

function normalizeComparableValue(value, fieldType = "") {
  if (fieldType === "color") {
    return parseCssColorValue(value)?.hex || normalizeHexColor(value, { allowAlpha: true, fallback: "#000000" });
  }

  if (fieldType === "number") {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (fieldType === "boolean") {
    return Boolean(value);
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value ?? "");
}

function isTrackedValueChanged(value, baselineValue, fieldType = "") {
  return normalizeComparableValue(value, fieldType) !== normalizeComparableValue(baselineValue, fieldType);
}

function section(title, options = {}) {
  const {
    id = slugifyThemeName(title, "section"),
    meta = "",
    searchTerms = [],
    defaultOpen = true,
  } = options;

  const wrapper = document.createElement("section");
  wrapper.className = "tl-section";
  wrapper.dataset.sectionId = id;

  const header = document.createElement("div");
  header.className = "tl-section-header";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "tl-section-toggle";

  const heading = document.createElement("span");
  heading.className = "tl-section-heading";

  const titleEl = document.createElement("span");
  titleEl.className = "tl-section-title";
  titleEl.textContent = title;

  const metaEl = document.createElement("span");
  metaEl.className = "tl-section-meta";

  heading.append(titleEl, metaEl);

  const chevron = document.createElement("span");
  chevron.className = "tl-section-chevron";
  chevron.textContent = ">";

  toggle.append(heading, chevron);

  const body = document.createElement("div");
  body.className = "tl-section-body";

  const actions = document.createElement("div");
  actions.className = "tl-section-actions";

  header.append(toggle, actions);
  wrapper.append(header, body);

  const updateMetaDisplay = () => {
    const parts = [];
    const metaText = String(wrapper._tlBaseMeta || "").trim();
    const changedCount = Number(wrapper._tlChangedCount || 0);
    if (metaText) {
      parts.push(metaText);
    }
    if (changedCount > 0) {
      parts.push(`${changedCount} changed`);
    }
    metaEl.textContent = parts.join(" · ");
    metaEl.hidden = parts.length === 0;
    wrapper.classList.toggle("is-changed", changedCount > 0);
    wrapper.dataset.tlSectionChanged = String(changedCount > 0);
    wrapper.dataset.search = buildSearchIndex(title, parts.join(" "), wrapper._tlSearchTerms || []);
  };

  const sectionRef = {
    wrap: wrapper,
    body,
    actions,
    setMeta(nextMeta) {
      wrapper._tlBaseMeta = String(nextMeta || "").trim();
      updateMetaDisplay();
    },
    setSearchTerms(nextTerms) {
      wrapper._tlSearchTerms = flattenSearchTerms(nextTerms);
      updateMetaDisplay();
    },
    setChangeCount(count) {
      wrapper._tlChangedCount = Number(count) || 0;
      updateMetaDisplay();
    },
    setCollapsed(collapsed, persist = true) {
      wrapper.classList.toggle("is-collapsed", Boolean(collapsed));
      toggle.setAttribute("aria-expanded", String(!collapsed));
      if (persist) {
        setEditorSectionOpen(id, !collapsed);
      }
    },
    addAction(label, onClick, className = "tl-mini") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = className;
      action.textContent = label;
      action.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
      });
      actions.appendChild(action);
      return action;
    },
  };

  wrapper._tlBaseMeta = "";
  wrapper._tlChangedCount = 0;
  sectionRef.setMeta(meta);
  sectionRef.setSearchTerms(searchTerms);
  sectionRef.setCollapsed(!getEditorSectionOpen(id, defaultOpen), false);

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") !== "false";
    sectionRef.setCollapsed(isExpanded);
  });

  return sectionRef;
}

function addColorGrid(body, title, objectRef, keys, onAny, options = {}) {
  const {
    registerControl = null,
    registerTrackedRow = null,
    baselineSource = {},
  } = options;
  const sec = section(title, {
    id: slugifyThemeName(title, "colors"),
    meta: `${keys.length} colors`,
    searchTerms: keys,
  });
  const grid = document.createElement("div");
  grid.className = "tl-grid";

  for (const key of keys) {
    const rowRef = row(key, [key, "color"]);
    const { wrap, right } = rowRef;
    const input = colorInput(objectRef, key, onAny);
    right.appendChild(input);
    registerControl?.(input);
    registerTrackedRow?.(sec, rowRef, {
      getValue: () => objectRef?.[key],
      getBaselineValue: () => baselineSource?.[key],
      type: "color",
    });
    grid.appendChild(wrap);
  }

  sec.body.appendChild(grid);
  body.appendChild(sec.wrap);
  return sec;
}

function addMixedGrid(body, title, objectRef, spec, onAny, options = {}) {
  const {
    registerControl = null,
    registerTrackedRow = null,
    baselineSource = {},
  } = options;
  const sec = section(title, {
    id: slugifyThemeName(title, "section"),
    meta: `${spec.length} controls`,
    searchTerms: spec.flatMap((field) => [field.label, field.key, field.options || []]),
  });
  const grid = document.createElement("div");
  grid.className = "tl-grid";

  for (const field of spec) {
    const { key, label, type, step, placeholder, min, max, options } = field;
    const rowRef = row(label || key, [key, label, placeholder, options]);
    const { wrap, right } = rowRef;

    let input;
    if (type === "color") {
      input = colorInput(objectRef, key, onAny, field);
    } else if (type === "number") {
      input = numberInput(objectRef, key, onAny, step ?? 1, min, max);
    } else if (type === "boolean") {
      input = booleanInput(objectRef, key, onAny);
    } else if (type === "select") {
      input = selectInput(objectRef, key, onAny, options || []);
    } else {
      input = textInput(objectRef, key, onAny, placeholder ?? "");
    }

    right.appendChild(input);
    registerControl?.(input);
    registerTrackedRow?.(sec, rowRef, {
      getValue: () => objectRef?.[key],
      getBaselineValue: () => baselineSource?.[key],
      type,
    });
    grid.appendChild(wrap);
  }

  sec.body.appendChild(grid);
  body.appendChild(sec.wrap);
  return sec;
}

function buildAdvancedCssSection(body, theme, onAny, options = {}) {
  const {
    registerTrackedRow = null,
    registerSectionChange = null,
    baselineCustomCss = {},
  } = options;
  const sec = section("Advanced CSS", {
    id: "advanced-css",
    meta: `${theme.custom_css.vars?.length || 0} vars`,
    searchTerms: ["Scope selector", "CSS Variables", "Raw CSS", "custom css"],
  });

  const scope = row("Scope selector", ["scope", ":root", "selector"]);
  scope.right.appendChild(textInput(theme.custom_css, "scope", onAny, ":root"));
  registerTrackedRow?.(sec, scope, {
    getValue: () => theme.custom_css?.scope,
    getBaselineValue: () => baselineCustomCss?.scope,
    type: "text",
  });
  sec.body.appendChild(scope.wrap);

  const varsWrap = document.createElement("div");
  varsWrap.className = "tl-vars";

  const varsLabel = document.createElement("div");
  varsLabel.textContent = "CSS Variables";
  sec.body.append(varsLabel, varsWrap);

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
  sec.body.appendChild(controls);

  function renderVars() {
    varsWrap.replaceChildren();
    sec.setMeta(`${theme.custom_css.vars?.length || 0} vars`);

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
  sec.body.appendChild(rawLabel);

  const rawInput = textareaInput(theme.custom_css, "raw", onAny, "/* Write any CSS here */");
  sec.body.appendChild(rawInput);
  registerTrackedRow?.(sec, {
    wrap: rawInput,
    setChanged(changed) {
      rawInput.classList.toggle("is-changed", Boolean(changed));
    },
  }, {
    getValue: () => theme.custom_css?.raw,
    getBaselineValue: () => baselineCustomCss?.raw,
    type: "text",
  });

  registerSectionChange?.(sec, () => (
    isTrackedValueChanged(theme.custom_css?.vars || [], baselineCustomCss?.vars || [], "json") ? 1 : 0
  ));

  const hint = document.createElement("div");
  hint.className = "tl-subtle";
  hint.textContent = "Variables apply to the selected scope. Raw CSS is injected into <style>.";
  sec.body.appendChild(hint);

  body.appendChild(sec.wrap);
  return sec;
}

function addExtensionSections(body, theme, providers, onAny, callbacks = {}) {
  const extensions = theme.colors.extensions || (theme.colors.extensions = {});
  const baselineExtensions = callbacks.baselineExtensions || {};
  let defaultsApplied = false;
  const sections = [];
  const onExtensionAny = ({ preview = true } = {}) => onAny({
    preview,
    applyExtensionSettings: true,
  });
  const extensionStylingEnabled = isThemeLabExtensionStylingEnabled(theme);

  for (const provider of providers) {
    runtime.providerIndex[provider.id] = provider;
    const providerExtensions = extensions[provider.id] || (extensions[provider.id] = {});
    const baselineProviderExtensions = baselineExtensions[provider.id] || {};

    const providerSections = Object.entries(provider.sections || {});
    const totalControls = providerSections.reduce((sum, [, items]) => sum + (items?.length || 0), 0);
    const sec = section(`Extension - ${provider.title}`, {
      id: slugifyThemeName(`extension-${provider.id}`, "extension"),
      meta: `${totalControls} controls`,
      searchTerms: [
        provider.id,
        provider.title,
        "extension",
        "theme",
        "style",
        "css",
        ...providerSections.flatMap(([sectionName, items]) => [
          sectionName,
          ...(items || []).flatMap((item) => [item.key, item.label, item.options || [], item.settingId, item.cssVar, item.source]),
        ]),
      ],
    });
    sec.wrap.classList.toggle("is-disabled", !extensionStylingEnabled);

    const resetAction = sec.addAction("Reset", () => {
      for (const [, items] of providerSections) {
        for (const item of items || []) {
          if (item.default !== undefined) {
            providerExtensions[item.key] = clone(item.default);
          } else {
            delete providerExtensions[item.key];
          }
        }
      }
      onExtensionAny();
      callbacks.refresh?.();
    });
    resetAction.disabled = !extensionStylingEnabled;

    for (const [sectionName, items] of providerSections) {
      const group = document.createElement("div");
      group.className = "tl-extension-group";
      group.dataset.tlExtensionGroup = "true";

      const groupHeader = document.createElement("div");
      groupHeader.className = "tl-extension-group-header";

      const groupTitle = document.createElement("div");
      groupTitle.className = "tl-extension-group-title";
      groupTitle.textContent = sectionName;

      const groupMeta = document.createElement("div");
      groupMeta.className = "tl-extension-group-meta";
      groupMeta.textContent = `${(items || []).length} control${(items || []).length === 1 ? "" : "s"}`;

      groupHeader.append(groupTitle, groupMeta);

      const grid = document.createElement("div");
      grid.className = "tl-grid";

      for (const item of items || []) {
        if (providerExtensions[item.key] === undefined && item.default !== undefined) {
          providerExtensions[item.key] = item.default;
          defaultsApplied = true;
        }

        const rowRef = row(item.label || item.key, [
          item.key,
          item.label,
          item.options || [],
          item.settingId,
          item.cssVar,
          item.source,
          sectionName,
          provider.title,
        ]);
        const { wrap, right } = rowRef;
        let input;

        if (item.type === "color") {
          input = colorInput(providerExtensions, item.key, onExtensionAny, item);
        } else if (item.type === "number") {
          input = numberInput(providerExtensions, item.key, onExtensionAny, item.step ?? 1, item.min, item.max);
        } else if (item.type === "boolean") {
          input = booleanInput(providerExtensions, item.key, onExtensionAny);
        } else if (item.type === "select") {
          input = selectInput(providerExtensions, item.key, onExtensionAny, item.options || []);
        } else {
          input = textInput(providerExtensions, item.key, onExtensionAny, item.placeholder ?? "");
        }

        setControlDisabled(input, !extensionStylingEnabled);
        right.appendChild(input);
        callbacks.registerControl?.(input);
        callbacks.registerTrackedRow?.(sec, rowRef, {
          getValue: () => providerExtensions?.[item.key],
          getBaselineValue: () => (
            baselineProviderExtensions?.[item.key] !== undefined
              ? baselineProviderExtensions[item.key]
              : item.default
          ),
          type: item.type,
        });
        grid.appendChild(wrap);
      }

      group.append(groupHeader, grid);
      sec.body.appendChild(group);
    }

    body.appendChild(sec.wrap);
    sections.push(sec);
  }

  if (defaultsApplied) {
    onExtensionAny();
  }

  return sections;
}

function createEditorTools(theme, onAny, sections, callbacks = {}) {
  const wrap = document.createElement("div");
  wrap.className = "tl-editor-tools";
  ensureThemeLabOptions(theme);
  const changeState = {
    changedSections: 0,
    changedRows: 0,
  };

  const topRow = document.createElement("div");
  topRow.className = "tl-editor-tools-row";

  const searchWrap = document.createElement("label");
  searchWrap.className = "tl-searchbox tl-editor-search";

  const searchLabel = document.createElement("span");
  searchLabel.className = "tl-searchbox-icon";
  searchLabel.textContent = "Search";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "tl-searchbox-input";
  searchInput.placeholder = "Filter editor sections, fields, and extension controls";
  searchInput.autocomplete = "off";
  searchInput.spellcheck = false;

  searchWrap.append(searchLabel, searchInput);

  const actions = document.createElement("div");
  actions.className = "tl-editor-actions";

  const expandButton = document.createElement("button");
  expandButton.className = "tl-mini";
  expandButton.type = "button";
  expandButton.textContent = "Expand all";

  const collapseButton = document.createElement("button");
  collapseButton.className = "tl-mini";
  collapseButton.type = "button";
  collapseButton.textContent = "Collapse all";

  const clearSearchButton = document.createElement("button");
  clearSearchButton.className = "tl-mini";
  clearSearchButton.type = "button";
  clearSearchButton.textContent = "Clear search";

  actions.append(expandButton, collapseButton, clearSearchButton);
  topRow.append(searchWrap, actions);

  const navigationRow = document.createElement("div");
  navigationRow.className = "tl-editor-tools-row tl-editor-tools-row-secondary";

  const jumpWrap = document.createElement("label");
  jumpWrap.className = "tl-inline-input tl-editor-jump";

  const jumpLabel = document.createElement("span");
  jumpLabel.textContent = "Jump to section";

  const jumpSelect = document.createElement("select");
  jumpSelect.className = "tl-text-input tl-select-input tl-editor-jump-select";

  const jumpPlaceholder = document.createElement("option");
  jumpPlaceholder.value = "";
  jumpPlaceholder.textContent = "Choose section";
  jumpSelect.appendChild(jumpPlaceholder);
  jumpSelect.value = "";

  jumpWrap.append(jumpLabel, jumpSelect);
  navigationRow.appendChild(jumpWrap);

  const changedOnlyWrap = document.createElement("label");
  changedOnlyWrap.className = "tl-inline-toggle";

  const changedOnlyInput = document.createElement("input");
  changedOnlyInput.type = "checkbox";

  const changedOnlyText = document.createElement("span");
  changedOnlyText.textContent = "Show changed only";

  changedOnlyWrap.append(changedOnlyInput, changedOnlyText);
  navigationRow.appendChild(changedOnlyWrap);

  const canvasButtons = new Map();
  const typographyButtons = new Map();
  const extensionToggleWrap = document.createElement("label");
  const extensionToggleInput = document.createElement("input");
  const extensionToggleText = document.createElement("span");

  const buildPresetRow = (labelText, presets, applyPreset, buttonMap) => {
    const rowWrap = document.createElement("div");
    rowWrap.className = "tl-editor-presets";

    const label = document.createElement("span");
    label.className = "tl-editor-tools-label";
    label.textContent = labelText;

    const cluster = document.createElement("div");
    cluster.className = "tl-preset-cluster";

    for (const [presetKey, presetLabel] of presets) {
      const button = document.createElement("button");
      button.className = "tl-preset-chip";
      button.type = "button";
      button.textContent = presetLabel;
      button.addEventListener("click", () => {
        applyPreset(presetKey);
        onAny();
        if (typeof callbacks.syncControls === "function") {
          callbacks.syncControls();
        } else if (typeof callbacks.refresh === "function") {
          callbacks.refresh();
        } else {
          refreshFilter();
          syncPresetState();
        }
      });
      cluster.appendChild(button);
      buttonMap.set(presetKey, button);
    }

    rowWrap.append(label, cluster);
    return rowWrap;
  };

  const presetRow = buildPresetRow(
    "Canvas Presets",
    [
      ["compact", "Compact"],
      ["default", "Default"],
      ["spacious", "Spacious"],
      ["presentation", "Presentation"],
    ],
    (presetKey) => applyCanvasPreset(theme, presetKey),
    canvasButtons,
  );

  const typographyRow = buildPresetRow(
    "UI Density",
    [
      ["compact", "Compact"],
      ["default", "Default"],
      ["comfortable", "Comfortable"],
      ["presentation", "Presentation"],
    ],
    (presetKey) => applyTypographyPreset(theme, presetKey),
    typographyButtons,
  );

  const extensionRow = document.createElement("div");
  extensionRow.className = "tl-editor-presets tl-extension-tools-row";

  const extensionLabel = document.createElement("span");
  extensionLabel.className = "tl-editor-tools-label";
  extensionLabel.textContent = "Extension Styling";

  const extensionCluster = document.createElement("div");
  extensionCluster.className = "tl-preset-cluster tl-extension-tools";

  extensionToggleWrap.className = "tl-inline-toggle";
  extensionToggleInput.type = "checkbox";
  extensionToggleInput.checked = isThemeLabExtensionStylingEnabled(theme);
  extensionToggleText.textContent = extensionToggleInput.checked ? "Enabled" : "Disabled";
  extensionToggleWrap.append(extensionToggleInput, extensionToggleText);

  const extensionInfo = document.createElement("button");
  extensionInfo.type = "button";
  extensionInfo.className = "tl-tooltip-chip";
  extensionInfo.textContent = "i";
  extensionInfo.classList.add("tl-has-tooltip");
  extensionInfo.dataset.tooltip = EXTENSION_STYLING_TOOLTIP;
  extensionInfo.setAttribute("aria-label", EXTENSION_STYLING_TOOLTIP);

  const reloadButton = document.createElement("button");
  reloadButton.className = "tl-mini";
  reloadButton.type = "button";
  reloadButton.textContent = "Reload";
  reloadButton.addEventListener("click", () => {
    callbacks.reloadAndReopenStudio?.("editor");
  });

  extensionToggleInput.addEventListener("change", () => {
    setThemeLabExtensionStylingEnabled(theme, extensionToggleInput.checked);
    extensionToggleText.textContent = extensionToggleInput.checked ? "Enabled" : "Disabled";
    onAny({ preview: false, applyExtensionSettings: true });
    callbacks.previewTheme?.(true);
    if (typeof callbacks.syncControls === "function") {
      callbacks.syncControls();
    } else {
      callbacks.refresh?.();
    }
  });

  extensionCluster.append(extensionToggleWrap, extensionInfo, reloadButton);
  extensionRow.append(extensionLabel, extensionCluster);

  const status = document.createElement("div");
  status.className = "tl-subtle tl-editor-tools-status";

  const canvasHint = document.createElement("div");
  canvasHint.className = "tl-editor-helpline";

  const typographyHint = document.createElement("div");
  typographyHint.className = "tl-editor-helpline";

  const empty = document.createElement("div");
  empty.className = "tl-empty tl-editor-empty";
  empty.hidden = true;
  empty.textContent = "No editor sections match the current filter.";

  function syncSectionOptions() {
    const currentValue = jumpSelect.value;
    jumpSelect.replaceChildren(jumpPlaceholder);

    for (const sectionRef of sections) {
      const option = document.createElement("option");
      option.value = String(sectionRef.wrap.dataset.sectionId || "");
      option.textContent = sectionRef.wrap.querySelector(".tl-section-title")?.textContent || option.value;
      jumpSelect.appendChild(option);
    }

    if (currentValue && Array.from(jumpSelect.options).some((option) => option.value === currentValue)) {
      jumpSelect.value = currentValue;
    } else {
      jumpSelect.value = "";
    }
  }

  function refreshFilter() {
    const query = String(searchInput.value || "").trim().toLowerCase();
    const changedOnly = changedOnlyInput.checked;
    let visibleSections = 0;
    let visibleRows = 0;
    let totalRows = 0;

    for (const sectionRef of sections) {
      const result = setSectionFilterState(sectionRef, query, { changedOnly });
      totalRows += result.totalRows;
      visibleRows += result.visibleRows;
      if (result.match) {
        visibleSections += 1;
      }
    }

    const totalCount = sections.length;
    const changedSummary = changeState.changedRows > 0
      ? ` · ${changeState.changedRows} changed control${changeState.changedRows === 1 ? "" : "s"}`
      : "";
    if (changedOnly && !query) {
      status.textContent = `${visibleSections} changed section${visibleSections === 1 ? "" : "s"} visible${changedSummary}`;
    } else if (query || changedOnly) {
      status.textContent = `${visibleSections} of ${totalCount} sections · ${visibleRows} controls visible${changedSummary}`;
    } else {
      status.textContent = `${totalCount} editor sections · ${totalRows} controls${changedSummary}`;
    }
    empty.hidden = visibleSections !== 0;
    empty.textContent = changedOnly
      ? "No changed editor sections match the current filter."
      : "No editor sections match the current filter.";
  }

  expandButton.addEventListener("click", () => {
    for (const sectionRef of sections) {
      sectionRef.setCollapsed(false);
    }
    refreshFilter();
  });

  collapseButton.addEventListener("click", () => {
    for (const sectionRef of sections) {
      sectionRef.setCollapsed(true);
    }
    refreshFilter();
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    refreshFilter();
    searchInput.focus();
  });

  searchInput.addEventListener("input", refreshFilter);
  changedOnlyInput.addEventListener("change", refreshFilter);
  jumpSelect.addEventListener("change", () => {
    const targetId = String(jumpSelect.value || "").trim();
    if (!targetId) {
      return;
    }

    const sectionRef = sections.find((entry) => String(entry.wrap.dataset.sectionId || "") === targetId);
    if (!sectionRef) {
      return;
    }

    sectionRef.setCollapsed(false);
    sectionRef.wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    jumpSelect.value = "";
  });

  function syncPresetState() {
    const activeCanvasPreset = resolveCanvasPresetKey(theme);
    const activeTypographyPreset = resolveTypographyPresetKey(theme);

    for (const [presetKey, button] of canvasButtons.entries()) {
      button.classList.toggle("is-active", presetKey === activeCanvasPreset);
    }

    for (const [presetKey, button] of typographyButtons.entries()) {
      button.classList.toggle("is-active", presetKey === activeTypographyPreset);
    }

    extensionToggleInput.checked = isThemeLabExtensionStylingEnabled(theme);
    extensionToggleText.textContent = extensionToggleInput.checked ? "Enabled" : "Disabled";

    canvasHint.textContent = THEME_LAB_CANVAS_PRESET_DESCRIPTIONS[activeCanvasPreset || "custom"];
    typographyHint.textContent = THEME_LAB_TYPOGRAPHY_PRESET_DESCRIPTIONS[activeTypographyPreset || "custom"];
  }

  function syncChangedState({ changedSections = 0, changedRows = 0 } = {}) {
    changeState.changedSections = Number(changedSections) || 0;
    changeState.changedRows = Number(changedRows) || 0;
    refreshFilter();
  }

  wrap.append(topRow, navigationRow, presetRow, canvasHint, typographyRow, typographyHint, extensionRow, status, empty);
  syncSectionOptions();
  refreshFilter();
  syncPresetState();

  return { wrap, refreshFilter, syncPresetState, syncSectionOptions, syncChangedState };
}

async function buildEditorSections(body, theme, onAny, callbacks = {}) {
  ensureThemeLabOptions(theme);
  const baselineTheme = clone(theme);
  ensureThemeLabOptions(baselineTheme);
  normalizeThemeExtensionValues(baselineTheme);
  const sections = [];
  const controlSyncers = [];
  const rowTrackers = [];
  const sectionChangeTrackers = [];
  let refreshEditorState = () => {};
  const handleAny = (options = {}) => {
    onAny(options);
    refreshEditorState();
  };
  const registerControl = (control) => {
    if (typeof control?._tlSync === "function") {
      controlSyncers.push(control._tlSync);
    }
    return control;
  };
  const registerTrackedRow = (sectionRef, rowRef, { getValue, getBaselineValue, type = "" } = {}) => {
    if (!sectionRef || !rowRef || typeof getValue !== "function" || typeof getBaselineValue !== "function") {
      return;
    }
    rowTrackers.push({
      sectionRef,
      rowRef,
      getValue,
      getBaselineValue,
      type,
    });
  };
  const registerSectionChange = (sectionRef, getChangedCount) => {
    if (!sectionRef || typeof getChangedCount !== "function") {
      return;
    }
    sectionChangeTrackers.push({
      sectionRef,
      getChangedCount,
    });
  };
  const toolCallbacks = {
    ...callbacks,
    syncControls: () => {},
  };
  const tools = createEditorTools(theme, handleAny, sections, toolCallbacks);
  body.appendChild(tools.wrap);

  const refreshChangedState = () => {
    const sectionCounts = new Map(sections.map((sectionRef) => [sectionRef, 0]));
    let changedRows = 0;

    for (const tracker of rowTrackers) {
      const changed = isTrackedValueChanged(
        tracker.getValue(),
        tracker.getBaselineValue(),
        tracker.type,
      );
      tracker.rowRef.setChanged?.(changed);
      if (!changed) {
        continue;
      }
      changedRows += 1;
      sectionCounts.set(tracker.sectionRef, (sectionCounts.get(tracker.sectionRef) || 0) + 1);
    }

    for (const tracker of sectionChangeTrackers) {
      const extraCount = Math.max(0, Number(tracker.getChangedCount()) || 0);
      if (!extraCount) {
        continue;
      }
      changedRows += extraCount;
      sectionCounts.set(tracker.sectionRef, (sectionCounts.get(tracker.sectionRef) || 0) + extraCount);
    }

    let changedSections = 0;
    for (const sectionRef of sections) {
      const count = sectionCounts.get(sectionRef) || 0;
      sectionRef.setChangeCount?.(count);
      if (count > 0) {
        changedSections += 1;
      }
    }

    return {
      changedRows,
      changedSections,
    };
  };

  const syncControls = () => {
    for (const sync of controlSyncers) {
      try {
        sync();
      } catch {
        // ignore stale control sync failures
      }
    }
    tools.syncPresetState?.();
    tools.syncSectionOptions?.();
    const changedState = refreshChangedState();
    tools.syncChangedState?.(changedState);
  };
  refreshEditorState = () => {
    const changedState = refreshChangedState();
    tools.syncChangedState?.(changedState);
  };
  toolCallbacks.syncControls = syncControls;

  const meta = section("Theme Meta", {
    id: "theme-meta",
    meta: "2 controls",
    searchTerms: ["Theme name", "Theme description", "name", "description"],
  });
  const metaGrid = document.createElement("div");
  metaGrid.className = "tl-grid";

  const nameRow = row("Theme name", ["name", "theme", "meta"]);
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "tl-text-input";
  nameInput.value = theme.name || "Theme";
  nameInput.placeholder = "Theme name";
  const syncThemeName = () => {
    theme.name = nameInput.value;
    handleAny({ preview: false });
  };
  nameInput.addEventListener("input", syncThemeName);
  nameInput.addEventListener("change", syncThemeName);
  nameInput.addEventListener("blur", () => {
    if (!String(nameInput.value || "").trim()) {
      nameInput.value = "Theme";
      syncThemeName();
    }
  });
  nameInput._tlSync = () => {
    nameInput.value = theme.name || "Theme";
  };
  nameRow.right.appendChild(nameInput);
  registerControl(nameInput);
  registerTrackedRow(meta, nameRow, {
    getValue: () => theme.name,
    getBaselineValue: () => baselineTheme.name,
    type: "text",
  });

  const descriptionRow = row("Theme description", ["description", "summary", "saved themes", "meta"]);
  const descriptionInput = textareaInput(
    theme,
    "description",
    () => handleAny({ preview: false }),
    "Short description shown in Saved Themes",
  );
  descriptionInput.rows = 3;
  descriptionInput.classList.add("tl-theme-description-input");
  descriptionRow.right.appendChild(descriptionInput);
  registerControl(descriptionInput);
  registerTrackedRow(meta, descriptionRow, {
    getValue: () => theme.description,
    getBaselineValue: () => baselineTheme.description,
    type: "text",
  });

  metaGrid.append(nameRow.wrap, descriptionRow.wrap);
  meta.body.appendChild(metaGrid);
  body.appendChild(meta.wrap);
  sections.push(meta);

  const nodeSlotSection = addColorGrid(body, "Node Slot Colors", theme.colors.node_slot, Object.keys(theme.colors.node_slot), handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.node_slot,
  });
  nodeSlotSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.node_slot, TEMPLATE.colors.node_slot, Object.keys(TEMPLATE.colors.node_slot));
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(nodeSlotSection);

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

  const litegraphSection = addMixedGrid(body, "LiteGraph Canvas", theme.colors.litegraph_base, litegraphSpec, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.litegraph_base,
  });
  litegraphSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.litegraph_base, TEMPLATE.colors.litegraph_base, litegraphSpec);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(litegraphSection);

  const canvasGeometrySection = addMixedGrid(body, "Canvas Geometry", theme.theme_lab.canvas, THEME_LAB_CANVAS_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.theme_lab.canvas,
  });
  canvasGeometrySection.addAction("Reset", () => {
    assignFieldDefaults(theme.theme_lab.canvas, THEME_LAB_CANVAS_DEFAULTS, THEME_LAB_CANVAS_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(canvasGeometrySection);

  const comfyCoreSection = addMixedGrid(body, "Comfy UI Colors", theme.colors.comfy_base, COMFY_CORE_COLOR_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.comfy_base,
  });
  comfyCoreSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.comfy_base, TEMPLATE.colors.comfy_base, COMFY_CORE_COLOR_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(comfyCoreSection);

  const comfyOptionalSection = addMixedGrid(body, "Comfy UI Optional Colors", theme.colors.comfy_base, COMFY_OPTIONAL_COLOR_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.comfy_base,
  });
  comfyOptionalSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.comfy_base, TEMPLATE.colors.comfy_base, COMFY_OPTIONAL_COLOR_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(comfyOptionalSection);

  const comfyDesignSection = addMixedGrid(body, "Design System Colors", theme.colors.comfy_base, COMFY_DESIGN_SYSTEM_COLOR_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.comfy_base,
  });
  comfyDesignSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.comfy_base, TEMPLATE.colors.comfy_base, COMFY_DESIGN_SYSTEM_COLOR_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(comfyDesignSection);

  const comfyStyleSection = addMixedGrid(body, "Comfy UI Styling", theme.colors.comfy_base, COMFY_STYLE_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.comfy_base,
  });
  comfyStyleSection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.comfy_base, TEMPLATE.colors.comfy_base, COMFY_STYLE_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(comfyStyleSection);

  const typographySection = addMixedGrid(body, "Fonts & Layout", theme.colors.comfy_base, COMFY_TYPOGRAPHY_FIELDS, handleAny, {
    registerControl,
    registerTrackedRow,
    baselineSource: baselineTheme.colors.comfy_base,
  });
  typographySection.addAction("Reset", () => {
    assignFieldDefaults(theme.colors.comfy_base, TEMPLATE.colors.comfy_base, COMFY_TYPOGRAPHY_FIELDS);
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(typographySection);

  const advancedCssSection = buildAdvancedCssSection(body, theme, handleAny, {
    registerTrackedRow,
    registerSectionChange,
    baselineCustomCss: baselineTheme.custom_css,
  });
  advancedCssSection.addAction("Reset", () => {
    theme.custom_css.scope = TEMPLATE.custom_css.scope;
    theme.custom_css.vars = clone(TEMPLATE.custom_css.vars);
    theme.custom_css.raw = TEMPLATE.custom_css.raw;
    handleAny();
    toolCallbacks.syncControls?.();
  });
  sections.push(advancedCssSection);

  const providers = await getProviders();
  if (normalizeThemeExtensionValues(theme)) {
    handleAny({ preview: false });
  }
  if (providers.length) {
    sections.push(...addExtensionSections(body, theme, providers, handleAny, {
      ...callbacks,
      registerControl,
      registerTrackedRow,
      baselineExtensions: baselineTheme.colors.extensions,
    }));
  }

  syncControls();
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
    refreshExtensionProviders,
    reloadAndReopenStudio,
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
  await refreshExtensionProviders();
  await getStudioDialog().open(page);
}

function cleanupSidebarRender() {
  if (typeof runtime.sidebarCleanup === "function") {
    try {
      runtime.sidebarCleanup();
    } catch {
      // ignore sidebar cleanup failures
    }
  }
  runtime.sidebarCleanup = null;
}

function applyThemePreviewBackground(previewEl, record) {
  const previewUrl = getThemePreviewUrl(record);
  const fallbackGradient = themePreviewGradient(record?.data);

  previewEl.style.background = fallbackGradient;
  if (previewUrl) {
    previewEl.style.backgroundImage = `url("${previewUrl}")`;
    previewEl.style.backgroundSize = "cover";
    previewEl.style.backgroundPosition = "center";
    previewEl.style.backgroundRepeat = "no-repeat";
  } else {
    previewEl.style.backgroundImage = "none";
  }
}

function renderSidebarLauncher(el, { autoOpen = true } = {}) {
  try {
    el.replaceChildren();
  } catch {
    el.innerHTML = "";
  }

  loadCssOnce();
  const suppressedTargets = suppressSidebarLauncherHost(el);

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
  if (autoOpen) {
    queueMicrotask(() => {
      const closed = tryExecuteCommand("Workspace.ToggleSidebarTab.themeLabTab");
      const open = () => void openStudio("themes");
      if (closed) {
        setTimeout(open, 0);
      } else {
        open();
      }
      setTimeout(() => restoreSidebarLauncherHost(suppressedTargets), 500);
    });
  } else {
    setTimeout(() => restoreSidebarLauncherHost(suppressedTargets), 0);
  }

  return () => {
    restoreSidebarLauncherHost(suppressedTargets);
  };
}

function renderSidebarTabContent(el, { autoOpen = false } = {}) {
  cleanupSidebarRender();
  runtime.sidebarHost = el instanceof HTMLElement ? el : null;

  const cleanup = renderSidebarLauncher(el, { autoOpen });
  runtime.sidebarCleanup = typeof cleanup === "function" ? cleanup : null;

  return () => {
    if (runtime.sidebarHost === el) {
      cleanupSidebarRender();
      runtime.sidebarHost = null;
    }
  };
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
      render: (el) => renderSidebarTabContent(el, { autoOpen: true }),
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
    applyTheme(getActiveTheme(), { applyExtensionSettings: true });
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
    applyTheme(getActiveTheme(), { applyExtensionSettings: true });
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
            ensureLibraryLoaded().then(() => applyTheme(getActiveTheme(), { applyExtensionSettings: true }));
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
        id: SETTINGS.SIDEBAR_PANEL,
        name: "Render side tabs as floating cards",
        type: "boolean",
        defaultValue: false,
        category: ["Theme Lab", "UI", "Sidebar"],
        tooltip: "Styles the shared ComfyUI side-tab panel so tabs like Model Library open inside a floating card shell instead of a flush drawer.",
        onChange: () => {
          syncGlobalSidebarCardMode();
        },
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
          runtime.providerAliasIndex = {};

          if (isLivePreviewEnabled()) {
            ensureLibraryLoaded().then(async () => {
              await refreshExtensionProviders();
              applyTheme(getActiveTheme(), { applyExtensionSettings: true });
            });
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
      syncGlobalSidebarCardMode();
      registerSidebarTab();

      void ensureLibraryLoaded().then(async () => {
        await repairMissingThemeLabPalette();
        await refreshExtensionProviders();
        scheduleStartupProviderRefreshes();
        if (isLivePreviewEnabled()) {
          applyTheme(getActiveTheme(), { applyExtensionSettings: true });
        }
        const reopenRequest = consumeStudioReopenRequest();
        if (reopenRequest?.page) {
          setTimeout(() => {
            void openStudio(reopenRequest.page);
          }, 40);
        }
      });

      log("Extension registered", VERSION, "base:", BASE);
    },
  });
} catch (registerError) {
  errorLog("registerExtension failed", registerError);
}
