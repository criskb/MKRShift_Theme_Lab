const FIELD_INDEX = new Map();
const GLASS_SURFACE_STYLES = new Set(["glass-panel", "liquid-glass"]);
const BACKDROP_BUFFER = {
  canvas: null,
  ctx: null,
};

export const THEME_LAB_CANVAS_DEFAULTS = Object.freeze({
  node_title_height: 30,
  node_slot_height: 20,
  node_widget_height: 20,
  node_corner_radius: 8,
  node_shape_profile: "default",
  node_shape_intensity: 1,
  node_surface_style: "default",
  node_slot_style: "auto",
  node_shadow_blur: 0,
  node_shadow_offset_y: 0,
  node_shadow_opacity: 0,
  node_inner_stroke_width: 0,
  node_header_band_height: 0,
  node_header_band_opacity: 0,
  connection_width: 3,
  link_render_mode: "spline",
  link_marker_shape: "circle",
  node_outline_width: 0,
  widget_outline_width: 1,
  group_outline_width: 1,
  reroute_dot_size: 10,
  reroute_slot_size: 5,
  render_connection_borders: true,
  render_connection_shadows: true,
  render_connection_arrows: false,
});

export const THEME_LAB_CANVAS_FIELDS = [
  { key: "node_title_height", label: "Node Title Height", type: "number", step: 1, min: 18, max: 72 },
  { key: "node_slot_height", label: "Node Slot Height", type: "number", step: 1, min: 12, max: 64 },
  { key: "node_widget_height", label: "Node Widget Height", type: "number", step: 1, min: 16, max: 72 },
  { key: "node_corner_radius", label: "Node Corner Radius", type: "number", step: 1, min: 0, max: 48 },
  {
    key: "node_shape_profile",
    label: "Node Shape Profile",
    type: "select",
    options: [
      { value: "default", label: "Default" },
      { value: "box", label: "Box" },
      { value: "round", label: "Round" },
      { value: "card", label: "Card" },
      { value: "squircle", label: "Squircle" },
      { value: "capsule", label: "Capsule" },
      { value: "panel", label: "Panel" },
      { value: "notch", label: "Notched Card" },
    ],
  },
  { key: "node_shape_intensity", label: "Shape Intensity", type: "number", step: 0.05, min: 0.6, max: 1.8 },
  {
    key: "node_surface_style",
    label: "Node Surface Style",
    type: "select",
    options: [
      { value: "default", label: "Default" },
      { value: "soft-card", label: "Soft Card" },
      { value: "media-card", label: "Media Card" },
      { value: "minimal-wire", label: "Minimal Wire" },
      { value: "glass-panel", label: "Glass Panel" },
      { value: "liquid-glass", label: "Liquid Glass" },
      { value: "studio-frame", label: "Floating Tabs" },
      { value: "neon-edge", label: "Mono Slab" },
    ],
  },
  {
    key: "node_slot_style",
    label: "Node Slot Style",
    type: "select",
    options: [
      { value: "auto", label: "Auto" },
      { value: "default", label: "Default" },
      { value: "floating", label: "Floating" },
      { value: "ring", label: "Ring" },
      { value: "minimal", label: "Minimal" },
      { value: "pill", label: "Pill" },
    ],
  },
  { key: "node_shadow_blur", label: "Node Shadow Blur", type: "number", step: 1, min: 0, max: 48 },
  { key: "node_shadow_offset_y", label: "Node Shadow Offset Y", type: "number", step: 1, min: -8, max: 24 },
  { key: "node_shadow_opacity", label: "Node Shadow Opacity", type: "number", step: 0.05, min: 0, max: 1 },
  { key: "node_inner_stroke_width", label: "Node Inner Stroke Width", type: "number", step: 0.25, min: 0, max: 8 },
  { key: "node_header_band_height", label: "Node Header Band Height", type: "number", step: 1, min: 0, max: 32 },
  { key: "node_header_band_opacity", label: "Node Header Band Opacity", type: "number", step: 0.05, min: 0, max: 1 },
  { key: "connection_width", label: "Connection Width", type: "number", step: 0.25, min: 1, max: 16 },
  {
    key: "link_render_mode",
    label: "Link Render Mode",
    type: "select",
    options: [
      { value: "spline", label: "Spline" },
      { value: "linear", label: "Linear" },
      { value: "straight", label: "Straight" },
    ],
  },
  {
    key: "link_marker_shape",
    label: "Link Marker Shape",
    type: "select",
    options: [
      { value: "circle", label: "Circle" },
      { value: "arrow", label: "Arrow" },
      { value: "none", label: "None" },
    ],
  },
  { key: "node_outline_width", label: "Node Outline Width", type: "number", step: 0.25, min: 0, max: 12 },
  { key: "widget_outline_width", label: "Widget Outline Width", type: "number", step: 0.25, min: 0.5, max: 8 },
  { key: "group_outline_width", label: "Group Outline Width", type: "number", step: 0.25, min: 0.5, max: 8 },
  { key: "reroute_dot_size", label: "Reroute Dot Size", type: "number", step: 0.5, min: 4, max: 32 },
  { key: "reroute_slot_size", label: "Reroute Slot Size", type: "number", step: 0.5, min: 2, max: 20 },
  { key: "render_connection_borders", label: "Connection Borders", type: "boolean" },
  { key: "render_connection_shadows", label: "Connection Shadows", type: "boolean" },
  { key: "render_connection_arrows", label: "Connection Arrows", type: "boolean" },
];

for (const field of THEME_LAB_CANVAS_FIELDS) {
  FIELD_INDEX.set(field.key, field);
}

const runtime = {
  installed: false,
  slotPatchesInstalled: false,
  active: { ...THEME_LAB_CANVAS_DEFAULTS },
  vueNodeObserver: null,
  vueNodeApplyScheduled: false,
  vueNodePendingConfig: null,
};

const ROOT_DATASET_KEYS = Object.freeze({
  shapeProfile: "themeLabNodeShapeProfile",
  surfaceStyle: "themeLabNodeSurfaceStyle",
  slotStyle: "themeLabNodeSlotStyle",
});

const GEOMETRY_KEYS = [
  "node_title_height",
  "node_slot_height",
  "node_widget_height",
  "node_corner_radius",
  "node_shape_profile",
  "node_shape_intensity",
  "node_surface_style",
  "node_slot_style",
];

const REROUTE_KEYS = [
  "reroute_dot_size",
  "reroute_slot_size",
];

function configsEqual(left, right) {
  if (!left || !right) {
    return false;
  }

  return Object.keys(THEME_LAB_CANVAS_DEFAULTS).every((key) => Object.is(left[key], right[key]));
}

function keysChanged(left, right, keys) {
  return keys.some((key) => !Object.is(left?.[key], right?.[key]));
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  let next = value;
  if (Number.isFinite(min)) {
    next = Math.max(min, next);
  }
  if (Number.isFinite(max)) {
    next = Math.min(max, next);
  }
  return next;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes" || lower === "on") {
      return true;
    }
    if (lower === "false" || lower === "0" || lower === "no" || lower === "off") {
      return false;
    }
  }
  return fallback;
}

function normalizeSelect(value, field, fallback) {
  const options = Array.isArray(field?.options) ? field.options.map((item) => String(item.value)) : [];
  const nextValue = String(value ?? fallback ?? "");
  if (options.includes(nextValue)) {
    return nextValue;
  }
  return String(fallback ?? options[0] ?? "");
}

function readDocumentRoot() {
  return typeof document !== "undefined" ? document.documentElement : null;
}

function readLiteGraph() {
  return globalThis.LiteGraph || globalThis.window?.LiteGraph || null;
}

function readGraphCanvas() {
  return globalThis.LGraphCanvas || globalThis.window?.LGraphCanvas || null;
}

function readGroupCtor(litegraph, app) {
  return litegraph?.LGraphGroup || app?.graph?._groups?.[0]?.constructor || null;
}

function readRerouteCtor(litegraph, app) {
  const rerouteSample = app?.graph?.reroutes?.values?.().next?.().value;
  return litegraph?.Reroute || rerouteSample?.constructor || null;
}

function setRootStylePx(root, property, value) {
  root?.style?.setProperty?.(property, `${Math.round(Number(value || 0) * 100) / 100}px`);
}

function setRootStyleValue(root, property, value) {
  root?.style?.setProperty?.(property, String(value ?? ""));
}

function getShapeIntensity(config = runtime.active) {
  return clamp(Number(config?.node_shape_intensity || 1), 0.6, 1.8);
}

function resolveNodeSlotStyle(config = runtime.active) {
  const requested = String(config?.node_slot_style || "auto").trim().toLowerCase() || "auto";
  if (requested !== "auto") {
    return requested;
  }
  const surfaceStyle = String(config?.node_surface_style || "default").trim().toLowerCase() || "default";
  if (surfaceStyle === "soft-card") {
    return "floating";
  }
  if (surfaceStyle === "media-card" || surfaceStyle === "glass-panel" || surfaceStyle === "liquid-glass") {
    return "ring";
  }
  if (surfaceStyle === "studio-frame") {
    return "pill";
  }
  if (surfaceStyle === "minimal-wire" || surfaceStyle === "neon-edge") {
    return "minimal";
  }
  return "default";
}

function buildVueNodeClasses(config) {
  const shapeProfile = String(config?.node_shape_profile || "default").trim().toLowerCase() || "default";
  const surfaceStyle = String(config?.node_surface_style || "default").trim().toLowerCase() || "default";
  const slotStyle = resolveNodeSlotStyle(config);
  return {
    shapeProfile,
    surfaceStyle,
    slotStyle,
    shapeClass: `tl-vue-node-shape-${shapeProfile}`,
    surfaceClass: `tl-vue-node-surface-${surfaceStyle}`,
    slotStyleClass: `tl-vue-node-slot-${slotStyle}`,
  };
}

const VUE_NODE_INLINE_PROPERTIES = Object.freeze([
  "border-radius",
  "overflow",
  "box-shadow",
  "background",
  "background-color",
  "backdrop-filter",
  "-webkit-backdrop-filter",
  "border-color",
  "border-width",
  "margin-left",
  "margin-right",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
  "padding-inline",
  "padding-block",
  "row-gap",
  "gap",
  "min-height",
  "width",
  "height",
  "isolation",
]);

function clearVueNodeInlineProperties(element) {
  if (!element?.style) {
    return;
  }
  for (const property of VUE_NODE_INLINE_PROPERTIES) {
    element.style.removeProperty(property);
  }
}

function setVueNodeInlineProperties(element, styles) {
  if (!element?.style || !styles) {
    return;
  }
  for (const [property, value] of Object.entries(styles)) {
    if (value === undefined || value === null || value === "") {
      element.style.removeProperty(property);
    } else {
      element.style.setProperty(property, String(value), "important");
    }
  }
}

function setVueNodeInlinePropertiesMany(elements, styles) {
  if (!elements?.length) {
    return;
  }
  for (const element of elements) {
    setVueNodeInlineProperties(element, styles);
  }
}

function setVueNodeCssVars(element, vars) {
  if (!element?.style || !vars) {
    return;
  }
  for (const [property, value] of Object.entries(vars)) {
    if (!property.startsWith("--")) {
      continue;
    }
    if (value === undefined || value === null || value === "") {
      element.style.removeProperty(property);
    } else {
      element.style.setProperty(property, String(value));
    }
  }
}

function buildVueNodeLayoutVars(profile, surfaceStyle, shapeIntensity = 1, slotStyle = "default") {
  const intensity = clamp(Number(shapeIntensity || 1), 0.6, 1.8);
  const fmtRem = (value) => `${Math.round(value * 100) / 100}rem`;
  const vars = {
    "--tl-vue-node-shell-radius": "var(--tl-node-radius-base)",
    "--tl-vue-node-root-pad-top": "0px",
    "--tl-vue-node-root-pad-x": "0px",
    "--tl-vue-node-root-pad-bottom": "0px",
    "--tl-vue-node-header-inset-left": "0px",
    "--tl-vue-node-header-inset-right": "0px",
    "--tl-vue-node-header-margin-top": "0px",
    "--tl-vue-node-header-pad-left": "0.5rem",
    "--tl-vue-node-header-pad-right": "0.5rem",
    "--tl-vue-node-header-pad-y": "0.45rem",
    "--tl-vue-node-header-extra-height": "0px",
    "--tl-vue-node-header-radius": "var(--tl-node-radius-base) var(--tl-node-radius-base) 0 0",
    "--tl-vue-node-body-inset-left": "0px",
    "--tl-vue-node-body-inset-right": "0px",
    "--tl-vue-node-body-margin-top": "0px",
    "--tl-vue-node-body-pad-left": "0.3rem",
    "--tl-vue-node-body-pad-right": "0.3rem",
    "--tl-vue-node-body-pad-top": "0.25rem",
    "--tl-vue-node-body-pad-bottom": "0.75rem",
    "--tl-vue-node-body-radius": "0 0 var(--tl-node-radius-base) var(--tl-node-radius-base)",
    "--tl-vue-node-footer-inset-left": "0px",
    "--tl-vue-node-footer-inset-right": "0px",
    "--tl-vue-node-footer-margin-top": "0px",
    "--tl-vue-node-footer-pad-left": "0.3rem",
    "--tl-vue-node-footer-pad-right": "0.3rem",
    "--tl-vue-node-footer-pad-y": "0rem",
    "--tl-vue-node-footer-radius": "0 0 var(--tl-node-radius-base) var(--tl-node-radius-base)",
    "--tl-vue-node-widget-gap": "0.35rem",
    "--tl-vue-node-widget-column-gap": "0.4rem",
    "--tl-vue-node-widget-columns": "min-content minmax(80px, min-content) minmax(125px, 1fr)",
    "--tl-vue-node-widget-row-radius": "12px",
    "--tl-vue-node-widget-extra-height": "0px",
    "--tl-vue-node-input-slot-shift": "0px",
    "--tl-vue-node-output-slot-shift": "0px",
    "--tl-vue-node-tab-width": "5.8rem",
    "--tl-vue-node-tab-height": "0.92rem",
    "--tl-vue-node-tab-lift": "0.92rem",
    "--tl-vue-node-shell-accent-opacity": "0",
    "--tl-vue-node-shell-frame-opacity": "0",
  };

  switch (profile) {
    case "box":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "0px",
        "--tl-vue-node-header-radius": "0px",
        "--tl-vue-node-body-radius": "0px",
        "--tl-vue-node-footer-radius": "0px",
        "--tl-vue-node-header-pad-left": "0.45rem",
        "--tl-vue-node-header-pad-right": "0.45rem",
        "--tl-vue-node-body-pad-left": "0.22rem",
        "--tl-vue-node-body-pad-right": "0.22rem",
        "--tl-vue-node-widget-row-radius": "6px",
        "--tl-vue-node-widget-columns": "min-content minmax(68px, min-content) minmax(110px, 1fr)",
      });
      break;
    case "card":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "var(--tl-node-radius-soft-local)",
        "--tl-vue-node-header-radius": "var(--tl-node-radius-soft-local) 0 0 0",
        "--tl-vue-node-body-radius": "0 0 var(--tl-node-radius-soft-local) 0",
        "--tl-vue-node-footer-radius": "0 0 var(--tl-node-radius-soft-local) 0",
        "--tl-vue-node-header-inset-left": "0.16rem",
        "--tl-vue-node-header-inset-right": "0.48rem",
        "--tl-vue-node-body-inset-left": "0.14rem",
        "--tl-vue-node-body-inset-right": "0.5rem",
        "--tl-vue-node-footer-inset-left": "0.14rem",
        "--tl-vue-node-footer-inset-right": "0.5rem",
        "--tl-vue-node-header-pad-left": "0.72rem",
        "--tl-vue-node-header-pad-right": "0.86rem",
        "--tl-vue-node-body-pad-left": "0.34rem",
        "--tl-vue-node-body-pad-right": "0.48rem",
        "--tl-vue-node-footer-pad-left": "0.34rem",
        "--tl-vue-node-footer-pad-right": "0.48rem",
        "--tl-vue-node-widget-row-radius": "14px",
        "--tl-vue-node-widget-columns": "min-content minmax(84px, min-content) minmax(132px, 1fr)",
      });
      break;
    case "squircle":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "var(--tl-node-radius-soft-local)",
        "--tl-vue-node-root-pad-top": "0.08rem",
        "--tl-vue-node-root-pad-x": "0.08rem",
        "--tl-vue-node-root-pad-bottom": "0.12rem",
        "--tl-vue-node-header-inset-left": "0.18rem",
        "--tl-vue-node-header-inset-right": "0.18rem",
        "--tl-vue-node-body-inset-left": "0.18rem",
        "--tl-vue-node-body-inset-right": "0.18rem",
        "--tl-vue-node-footer-inset-left": "0.18rem",
        "--tl-vue-node-footer-inset-right": "0.18rem",
        "--tl-vue-node-header-pad-left": "0.82rem",
        "--tl-vue-node-header-pad-right": "0.82rem",
        "--tl-vue-node-body-pad-left": "0.44rem",
        "--tl-vue-node-body-pad-right": "0.44rem",
        "--tl-vue-node-footer-pad-left": "0.44rem",
        "--tl-vue-node-footer-pad-right": "0.44rem",
        "--tl-vue-node-widget-row-radius": "18px",
        "--tl-vue-node-shell-accent-opacity": String(clamp(0.45 + intensity * 0.22, 0, 1)),
        "--tl-vue-node-widget-columns": "min-content minmax(86px, min-content) minmax(134px, 1fr)",
      });
      break;
    case "capsule":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "var(--tl-node-radius-capsule-local)",
        "--tl-vue-node-root-pad-x": "0.2rem",
        "--tl-vue-node-root-pad-bottom": "0.18rem",
        "--tl-vue-node-header-inset-left": "0.55rem",
        "--tl-vue-node-header-inset-right": "0.55rem",
        "--tl-vue-node-body-inset-left": "0.55rem",
        "--tl-vue-node-body-inset-right": "0.55rem",
        "--tl-vue-node-footer-inset-left": "0.55rem",
        "--tl-vue-node-footer-inset-right": "0.55rem",
        "--tl-vue-node-header-pad-left": "1rem",
        "--tl-vue-node-header-pad-right": "1rem",
        "--tl-vue-node-body-pad-left": "0.56rem",
        "--tl-vue-node-body-pad-right": "0.56rem",
        "--tl-vue-node-footer-pad-left": "0.56rem",
        "--tl-vue-node-footer-pad-right": "0.56rem",
        "--tl-vue-node-body-pad-top": "0.3rem",
        "--tl-vue-node-widget-gap": "0.42rem",
        "--tl-vue-node-widget-column-gap": "0.48rem",
        "--tl-vue-node-widget-row-radius": "999px",
        "--tl-vue-node-input-slot-shift": fmtRem(0.2 + intensity * 0.16),
        "--tl-vue-node-output-slot-shift": fmtRem(0.2 + intensity * 0.16),
        "--tl-vue-node-widget-columns": "min-content minmax(90px, min-content) minmax(136px, 1fr)",
      });
      break;
    case "panel":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "var(--tl-node-radius-soft-local)",
        "--tl-vue-node-root-pad-top": "0.18rem",
        "--tl-vue-node-root-pad-x": "0.1rem",
        "--tl-vue-node-root-pad-bottom": "0.3rem",
        "--tl-vue-node-header-inset-left": "0.62rem",
        "--tl-vue-node-header-inset-right": "0.62rem",
        "--tl-vue-node-header-margin-top": "0.32rem",
        "--tl-vue-node-header-pad-left": "0.86rem",
        "--tl-vue-node-header-pad-right": "0.86rem",
        "--tl-vue-node-header-pad-y": "0.38rem",
        "--tl-vue-node-body-inset-left": "0.58rem",
        "--tl-vue-node-body-inset-right": "0.58rem",
        "--tl-vue-node-body-margin-top": "0.22rem",
        "--tl-vue-node-body-pad-left": "0.5rem",
        "--tl-vue-node-body-pad-right": "0.5rem",
        "--tl-vue-node-body-pad-top": "0.32rem",
        "--tl-vue-node-body-pad-bottom": "0.82rem",
        "--tl-vue-node-footer-inset-left": "0.58rem",
        "--tl-vue-node-footer-inset-right": "0.58rem",
        "--tl-vue-node-footer-margin-top": "0.22rem",
        "--tl-vue-node-footer-pad-left": "0.5rem",
        "--tl-vue-node-footer-pad-right": "0.5rem",
        "--tl-vue-node-widget-gap": "0.46rem",
        "--tl-vue-node-widget-column-gap": "0.5rem",
        "--tl-vue-node-widget-row-radius": "16px",
        "--tl-vue-node-shell-frame-opacity": String(clamp(0.72 + intensity * 0.18, 0, 1)),
        "--tl-vue-node-widget-columns": "min-content minmax(88px, min-content) minmax(138px, 1fr)",
      });
      break;
    case "notch":
      Object.assign(vars, {
        "--tl-vue-node-shell-radius": "var(--tl-node-radius-soft-local)",
        "--tl-vue-node-root-pad-top": "1rem",
        "--tl-vue-node-root-pad-x": "0.08rem",
        "--tl-vue-node-root-pad-bottom": "0.12rem",
        "--tl-vue-node-header-inset-left": "0.34rem",
        "--tl-vue-node-header-inset-right": "0.34rem",
        "--tl-vue-node-header-margin-top": "0.46rem",
        "--tl-vue-node-header-pad-left": "0.8rem",
        "--tl-vue-node-header-pad-right": "0.8rem",
        "--tl-vue-node-body-inset-left": "0.26rem",
        "--tl-vue-node-body-inset-right": "0.26rem",
        "--tl-vue-node-body-margin-top": "0.18rem",
        "--tl-vue-node-body-pad-left": "0.4rem",
        "--tl-vue-node-body-pad-right": "0.4rem",
        "--tl-vue-node-footer-inset-left": "0.26rem",
        "--tl-vue-node-footer-inset-right": "0.26rem",
        "--tl-vue-node-footer-pad-left": "0.4rem",
        "--tl-vue-node-footer-pad-right": "0.4rem",
        "--tl-vue-node-tab-width": fmtRem(5.6 + intensity * 0.75),
        "--tl-vue-node-tab-height": fmtRem(0.86 + intensity * 0.12),
        "--tl-vue-node-tab-lift": fmtRem(0.74 + intensity * 0.16),
        "--tl-vue-node-widget-columns": "min-content minmax(86px, min-content) minmax(132px, 1fr)",
      });
      break;
    default:
      break;
  }

  switch (surfaceStyle) {
    case "soft-card":
      Object.assign(vars, {
        "--tl-vue-node-root-pad-x": fmtRem(0.08 + intensity * 0.04),
        "--tl-vue-node-root-pad-bottom": fmtRem(0.1 + intensity * 0.08),
        "--tl-vue-node-header-inset-left": "max(var(--tl-vue-node-header-inset-left), 0.18rem)",
        "--tl-vue-node-header-inset-right": "max(var(--tl-vue-node-header-inset-right), 0.18rem)",
        "--tl-vue-node-body-inset-left": "max(var(--tl-vue-node-body-inset-left), 0.18rem)",
        "--tl-vue-node-body-inset-right": "max(var(--tl-vue-node-body-inset-right), 0.18rem)",
        "--tl-vue-node-footer-inset-left": "max(var(--tl-vue-node-footer-inset-left), 0.18rem)",
        "--tl-vue-node-footer-inset-right": "max(var(--tl-vue-node-footer-inset-right), 0.18rem)",
        "--tl-vue-node-header-pad-left": "max(var(--tl-vue-node-header-pad-left), 0.82rem)",
        "--tl-vue-node-header-pad-right": "max(var(--tl-vue-node-header-pad-right), 0.82rem)",
        "--tl-vue-node-body-pad-left": "max(var(--tl-vue-node-body-pad-left), 0.44rem)",
        "--tl-vue-node-body-pad-right": "max(var(--tl-vue-node-body-pad-right), 0.44rem)",
        "--tl-vue-node-footer-pad-left": "max(var(--tl-vue-node-footer-pad-left), 0.44rem)",
        "--tl-vue-node-footer-pad-right": "max(var(--tl-vue-node-footer-pad-right), 0.44rem)",
        "--tl-vue-node-widget-gap": fmtRem(0.34 + intensity * 0.09),
        "--tl-vue-node-widget-column-gap": fmtRem(0.34 + intensity * 0.1),
        "--tl-vue-node-widget-row-radius": `${Math.round((14 + intensity * 4.25) * 100) / 100}px`,
        "--tl-vue-node-widget-extra-height": `${Math.round((4 + intensity * 4.5) * 100) / 100}px`,
        "--tl-vue-node-input-slot-shift": "var(--tl-node-soft-slot-offset, 16px)",
        "--tl-vue-node-output-slot-shift": "var(--tl-node-soft-slot-offset, 16px)",
        "--tl-vue-node-widget-columns": "min-content minmax(88px, min-content) minmax(140px, 1fr)",
      });
      break;
    case "media-card":
      Object.assign(vars, {
        "--tl-vue-node-root-pad-top": fmtRem(0.04 + intensity * 0.04),
        "--tl-vue-node-root-pad-x": fmtRem(0.1 + intensity * 0.06),
        "--tl-vue-node-root-pad-bottom": fmtRem(0.12 + intensity * 0.1),
        "--tl-vue-node-header-inset-left": "max(var(--tl-vue-node-header-inset-left), 0.24rem)",
        "--tl-vue-node-header-inset-right": "max(var(--tl-vue-node-header-inset-right), 0.28rem)",
        "--tl-vue-node-body-inset-left": "max(var(--tl-vue-node-body-inset-left), 0.24rem)",
        "--tl-vue-node-body-inset-right": "max(var(--tl-vue-node-body-inset-right), 0.28rem)",
        "--tl-vue-node-footer-inset-left": "max(var(--tl-vue-node-footer-inset-left), 0.24rem)",
        "--tl-vue-node-footer-inset-right": "max(var(--tl-vue-node-footer-inset-right), 0.28rem)",
        "--tl-vue-node-header-pad-left": "max(var(--tl-vue-node-header-pad-left), 0.92rem)",
        "--tl-vue-node-header-pad-right": "max(var(--tl-vue-node-header-pad-right), 0.92rem)",
        "--tl-vue-node-body-pad-top": "max(var(--tl-vue-node-body-pad-top), 0.36rem)",
        "--tl-vue-node-body-pad-bottom": fmtRem(0.62 + intensity * 0.28),
        "--tl-vue-node-widget-gap": fmtRem(0.38 + intensity * 0.14),
        "--tl-vue-node-widget-column-gap": fmtRem(0.36 + intensity * 0.12),
        "--tl-vue-node-widget-row-radius": `${Math.round((14 + intensity * 4.5) * 100) / 100}px`,
        "--tl-vue-node-widget-extra-height": `${Math.round((6 + intensity * 4.75) * 100) / 100}px`,
        "--tl-vue-node-widget-columns": "min-content minmax(96px, min-content) minmax(148px, 1fr)",
      });
      break;
    case "minimal-wire":
    case "neon-edge":
      Object.assign(vars, {
        "--tl-vue-node-root-pad-top": "0px",
        "--tl-vue-node-root-pad-x": "0px",
        "--tl-vue-node-root-pad-bottom": "0px",
        "--tl-vue-node-header-inset-left": "0px",
        "--tl-vue-node-header-inset-right": "0px",
        "--tl-vue-node-body-inset-left": "0px",
        "--tl-vue-node-body-inset-right": "0px",
        "--tl-vue-node-footer-inset-left": "0px",
        "--tl-vue-node-footer-inset-right": "0px",
        "--tl-vue-node-header-pad-left": "0.45rem",
        "--tl-vue-node-header-pad-right": "0.45rem",
        "--tl-vue-node-header-pad-y": "0.28rem",
        "--tl-vue-node-body-pad-left": "0.24rem",
        "--tl-vue-node-body-pad-right": "0.24rem",
        "--tl-vue-node-footer-pad-left": "0.24rem",
        "--tl-vue-node-footer-pad-right": "0.24rem",
        "--tl-vue-node-body-pad-top": "0.2rem",
        "--tl-vue-node-body-pad-bottom": "0.45rem",
        "--tl-vue-node-widget-gap": fmtRem(0.2 + intensity * 0.08),
        "--tl-vue-node-widget-column-gap": fmtRem(0.18 + intensity * 0.08),
        "--tl-vue-node-widget-row-radius": `${Math.round(((surfaceStyle === "neon-edge" ? 5.5 : 4.5) + intensity * 2.2) * 100) / 100}px`,
        "--tl-vue-node-widget-columns": surfaceStyle === "neon-edge"
          ? "min-content minmax(72px, min-content) minmax(116px, 1fr)"
          : "min-content minmax(66px, min-content) minmax(108px, 1fr)",
      });
      break;
    case "glass-panel":
    case "liquid-glass":
      Object.assign(vars, {
        "--tl-vue-node-root-pad-top": fmtRem(0.04 + intensity * 0.04),
        "--tl-vue-node-root-pad-x": fmtRem(0.04 + intensity * 0.06),
        "--tl-vue-node-root-pad-bottom": fmtRem(0.06 + intensity * 0.08),
        "--tl-vue-node-header-inset-left": "max(var(--tl-vue-node-header-inset-left), 0.14rem)",
        "--tl-vue-node-header-inset-right": "max(var(--tl-vue-node-header-inset-right), 0.14rem)",
        "--tl-vue-node-body-inset-left": "max(var(--tl-vue-node-body-inset-left), 0.14rem)",
        "--tl-vue-node-body-inset-right": "max(var(--tl-vue-node-body-inset-right), 0.14rem)",
        "--tl-vue-node-footer-inset-left": "max(var(--tl-vue-node-footer-inset-left), 0.14rem)",
        "--tl-vue-node-footer-inset-right": "max(var(--tl-vue-node-footer-inset-right), 0.14rem)",
        "--tl-vue-node-widget-gap": fmtRem(0.28 + intensity * 0.12),
        "--tl-vue-node-widget-column-gap": fmtRem(0.3 + intensity * 0.12),
        "--tl-vue-node-widget-row-radius": `${Math.round(((surfaceStyle === "liquid-glass" ? 12 : 10) + intensity * 5) * 100) / 100}px`,
        "--tl-vue-node-widget-extra-height": `${Math.round((4 + intensity * 4.25) * 100) / 100}px`,
        "--tl-vue-node-widget-columns": "min-content minmax(84px, min-content) minmax(132px, 1fr)",
      });
      break;
    case "studio-frame":
      Object.assign(vars, {
        "--tl-vue-node-root-pad-top": fmtRem(0.08 + intensity * 0.12),
        "--tl-vue-node-root-pad-x": fmtRem(0.04 + intensity * 0.08),
        "--tl-vue-node-root-pad-bottom": fmtRem(0.08 + intensity * 0.08),
        "--tl-vue-node-header-inset-left": `max(var(--tl-vue-node-header-inset-left), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-header-inset-right": `max(var(--tl-vue-node-header-inset-right), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-body-inset-left": `max(var(--tl-vue-node-body-inset-left), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-body-inset-right": `max(var(--tl-vue-node-body-inset-right), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-footer-inset-left": `max(var(--tl-vue-node-footer-inset-left), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-footer-inset-right": `max(var(--tl-vue-node-footer-inset-right), ${fmtRem(0.2 + intensity * 0.2)})`,
        "--tl-vue-node-header-margin-top": `max(var(--tl-vue-node-header-margin-top), ${fmtRem(0.12 + intensity * 0.16)})`,
        "--tl-vue-node-body-margin-top": `max(var(--tl-vue-node-body-margin-top), ${fmtRem(0.06 + intensity * 0.12)})`,
        "--tl-vue-node-widget-gap": fmtRem(0.22 + intensity * 0.12),
        "--tl-vue-node-widget-column-gap": fmtRem(0.24 + intensity * 0.12),
        "--tl-vue-node-shell-frame-opacity": String(clamp(0.58 + intensity * 0.26, 0, 1)),
        "--tl-vue-node-widget-columns": "min-content minmax(82px, min-content) minmax(128px, 1fr)",
      });
      break;
    default:
      break;
  }

  if (slotStyle === "floating") {
    Object.assign(vars, {
      "--tl-vue-node-input-slot-shift": "var(--tl-node-soft-slot-offset, 16px)",
      "--tl-vue-node-output-slot-shift": "var(--tl-node-soft-slot-offset, 16px)",
    });
  } else if (slotStyle === "pill") {
    Object.assign(vars, {
      "--tl-vue-node-input-slot-shift": fmtRem(0.22 + intensity * 0.08),
      "--tl-vue-node-output-slot-shift": fmtRem(0.22 + intensity * 0.08),
    });
  } else if (slotStyle === "minimal") {
    Object.assign(vars, {
      "--tl-vue-node-input-slot-shift": "0px",
      "--tl-vue-node-output-slot-shift": "0px",
    });
  }

  return vars;
}

function getVueNodeElements(nodeEl) {
  const headerEl = nodeEl.querySelector(".lg-node-header");
  const bodyEl = nodeEl.querySelector('[data-testid^="node-body-"]');
  const footerEl = bodyEl?.nextElementSibling instanceof HTMLElement ? bodyEl.nextElementSibling : null;
  const widgetsEl = nodeEl.querySelector(".lg-node-widgets");
  const widgetRows = Array.from(nodeEl.querySelectorAll(".lg-node-widget"));
  const inputSlots = Array.from(nodeEl.querySelectorAll(".lg-slot--input"));
  const outputSlots = Array.from(nodeEl.querySelectorAll(".lg-slot--output"));
  const slotDots = Array.from(nodeEl.querySelectorAll(".slot-dot"));

  return {
    headerEl,
    bodyEl,
    footerEl,
    widgetsEl,
    widgetRows,
    inputSlots,
    outputSlots,
    slotDots,
    shellEls: [headerEl, bodyEl, footerEl].filter(Boolean),
  };
}

function clearVueNodeElementsInlineStyles(parts) {
  clearVueNodeInlineProperties(parts.headerEl);
  clearVueNodeInlineProperties(parts.bodyEl);
  clearVueNodeInlineProperties(parts.footerEl);
  clearVueNodeInlineProperties(parts.widgetsEl);
  for (const rowEl of parts.widgetRows) {
    clearVueNodeInlineProperties(rowEl);
  }
  for (const slotEl of parts.inputSlots) {
    clearVueNodeInlineProperties(slotEl);
  }
  for (const slotEl of parts.outputSlots) {
    clearVueNodeInlineProperties(slotEl);
  }
  for (const dotEl of parts.slotDots) {
    clearVueNodeInlineProperties(dotEl);
  }
}

function buildVueNodeStateShadow(nodeEl, surfaceStyle) {
  const strongOutline = "var(--tl-node-outline-width-strong, 4px)";
  if (nodeEl.classList.contains("outline-node-stroke-error")) {
    return `0 0 0 ${strongOutline} rgba(238, 68, 68, 0.34)`;
  }
  if (nodeEl.classList.contains("outline-node-stroke-executing")) {
    return `0 0 0 ${strongOutline} rgba(78, 163, 255, 0.26)`;
  }
  if (!nodeEl.classList.contains("outline-node-component-outline")) {
    return "";
  }
  if (surfaceStyle === "glass-panel" || surfaceStyle === "liquid-glass") {
    return `0 0 0 ${strongOutline} rgba(226, 241, 255, 0.26)`;
  }
  if (surfaceStyle === "soft-card") {
    return `0 0 0 ${strongOutline} rgba(215, 231, 255, 0.14)`;
  }
  if (surfaceStyle === "media-card") {
    return `0 0 0 ${strongOutline} rgba(219, 239, 188, 0.18)`;
  }
  if (surfaceStyle === "minimal-wire" || surfaceStyle === "neon-edge") {
    return `0 0 0 ${strongOutline} rgba(232, 239, 248, 0.12)`;
  }
  if (surfaceStyle === "studio-frame") {
    return `0 0 0 ${strongOutline} rgba(198, 221, 239, 0.16)`;
  }
  return `0 0 0 ${strongOutline} rgba(255, 255, 255, 0.12)`;
}

function combineBoxShadows(...shadows) {
  return shadows
    .flat()
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function applyVueNodeSlotInlineStyles(parts, slotStyle, shapeIntensity = 1) {
  const intensity = clamp(Number(shapeIntensity || 1), 0.6, 1.8);
  const {
    inputSlots,
    outputSlots,
    slotDots,
  } = parts;

  if (slotStyle === "floating") {
    const slotPad = `${Math.round((0.34 + intensity * 0.08) * 100) / 100}rem`;
    const dotSize = `${Math.round((0.78 + intensity * 0.16) * 100) / 100}rem`;
    const haloSize = `${Math.round((0.22 + intensity * 0.12) * 100) / 100}rem`;
    for (const slotEl of inputSlots) {
      setVueNodeInlineProperties(slotEl, {
        "margin-left": "calc(var(--tl-vue-node-input-slot-shift) * -1)",
        "padding-right": slotPad,
      });
    }
    for (const slotEl of outputSlots) {
      setVueNodeInlineProperties(slotEl, {
        "margin-right": "calc(var(--tl-vue-node-output-slot-shift) * -1)",
        "padding-left": slotPad,
      });
    }
    for (const dotEl of slotDots) {
      setVueNodeInlineProperties(dotEl, {
        width: dotSize,
        height: dotSize,
        "border-radius": "999px",
        "border-width": "1px",
        "border-color": "rgba(241, 247, 255, 0.34)",
        "box-shadow": `0 0 0 ${haloSize} rgba(168, 195, 225, 0.12), 0 0.1rem 0.8rem rgba(0, 0, 0, 0.18)`,
      });
    }
    return;
  }

  if (slotStyle === "ring") {
    const dotSize = `${Math.round((0.72 + intensity * 0.1) * 100) / 100}rem`;
    const ringWidth = `${Math.round((1.2 + intensity * 0.25) * 100) / 100}px`;
    for (const dotEl of slotDots) {
      setVueNodeInlineProperties(dotEl, {
        width: dotSize,
        height: dotSize,
        "border-radius": "999px",
        background: "rgba(255, 255, 255, 0.03)",
        "border-width": ringWidth,
        "border-color": "rgba(214, 233, 248, 0.34)",
        "box-shadow": "0 0 0 0.18rem rgba(178, 204, 226, 0.08)",
      });
    }
    return;
  }

  if (slotStyle === "minimal") {
    const dotSize = `${Math.round((0.52 + intensity * 0.06) * 100) / 100}rem`;
    for (const dotEl of slotDots) {
      setVueNodeInlineProperties(dotEl, {
        width: dotSize,
        height: dotSize,
        "border-radius": "999px",
        background: "rgba(255, 255, 255, 0.08)",
        "border-width": "1px",
        "border-color": "rgba(255, 255, 255, 0.08)",
        "box-shadow": "none",
      });
    }
    return;
  }

  if (slotStyle === "pill") {
    const slotPadX = `${Math.round((0.2 + intensity * 0.08) * 100) / 100}rem`;
    const slotPadY = `${Math.round((0.08 + intensity * 0.03) * 100) / 100}rem`;
    const dotSize = `${Math.round((0.62 + intensity * 0.08) * 100) / 100}rem`;
    const rowRadius = `${Math.round((14 + intensity * 6) * 100) / 100}px`;
    for (const slotEl of [...inputSlots, ...outputSlots]) {
      setVueNodeInlineProperties(slotEl, {
        background: "rgba(255, 255, 255, 0.03)",
        "border-radius": rowRadius,
        "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.035) inset",
        "padding-left": slotPadX,
        "padding-right": slotPadX,
        "padding-top": slotPadY,
        "padding-bottom": slotPadY,
      });
    }
    for (const slotEl of inputSlots) {
      setVueNodeInlineProperties(slotEl, {
        "margin-left": "calc(var(--tl-vue-node-input-slot-shift) * -1)",
      });
    }
    for (const slotEl of outputSlots) {
      setVueNodeInlineProperties(slotEl, {
        "margin-right": "calc(var(--tl-vue-node-output-slot-shift) * -1)",
      });
    }
    for (const dotEl of slotDots) {
      setVueNodeInlineProperties(dotEl, {
        width: dotSize,
        height: dotSize,
        "border-radius": "999px",
        background: "rgba(255, 255, 255, 0.1)",
        "border-width": "1px",
        "border-color": "rgba(235, 244, 252, 0.24)",
        "box-shadow": "0 0 0 0.14rem rgba(255, 255, 255, 0.04)",
      });
    }
  }
}

function applyVueNodeInlineStyles(config) {
  if (typeof document === "undefined") {
    return;
  }

  const profile = String(config?.node_shape_profile || "default").trim().toLowerCase() || "default";
  const surfaceStyle = String(config?.node_surface_style || "default").trim().toLowerCase() || "default";
  const shapeIntensity = getShapeIntensity(config);
  const slotStyle = resolveNodeSlotStyle(config);

  for (const nodeEl of document.querySelectorAll(".lg-node")) {
    const parts = getVueNodeElements(nodeEl);
    const {
      headerEl,
      bodyEl,
      footerEl,
      widgetsEl,
      widgetRows,
      inputSlots,
      outputSlots,
      slotDots,
      shellEls,
    } = parts;

    clearVueNodeInlineProperties(nodeEl);
    clearVueNodeElementsInlineStyles(parts);

    setVueNodeInlineProperties(nodeEl, {
      overflow: "visible",
      isolation: "isolate",
    });
    setVueNodeCssVars(nodeEl, buildVueNodeLayoutVars(profile, surfaceStyle, shapeIntensity, slotStyle));
    applyVueNodeSlotInlineStyles(parts, slotStyle, shapeIntensity);

    const stateShadow = buildVueNodeStateShadow(nodeEl, surfaceStyle);

    if (surfaceStyle === "soft-card") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": "rgba(26, 29, 36, 0.96)",
        "border-color": "rgba(255, 255, 255, 0.055)",
        "box-shadow": combineBoxShadows(
          "0 30px 58px rgba(0, 0, 0, 0.36)",
          "0 14px 24px rgba(0, 0, 0, 0.14)",
          "0 0 0 1px rgba(255, 255, 255, 0.04) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 24%), rgba(18, 21, 28, 0.92)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.45rem",
        "padding-right": "0.35rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": "18px",
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015) 42%), rgba(10, 14, 20, 0.62)",
        "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.03) inset",
        "padding-left": "0.15rem",
        "padding-right": "0.45rem",
        "min-height": "calc(var(--tl-node-widget-height, 24px) + 8px)",
      });
    } else if (surfaceStyle === "media-card") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": "rgba(12, 15, 20, 0.98)",
        "border-color": "rgba(255, 255, 255, 0.075)",
        "box-shadow": combineBoxShadows(
          "0 30px 62px rgba(0, 0, 0, 0.42)",
          "0 0 0 1px rgba(255, 255, 255, 0.05) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 28%), linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.18) 100%), rgba(14, 16, 22, 0.92)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.55rem",
        "padding-right": "0.4rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": "18px",
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01) 38%), rgba(7, 10, 14, 0.78)",
        "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.04) inset, 0 10px 18px rgba(0, 0, 0, 0.16)",
        "padding-left": "0.2rem",
        "padding-right": "0.55rem",
        "min-height": "calc(var(--tl-node-widget-height, 24px) + 10px)",
      });
      for (const dotEl of slotDots) {
        setVueNodeInlineProperties(dotEl, {
          width: "0.88rem",
          height: "0.88rem",
          "border-color": "rgba(212, 236, 190, 0.3)",
          "box-shadow": "0 0 0 0.28rem rgba(111, 141, 89, 0.12)",
        });
      }
    } else if (surfaceStyle === "minimal-wire") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": "rgba(23, 26, 33, 0.96)",
        "border-color": "rgba(255, 255, 255, 0.08)",
        "box-shadow": combineBoxShadows(
          "0 12px 18px rgba(0, 0, 0, 0.18)",
          "0 0 0 1px rgba(255, 255, 255, 0.03) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: "rgba(17, 18, 21, 0.96)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.25rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": "10px",
        background: "rgba(255, 255, 255, 0.012)",
        "box-shadow": "0 -1px 0 rgba(255, 255, 255, 0.04) inset",
        "padding-left": "0.1rem",
        "padding-right": "0.25rem",
        "min-height": "calc(var(--tl-node-widget-height, 20px) + 4px)",
      });
      for (const dotEl of slotDots) {
        setVueNodeInlineProperties(dotEl, {
          width: "0.72rem",
          height: "0.72rem",
          "box-shadow": "none",
        });
      }
    } else if (surfaceStyle === "studio-frame") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": "rgba(16, 20, 26, 0.96)",
        "border-color": "rgba(255, 255, 255, 0.06)",
        "box-shadow": combineBoxShadows(
          "0 20px 36px rgba(0, 0, 0, 0.3)",
          "0 0 0 1px rgba(255, 255, 255, 0.06) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0) 24%), rgba(15, 19, 24, 0.95)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.38rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": "12px",
        background: "rgba(255, 255, 255, 0.022)",
        "box-shadow": "0 0 0 1px rgba(143, 163, 183, 0.18) inset",
        "padding-left": "0.12rem",
        "padding-right": "0.4rem",
        "min-height": "calc(var(--tl-node-widget-height, 22px) + 7px)",
      });
    } else if (surfaceStyle === "neon-edge") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": "rgba(19, 22, 27, 0.98)",
        "border-color": "rgba(255, 255, 255, 0.08)",
        "box-shadow": combineBoxShadows(
          "0 12px 20px rgba(0, 0, 0, 0.16)",
          "0 0 0 1px rgba(255, 255, 255, 0.035) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: "rgba(18, 20, 24, 0.97)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.3rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": "6px",
        background: "rgba(255, 255, 255, 0.015)",
        "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.035) inset",
        "padding-left": "0.08rem",
        "padding-right": "0.28rem",
        "min-height": "calc(var(--tl-node-widget-height, 20px) + 4px)",
      });
    } else if (surfaceStyle === "glass-panel" || surfaceStyle === "liquid-glass") {
      setVueNodeInlineProperties(nodeEl, {
        "background-color": surfaceStyle === "liquid-glass" ? "rgba(208, 229, 255, 0.06)" : "rgba(22, 28, 36, 0.1)",
        "border-color": "rgba(236, 245, 255, 0.07)",
        "backdrop-filter": "blur(18px) saturate(138%)",
        "-webkit-backdrop-filter": "blur(18px) saturate(138%)",
        "box-shadow": combineBoxShadows(
          "0 18px 42px rgba(0, 0, 0, 0.16)",
          "0 0 0 1px rgba(255, 255, 255, 0.035) inset",
          stateShadow,
        ),
      });
      setVueNodeInlinePropertiesMany(shellEls, {
        background: surfaceStyle === "liquid-glass"
          ? "linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.015) 34%), rgba(208, 229, 255, 0.06)"
          : "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 26%), rgba(12, 18, 26, 0.08)",
        "backdrop-filter": "blur(22px) saturate(148%)",
        "-webkit-backdrop-filter": "blur(22px) saturate(148%)",
      });
      setVueNodeInlineProperties(widgetsEl, {
        "row-gap": "0.42rem",
      });
      setVueNodeInlinePropertiesMany(widgetRows, {
        "border-radius": surfaceStyle === "liquid-glass" ? "18px" : "16px",
        background: surfaceStyle === "liquid-glass"
          ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.015) 34%), rgba(201, 230, 255, 0.07)"
          : "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01) 28%), rgba(14, 19, 27, 0.12)",
        "backdrop-filter": "blur(22px) saturate(148%)",
        "-webkit-backdrop-filter": "blur(22px) saturate(148%)",
        "box-shadow": surfaceStyle === "liquid-glass"
          ? "0 0 0 1px rgba(245, 251, 255, 0.08) inset"
          : "0 0 0 1px rgba(208, 230, 247, 0.05) inset",
        "padding-left": "0.12rem",
        "padding-right": "0.35rem",
        "min-height": "calc(var(--tl-node-widget-height, 24px) + 8px)",
      });
      for (const dotEl of slotDots) {
        setVueNodeInlineProperties(dotEl, {
          "border-color": surfaceStyle === "liquid-glass" ? "rgba(242, 251, 255, 0.42)" : "rgba(217, 238, 255, 0.28)",
          "box-shadow": surfaceStyle === "liquid-glass"
            ? "0 0 0 0.28rem rgba(229, 246, 255, 0.12)"
            : "0 0 0 0.22rem rgba(160, 198, 227, 0.08)",
        });
      }
    }
  }
}

function applyVueNodeElementClasses(config = runtime.vueNodePendingConfig || runtime.active) {
  if (typeof document === "undefined") {
    return;
  }

  const { shapeClass, surfaceClass, slotStyleClass } = buildVueNodeClasses(config);
  for (const nodeEl of document.querySelectorAll(".lg-node")) {
    const currentShapeClass = Array.from(nodeEl.classList).find((className) => className.startsWith("tl-vue-node-shape-"));
    const currentSurfaceClass = Array.from(nodeEl.classList).find((className) => className.startsWith("tl-vue-node-surface-"));
    const currentSlotStyleClass = Array.from(nodeEl.classList).find((className) => className.startsWith("tl-vue-node-slot-"));
    if (currentShapeClass !== shapeClass) {
      if (currentShapeClass) {
        nodeEl.classList.remove(currentShapeClass);
      }
      nodeEl.classList.add(shapeClass);
    }
    if (currentSurfaceClass !== surfaceClass) {
      if (currentSurfaceClass) {
        nodeEl.classList.remove(currentSurfaceClass);
      }
      nodeEl.classList.add(surfaceClass);
    }
    if (currentSlotStyleClass !== slotStyleClass) {
      if (currentSlotStyleClass) {
        nodeEl.classList.remove(currentSlotStyleClass);
      }
      nodeEl.classList.add(slotStyleClass);
    }
  }
  applyVueNodeInlineStyles(config);
}

function scheduleVueNodeClassSync(config = runtime.active) {
  runtime.vueNodePendingConfig = config || runtime.active;
  if (runtime.vueNodeApplyScheduled) {
    return;
  }

  runtime.vueNodeApplyScheduled = true;
  queueMicrotask(() => {
    runtime.vueNodeApplyScheduled = false;
    applyVueNodeElementClasses(runtime.vueNodePendingConfig || runtime.active);
  });
  if (typeof window !== "undefined") {
    window.requestAnimationFrame?.(() => applyVueNodeElementClasses(runtime.vueNodePendingConfig || runtime.active));
    window.setTimeout?.(() => applyVueNodeElementClasses(runtime.vueNodePendingConfig || runtime.active), 60);
    window.setTimeout?.(() => applyVueNodeElementClasses(runtime.vueNodePendingConfig || runtime.active), 220);
  }
}

function ensureVueNodeObserver() {
  if (runtime.vueNodeObserver || typeof MutationObserver === "undefined" || typeof document === "undefined") {
    return;
  }

  const root = document.body || document.documentElement;
  if (!root) {
    return;
  }

  runtime.vueNodeObserver = new MutationObserver(() => {
    scheduleVueNodeClassSync();
  });
  runtime.vueNodeObserver.observe(root, {
    childList: true,
    subtree: true,
  });
}

function applyVueNodeThemeBridge(config) {
  const root = readDocumentRoot();
  if (!root) {
    return;
  }

  const { shapeProfile, surfaceStyle, slotStyle } = buildVueNodeClasses(config);
  const shapeIntensity = getShapeIntensity(config);
  root.dataset[ROOT_DATASET_KEYS.shapeProfile] = shapeProfile;
  root.dataset[ROOT_DATASET_KEYS.surfaceStyle] = surfaceStyle;
  root.dataset[ROOT_DATASET_KEYS.slotStyle] = slotStyle;
  root.classList.toggle(
    "tl-vue-node-theme-active",
    shapeProfile !== "default"
      || surfaceStyle !== "default"
      || slotStyle !== "default"
      || Math.abs(shapeIntensity - 1) > 0.001,
  );

  const cornerRadius = Math.max(0, Number(config?.node_corner_radius || 0));
  const outlineWidth = Math.max(0, Number(config?.node_outline_width || 0));
  const shadowBlur = Math.max(0, Number(config?.node_shadow_blur || 0));
  const shadowOffsetY = Number(config?.node_shadow_offset_y || 0);
  const shadowOpacity = clamp(Number(config?.node_shadow_opacity || 0), 0, 1);
  const headerBandHeight = Math.max(0, Number(config?.node_header_band_height || 0));
  const headerBandOpacity = clamp(Number(config?.node_header_band_opacity || 0), 0, 1);
  const slotHeight = Math.max(12, Number(config?.node_slot_height || THEME_LAB_CANVAS_DEFAULTS.node_slot_height));
  const titleHeight = Math.max(18, Number(config?.node_title_height || THEME_LAB_CANVAS_DEFAULTS.node_title_height));
  const widgetHeight = Math.max(16, Number(config?.node_widget_height || THEME_LAB_CANVAS_DEFAULTS.node_widget_height));

  setRootStylePx(root, "--tl-node-radius", cornerRadius || 8);
  setRootStylePx(root, "--tl-node-radius-soft", Math.max(18, cornerRadius * 2.15 || 18));
  setRootStylePx(root, "--tl-node-radius-capsule", Math.max(26, cornerRadius * 2.8 || 26));
  setRootStylePx(root, "--tl-node-radius-panel-bottom", Math.max(6, cornerRadius * 0.65 || 6));
  setRootStylePx(root, "--tl-node-title-height", titleHeight);
  setRootStylePx(root, "--tl-node-widget-height", widgetHeight);
  setRootStylePx(root, "--tl-node-slot-height", slotHeight);
  setRootStylePx(root, "--tl-node-soft-slot-offset", Math.max(14, slotHeight * 0.6));
  setRootStylePx(root, "--tl-node-outline-width", outlineWidth);
  setRootStylePx(root, "--tl-node-outline-width-strong", Math.max(3, outlineWidth * 2.4 + 2.5));
  setRootStylePx(root, "--tl-node-shadow-blur", shadowBlur);
  setRootStylePx(root, "--tl-node-shadow-offset-y", shadowOffsetY);
  setRootStyleValue(root, "--tl-node-shadow-opacity", shadowOpacity);
  setRootStylePx(root, "--tl-node-header-band-height", headerBandHeight);
  setRootStyleValue(root, "--tl-node-header-band-opacity", headerBandOpacity);
  setRootStyleValue(root, "--tl-node-shape-intensity", shapeIntensity);
  ensureVueNodeObserver();
  scheduleVueNodeClassSync(config);
}

function getNodeOutlineArea(node, size) {
  const areaSource = Array.isArray(node?.boundingRect) || ArrayBuffer.isView(node?.boundingRect)
    ? node.boundingRect
    : [node?.pos?.[0] || 0, node?.pos?.[1] || 0, size?.[0] || 0, size?.[1] || 0];
  const pos = node?.pos || [0, 0];
  return [
    areaSource[0] - pos[0],
    areaSource[1] - pos[1],
    areaSource[2],
    areaSource[3],
  ];
}

function colorToRgba(input, alpha = 1) {
  const value = String(input || "").trim();
  const nextAlpha = clamp(Number(alpha), 0, 1);
  if (!value) {
    return `rgba(0, 0, 0, ${nextAlpha})`;
  }

  const hexMatch = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split("").map((char) => char + char).join("");
    }
    const hasAlpha = hex.length === 8;
    const rgb = hasAlpha ? hex.slice(0, 6) : hex;
    const r = parseInt(rgb.slice(0, 2), 16);
    const g = parseInt(rgb.slice(2, 4), 16);
    const b = parseInt(rgb.slice(4, 6), 16);
    const sourceAlpha = hasAlpha ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${clamp(sourceAlpha * nextAlpha, 0, 1)})`;
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((part) => part.trim());
    if (parts.length >= 3) {
      const [r, g, b] = parts;
      const sourceAlpha = parts[3] !== undefined ? Number(parts[3]) : 1;
      return `rgba(${r}, ${g}, ${b}, ${clamp(sourceAlpha * nextAlpha, 0, 1)})`;
    }
  }

  return value;
}

function buildSquirclePath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
  const k = 0.5522847498307936;
  const c = r * 0.76 * k;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.bezierCurveTo(x + width - r + c, y, x + width, y + r - c, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.bezierCurveTo(x + width, y + height - r + c, x + width - r + c, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.bezierCurveTo(x + r - c, y + height, x, y + height - r + c, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.bezierCurveTo(x, y + r - c, x + r - c, y, x + r, y);
  ctx.closePath();
}

function buildPanelPath(ctx, x, y, width, height, radius) {
  const topInset = Math.max(14, Math.min(width * 0.1, 26));
  const bottomInset = Math.max(12, Math.min(width * 0.08, 18));
  const shoulder = Math.max(10, Math.min(radius * 0.9, height * 0.18));
  const footerLift = Math.max(7, Math.min(height * 0.065, 12));
  ctx.moveTo(x + topInset, y);
  ctx.lineTo(x + width - topInset, y);
  ctx.lineTo(x + width, y + shoulder);
  ctx.lineTo(x + width, y + height - footerLift - bottomInset * 0.12);
  ctx.lineTo(x + width - bottomInset, y + height);
  ctx.lineTo(x + bottomInset, y + height);
  ctx.lineTo(x, y + height - footerLift - bottomInset * 0.12);
  ctx.lineTo(x, y + shoulder);
  ctx.closePath();
}

function buildNotchedCardPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width * 0.25, height * 0.25));
  const notchWidth = Math.max(54, Math.min(width * 0.3, 112));
  const notchDepth = Math.max(8, Math.min(height * 0.09, 15));
  const shoulder = Math.max(10, Math.min(width * 0.04, 18));
  const notchLeft = x + width * 0.5 - notchWidth * 0.5;
  const notchRight = notchLeft + notchWidth;
  ctx.moveTo(x + r, y);
  ctx.lineTo(notchLeft - shoulder, y);
  ctx.quadraticCurveTo(notchLeft - 2, y, notchLeft + 2, y + notchDepth);
  ctx.lineTo(notchRight, y + notchDepth);
  ctx.quadraticCurveTo(notchRight + 2, y, notchRight + shoulder, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getNodeShapeProfile(node) {
  const raw = String(node?.__themeLabShapeProfile ?? runtime.active.node_shape_profile ?? "default").trim().toLowerCase();
  return raw || "default";
}

function buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset = 0 } = {}) {
  const baseArea = getNodeOutlineArea(node, size);
  const area = [
    baseArea[0] + inset,
    baseArea[1] + inset,
    Math.max(0, baseArea[2] - inset * 2),
    Math.max(0, baseArea[3] - inset * 2),
  ];

  const profile = getNodeShapeProfile(node);
  const radius = Math.max(0, Number(litegraph?.ROUND_RADIUS || 0));
  const shapeIntensity = getShapeIntensity();
  if (profile === "box") {
    ctx.rect(area[0], area[1], area[2], area[3]);
    return;
  }
  if (profile === "round") {
    ctx.roundRect(area[0], area[1], area[2], area[3], [radius]);
    return;
  }
  if (profile === "card") {
    ctx.roundRect(area[0], area[1], area[2], area[3], [radius, 0, radius, 0]);
    return;
  }
  if (profile === "squircle") {
    buildSquirclePath(
      ctx,
      area[0],
      area[1],
      area[2],
      area[3],
      Math.max(radius, Math.min(area[2], area[3]) * (0.14 + shapeIntensity * 0.07)),
    );
    return;
  }
  if (profile === "capsule") {
    ctx.roundRect(
      area[0],
      area[1],
      area[2],
      area[3],
      [Math.max(radius, Math.min(area[2], area[3]) * (0.34 + shapeIntensity * 0.1))],
    );
    return;
  }
  if (profile === "panel") {
    buildPanelPath(ctx, area[0], area[1], area[2], area[3], Math.max(radius, 10 + (shapeIntensity - 1) * 8));
    return;
  }
  if (profile === "notch") {
    buildNotchedCardPath(ctx, area[0], area[1], area[2], area[3], Math.max(radius, 10 + (shapeIntensity - 1) * 8));
    return;
  }

  const shape = resolveNodeShape(node?.__themeLabRenderShape ?? node?.renderingShape ?? node?._shape, litegraph);
  if (shape === litegraph?.BOX_SHAPE || lowQuality) {
    ctx.rect(area[0], area[1], area[2], area[3]);
    return;
  }
  if (shape === litegraph?.ROUND_SHAPE || shape === litegraph?.CARD_SHAPE) {
    const radius = Math.max(0, Number(litegraph?.ROUND_RADIUS || 0));
    ctx.roundRect(
      area[0],
      area[1],
      area[2],
      area[3],
      shape === litegraph?.CARD_SHAPE ? [radius, 0, radius, 0] : [radius],
    );
    return;
  }
  if (shape === litegraph?.CIRCLE_SHAPE) {
    ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2);
    return;
  }
  ctx.rect(area[0], area[1], area[2], area[3]);
}

function resolveNodeShape(shape, litegraph) {
  if (shape === litegraph?.BOX_SHAPE || shape === litegraph?.ROUND_SHAPE || shape === litegraph?.CARD_SHAPE || shape === litegraph?.CIRCLE_SHAPE) {
    return shape;
  }

  const raw = String(shape ?? "").trim().toLowerCase();
  if (!raw || raw === "default") {
    return litegraph?.ROUND_SHAPE ?? 2;
  }
  if (raw === "1" || raw === "box") {
    return litegraph?.BOX_SHAPE ?? 1;
  }
  if (raw === "2" || raw === "round") {
    return litegraph?.ROUND_SHAPE ?? 2;
  }
  if (raw === "4" || raw === "card") {
    return litegraph?.CARD_SHAPE ?? 4;
  }
  if (raw === "circle") {
    return litegraph?.CIRCLE_SHAPE ?? 3;
  }
  return litegraph?.ROUND_SHAPE ?? 2;
}

function resolveThemeLabBaseShape(profile, litegraph, fallbackShape) {
  const normalizedProfile = String(profile || "").trim().toLowerCase();
  if (!normalizedProfile || normalizedProfile === "default") {
    return resolveNodeShape(fallbackShape, litegraph);
  }
  if (normalizedProfile === "box") {
    return litegraph?.BOX_SHAPE ?? 1;
  }
  if (normalizedProfile === "round" || normalizedProfile === "squircle" || normalizedProfile === "capsule") {
    return litegraph?.ROUND_SHAPE ?? 2;
  }
  if (normalizedProfile === "card" || normalizedProfile === "panel" || normalizedProfile === "notch") {
    return litegraph?.CARD_SHAPE ?? 4;
  }
  return resolveNodeShape(fallbackShape, litegraph);
}

function emitNodePropertyChanged(app, node, property, newValue) {
  try {
    app?.graph?.onTrigger?.({
      type: "node:property:changed",
      nodeId: String(node?.id ?? ""),
      property,
      newValue,
    });
  } catch {
    // Ignore missing graph trigger support.
  }
}

function applyThemeLabShapeToGraph(app, litegraph, config) {
  const graph = app?.graph;
  const nodes = graph?._nodes || graph?.nodes || [];
  if (!nodes.length) {
    return;
  }

  const normalizedProfile = String(config?.node_shape_profile || "default").trim().toLowerCase() || "default";
  const forcedShape = resolveThemeLabBaseShape(normalizedProfile, litegraph, litegraph?.NODE_DEFAULT_SHAPE);

  for (const node of nodes) {
    if (!node || resolveNodeShape(node?.renderingShape ?? node?._shape ?? node?.shape, litegraph) === litegraph?.CIRCLE_SHAPE) {
      continue;
    }

    if (normalizedProfile === "default") {
      if (Object.prototype.hasOwnProperty.call(node, "__themeLabOriginalShape")) {
        const originalShape = node.__themeLabOriginalShape;
        delete node.__themeLabOriginalShape;
        if (originalShape === undefined) {
          if (Object.prototype.hasOwnProperty.call(node, "shape")) {
            delete node.shape;
            emitNodePropertyChanged(app, node, "shape", undefined);
          }
        } else if (node.shape !== originalShape) {
          node.shape = originalShape;
          emitNodePropertyChanged(app, node, "shape", originalShape);
        }
      }
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(node, "__themeLabOriginalShape")) {
      node.__themeLabOriginalShape = node.shape;
    }
    if (node.shape !== forcedShape) {
      node.shape = forcedShape;
      emitNodePropertyChanged(app, node, "shape", forcedShape);
    }
  }
}

function shouldUseCustomBodyPaint(style, profile) {
  return style !== "default" || !["default", "box", "round", "card"].includes(String(profile || "").trim().toLowerCase());
}

function withNodeOutlineClip(ctx, node, size, litegraph, lowQuality, callback) {
  if (typeof callback !== "function") {
    return undefined;
  }
  ctx.save();
  ctx.beginPath();
  buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
  ctx.clip();
  try {
    return callback();
  } finally {
    ctx.restore();
  }
}

function drawNodeSurfaceBase(ctx, node, size, litegraph, lowQuality, selected, fgcolor, bgcolor) {
  if (!ctx || !node || !size) {
    return;
  }

  const style = String(runtime.active.node_surface_style || "default");
  const profile = getNodeShapeProfile(node);
  if (!shouldUseCustomBodyPaint(style, profile)) {
    return;
  }

  const area = getNodeOutlineArea(node, size);
  const titleColor = litegraph?.NODE_DEFAULT_COLOR || fgcolor || "#3B4554";
  const bodyColor = bgcolor || litegraph?.NODE_DEFAULT_BGCOLOR || "#1C212A";
  const accentColor = litegraph?.NODE_DEFAULT_BOXCOLOR || fgcolor || "#7A8799";
  const selectedBoost = selected ? 0.04 : 0;

  ctx.save();
  ctx.beginPath();
  buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
  ctx.clip();

  const fillVertical = (stops) => {
    const gradient = ctx.createLinearGradient(0, area[1], 0, area[1] + area[3]);
    for (const [offset, color] of stops) {
      gradient.addColorStop(offset, color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
  };

  if (style === "soft-card") {
    fillVertical([
      [0, colorToRgba(titleColor, 0.68 + selectedBoost)],
      [0.2, colorToRgba(bodyColor, 0.9)],
      [1, colorToRgba(bodyColor, 0.97)],
    ]);
    const gloss = ctx.createLinearGradient(area[0], area[1], area[0], area[1] + area[3] * 0.45);
    gloss.addColorStop(0, colorToRgba("#FFFFFF", 0.11));
    gloss.addColorStop(1, colorToRgba("#FFFFFF", 0));
    ctx.fillStyle = gloss;
    ctx.fillRect(area[0], area[1], area[2], area[3] * 0.45);
  } else if (style === "media-card") {
    fillVertical([
      [0, colorToRgba(titleColor, 0.5)],
      [0.34, colorToRgba(bodyColor, 0.88)],
      [1, colorToRgba(bodyColor, 1)],
    ]);
    const vignette = ctx.createLinearGradient(0, area[1] + area[3] * 0.35, 0, area[1] + area[3]);
    vignette.addColorStop(0, colorToRgba("#000000", 0));
    vignette.addColorStop(1, colorToRgba("#000000", 0.18));
    ctx.fillStyle = vignette;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
  } else if (style === "minimal-wire") {
    ctx.fillStyle = colorToRgba(bodyColor, 0.96);
    ctx.fillRect(area[0], area[1], area[2], area[3]);
  } else if (style === "glass-panel") {
    fillVertical([
      [0, colorToRgba("#0E1823", 0.16 + selectedBoost * 0.4)],
      [0.24, colorToRgba(bodyColor, 0.12)],
      [1, colorToRgba("#070C12", 0.18)],
    ]);
    const tint = ctx.createLinearGradient(area[0], area[1], area[0] + area[2], area[1] + area[3]);
    tint.addColorStop(0, colorToRgba("#DCEEFF", 0.05));
    tint.addColorStop(1, colorToRgba(accentColor, 0.025));
    ctx.fillStyle = tint;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
  } else if (style === "liquid-glass") {
    fillVertical([
      [0, colorToRgba("#F6FBFF", 0.1 + selectedBoost * 0.5)],
      [0.32, colorToRgba(bodyColor, 0.045)],
      [1, colorToRgba("#CFE8FF", 0.085)],
    ]);
    const tint = ctx.createLinearGradient(area[0], area[1], area[0] + area[2], area[1] + area[3]);
    tint.addColorStop(0, colorToRgba("#FFFFFF", 0.08));
    tint.addColorStop(1, colorToRgba("#AFE6FF", 0.045));
    ctx.fillStyle = tint;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
  } else if (style === "studio-frame") {
    fillVertical([
      [0, colorToRgba(titleColor, 0.36)],
      [0.18, colorToRgba(bodyColor, 0.92)],
      [1, colorToRgba(bodyColor, 0.98)],
    ]);
  } else if (style === "neon-edge") {
    fillVertical([
      [0, colorToRgba(titleColor, 0.16)],
      [0.1, colorToRgba(bodyColor, 0.97)],
      [1, colorToRgba(bodyColor, 1)],
    ]);
  } else {
    fillVertical([
      [0, colorToRgba(titleColor, 0.52)],
      [0.18, colorToRgba(bodyColor, 0.92)],
      [1, colorToRgba(bodyColor, 0.98)],
    ]);
  }

  ctx.restore();
}

function isGlassSurfaceStyle(style) {
  return GLASS_SURFACE_STYLES.has(String(style || "").trim());
}

function getBackdropBuffer(width, height) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  let canvas = BACKDROP_BUFFER.canvas;
  let ctx = BACKDROP_BUFFER.ctx;
  if (!canvas || !ctx) {
    canvas = typeof document !== "undefined"
      ? document.createElement("canvas")
      : null;
    ctx = canvas?.getContext?.("2d", { willReadFrequently: false }) || null;
    if (!canvas || !ctx) {
      return null;
    }
    BACKDROP_BUFFER.canvas = canvas;
    BACKDROP_BUFFER.ctx = ctx;
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  return { canvas, ctx };
}

function getTransformedBounds(transform, rect) {
  const points = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ].map(([x, y]) => ({
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  }));

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function drawGlassBackdropBlur(ctx, node, size, litegraph, lowQuality, style) {
  if (!ctx?.canvas || lowQuality || !isGlassSurfaceStyle(style) || typeof ctx.getTransform !== "function") {
    return false;
  }

  const area = getNodeOutlineArea(node, size);
  if (area[2] <= 8 || area[3] <= 8) {
    return false;
  }

  const blurPx = style === "liquid-glass" ? 14 : 12;
  const pad = Math.max(8, blurPx * 1.4);
  const localRect = {
    x: area[0] - pad,
    y: area[1] - pad,
    width: area[2] + pad * 2,
    height: area[3] + pad * 2,
  };

  const transform = ctx.getTransform();
  const screenRect = getTransformedBounds(transform, localRect);
  const sourceCanvas = ctx.canvas;
  const sx = Math.max(0, Math.floor(screenRect.x));
  const sy = Math.max(0, Math.floor(screenRect.y));
  const sw = Math.max(1, Math.min(sourceCanvas.width - sx, Math.ceil(screenRect.width)));
  const sh = Math.max(1, Math.min(sourceCanvas.height - sy, Math.ceil(screenRect.height)));
  if (sw <= 1 || sh <= 1 || sw * sh > 1_600_000) {
    return false;
  }

  const buffer = getBackdropBuffer(sw, sh);
  if (!buffer) {
    return false;
  }

  const { canvas, ctx: bufferCtx } = buffer;
  bufferCtx.save();
  bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
  bufferCtx.clearRect(0, 0, sw, sh);
  bufferCtx.filter = `blur(${blurPx}px) saturate(${style === "liquid-glass" ? 1.18 : 1.08})`;
  bufferCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  bufferCtx.restore();

  ctx.save();
  ctx.beginPath();
  buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
  ctx.clip();
  ctx.globalAlpha = style === "liquid-glass" ? 0.88 : 0.72;
  ctx.drawImage(canvas, localRect.x, localRect.y, localRect.width, localRect.height);
  ctx.restore();
  return true;
}

function drawNodeSurfaceChrome(ctx, node, size, litegraph, lowQuality, selected, fgcolor, bgcolor) {
  if (!ctx || !node || !size) {
    return;
  }

  const style = String(runtime.active.node_surface_style || "default");
  const profile = getNodeShapeProfile(node);
  const shadowOpacity = clamp(Number(runtime.active.node_shadow_opacity || 0), 0, 1);
  const shadowBlur = Math.max(0, Number(runtime.active.node_shadow_blur || 0));
  const shadowOffsetY = Number(runtime.active.node_shadow_offset_y || 0);
  const innerStrokeWidth = Math.max(0, Number(runtime.active.node_inner_stroke_width || 0));
  const headerBandHeight = Math.max(0, Number(runtime.active.node_header_band_height || 0));
  const headerBandOpacity = clamp(Number(runtime.active.node_header_band_opacity || 0), 0, 1);
  const area = getNodeOutlineArea(node, size);
  const glassSurface = isGlassSurfaceStyle(style);
  const shapeIntensity = getShapeIntensity();

  if (shadowOpacity > 0 && (shadowBlur > 0 || shadowOffsetY !== 0)) {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.globalCompositeOperation = "destination-over";
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.shadowColor = colorToRgba(
      litegraph?.DEFAULT_SHADOW_COLOR || "#000000",
      shadowOpacity,
    );
    ctx.fillStyle = colorToRgba("#000000", Math.min(0.28, shadowOpacity * 0.45));
    ctx.fill();
    ctx.restore();
  }

  if (headerBandHeight > 0 && headerBandOpacity > 0) {
    const bandInset = style === "media-card"
      ? 3
      : style === "soft-card" || style === "glass-panel" || style === "liquid-glass"
        ? 2
        : style === "studio-frame"
          ? 1
          : 0;
    const bandColor = selected
      ? (litegraph?.NODE_SELECTED_TITLE_COLOR || fgcolor || "#FFFFFF")
      : (litegraph?.NODE_DEFAULT_BOXCOLOR || fgcolor || "#FFFFFF");
    const bandHeight = Math.min(headerBandHeight, Math.max(0, area[3] - bandInset * 2));
    if (bandHeight > 0) {
      ctx.save();
      ctx.beginPath();
      buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
      ctx.clip();
      const gradient = ctx.createLinearGradient(0, area[1] + bandInset, 0, area[1] + bandInset + bandHeight);
      gradient.addColorStop(0, colorToRgba(bandColor, Math.min(1, headerBandOpacity * 1.25)));
      gradient.addColorStop(1, colorToRgba(bandColor, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(
        area[0] + bandInset,
        area[1] + bandInset,
        Math.max(0, area[2] - bandInset * 2),
        bandHeight,
      );
      ctx.restore();
    }
  }

  if (innerStrokeWidth > 0 && !glassSurface) {
    const inset = Math.max(innerStrokeWidth * 0.75, style === "media-card" ? 2.5 : style === "soft-card" ? 1.5 : 1);
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset });
    ctx.lineWidth = innerStrokeWidth;
    if (style === "media-card") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.42);
    } else if (style === "soft-card") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.28);
    } else if (style === "glass-panel") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.34);
    } else if (style === "liquid-glass") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.48);
    } else if (style === "studio-frame") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.38);
    } else if (style === "neon-edge") {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.52);
    } else if (style === "minimal-wire") {
      ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.22);
    } else {
      ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.18);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (style === "soft-card") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 0.75 });
    ctx.lineWidth = Math.max(3, Number(runtime.active.node_outline_width || 0) * 2.6);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", selected ? 0.18 : 0.11);
    ctx.shadowBlur = Math.max(18, Number(runtime.active.node_shadow_blur || 0) * 1.15);
    ctx.shadowColor = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", selected ? 0.16 : 0.1);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.globalCompositeOperation = "destination-over";
    ctx.shadowBlur = Math.max(20, Number(runtime.active.node_shadow_blur || 0) * 1.35);
    ctx.shadowOffsetY = Math.max(8, Number(runtime.active.node_shadow_offset_y || 0));
    ctx.shadowColor = colorToRgba(litegraph?.DEFAULT_SHADOW_COLOR || "#000000", Math.min(0.6, shadowOpacity * 0.75));
    ctx.fillStyle = colorToRgba(litegraph?.NODE_DEFAULT_BGCOLOR || bgcolor || "#000000", 0.08);
    ctx.fill();
    ctx.restore();
  }

  if (style === "glass-panel") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.clip();
    const gloss = ctx.createLinearGradient(area[0], area[1], area[0] + area[2] * 0.72, area[1] + area[3]);
    gloss.addColorStop(0, colorToRgba("#FFFFFF", 0.15));
    gloss.addColorStop(0.22, colorToRgba("#D9E8F8", 0.08));
    gloss.addColorStop(0.5, colorToRgba("#7EA2C7", 0.03));
    gloss.addColorStop(1, colorToRgba("#FFFFFF", 0));
    ctx.fillStyle = gloss;
    ctx.fillRect(area[0], area[1], area[2], area[3]);

    const rim = ctx.createLinearGradient(area[0], area[1], area[0], area[1] + area[3]);
    rim.addColorStop(0, colorToRgba("#F7FBFF", 0.16));
    rim.addColorStop(0.22, colorToRgba("#CFE6FA", 0.08));
    rim.addColorStop(1, colorToRgba("#FFFFFF", 0));
    ctx.fillStyle = rim;
    ctx.fillRect(area[0], area[1], area[2], Math.max(20, area[3] * 0.4));

    const lowerHaze = ctx.createLinearGradient(0, area[1] + area[3] * 0.38, 0, area[1] + area[3]);
    lowerHaze.addColorStop(0, colorToRgba("#09111A", 0));
    lowerHaze.addColorStop(0.55, colorToRgba("#081019", 0.04));
    lowerHaze.addColorStop(1, colorToRgba("#000000", 0.12));
    ctx.fillStyle = lowerHaze;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
    ctx.restore();

    if (selected) {
      ctx.save();
      ctx.beginPath();
      buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 0.5 });
      ctx.lineWidth = Math.max(2.8, Number(runtime.active.node_outline_width || 0) * 2.4);
      ctx.strokeStyle = colorToRgba("#D9EEFF", 0.34);
      ctx.shadowBlur = Math.max(10, Number(runtime.active.node_shadow_blur || 0) * 0.36);
      ctx.shadowColor = colorToRgba("#B8DFFF", 0.12);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (style === "liquid-glass") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.clip();

    const gloss = ctx.createLinearGradient(area[0], area[1], area[0] + area[2] * 0.75, area[1] + area[3]);
    gloss.addColorStop(0, colorToRgba("#FFFFFF", 0.2));
    gloss.addColorStop(0.28, colorToRgba("#F5FBFF", 0.1));
    gloss.addColorStop(0.55, colorToRgba("#DDF4FF", 0.04));
    gloss.addColorStop(1, colorToRgba("#FFFFFF", 0));
    ctx.fillStyle = gloss;
    ctx.fillRect(area[0], area[1], area[2], area[3]);

    const rim = ctx.createLinearGradient(area[0], area[1], area[0], area[1] + area[3]);
    rim.addColorStop(0, colorToRgba("#FFFFFF", 0.32));
    rim.addColorStop(0.24, colorToRgba("#FFFFFF", 0.12));
    rim.addColorStop(1, colorToRgba("#FFFFFF", 0));
    ctx.fillStyle = rim;
    ctx.fillRect(area[0], area[1], area[2], Math.max(22, area[3] * 0.42));

    const lowerHaze = ctx.createLinearGradient(0, area[1] + area[3] * 0.5, 0, area[1] + area[3]);
    lowerHaze.addColorStop(0, colorToRgba("#A7E7FF", 0));
    lowerHaze.addColorStop(1, colorToRgba("#A7E7FF", 0.045));
    ctx.fillStyle = lowerHaze;
    ctx.fillRect(area[0], area[1], area[2], area[3]);
    ctx.restore();

    if (selected) {
      ctx.save();
      ctx.beginPath();
      buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 0.5 });
      ctx.lineWidth = Math.max(3, Number(runtime.active.node_outline_width || 0) * 2.7);
      ctx.strokeStyle = colorToRgba("#F2FBFF", 0.42);
      ctx.shadowBlur = Math.max(14, Number(runtime.active.node_shadow_blur || 0) * 0.5);
      ctx.shadowColor = colorToRgba("#FFFFFF", 0.14);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (style === "studio-frame") {
    const frameInset = Math.max(3, 2 + shapeIntensity * 2.2);
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: frameInset });
    ctx.lineWidth = Math.max(1, 0.8 + shapeIntensity * 0.35);
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.22 + shapeIntensity * 0.08);
    ctx.stroke();

    const chipWidth = Math.min(Math.max(78, area[2] * (0.28 + shapeIntensity * 0.08)), area[2] - 24);
    const chipHeight = Math.min(20, Math.max(12, Number(runtime.active.node_title_height || 28) - 14 + shapeIntensity * 2));
    const chipX = area[0] + 14;
    const chipY = area[1] + (6 + shapeIntensity * 1.5);
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipWidth, chipHeight, [chipHeight * 0.5]);
    ctx.fillStyle = colorToRgba(litegraph?.NODE_DEFAULT_BOXCOLOR || fgcolor || "#FFFFFF", 0.22);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.38);
    ctx.stroke();

    ctx.beginPath();
    const y = area[1] + Math.max(18, Number(runtime.active.node_title_height || 30) + shapeIntensity * 1.5);
    ctx.moveTo(area[0] + 14, y);
    ctx.lineTo(area[0] + area[2] - 12, y);
    ctx.lineWidth = Math.max(1.35, 1.1 + shapeIntensity * 0.4);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.26 + shapeIntensity * 0.14);
    ctx.stroke();

    const railInset = 10 + shapeIntensity * 2;
    ctx.beginPath();
    ctx.moveTo(area[0] + railInset, area[1] + 12);
    ctx.lineTo(area[0] + railInset, area[1] + area[3] - 14);
    ctx.moveTo(area[0] + area[2] - railInset, area[1] + 12);
    ctx.lineTo(area[0] + area[2] - railInset, area[1] + area[3] - 14);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.14 + shapeIntensity * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  if (style === "minimal-wire") {
    ctx.save();
    ctx.beginPath();
    const y = area[1] + Math.max(14, Number(runtime.active.node_title_height || 24));
    ctx.moveTo(area[0] + 10, y);
    ctx.lineTo(area[0] + area[2] - 10, y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.35);
    ctx.stroke();
    ctx.restore();
  }

  if (style === "neon-edge") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.lineWidth = Math.max(1, Number(runtime.active.node_outline_width || 1));
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.34);
    ctx.stroke();

    ctx.beginPath();
    const y = area[1] + 10;
    ctx.moveTo(area[0] + 12, y);
    ctx.lineTo(area[0] + area[2] - 12, y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.28);
    ctx.stroke();

    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 3 });
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.16);
    ctx.stroke();
    ctx.restore();
  }

  if (style === "media-card") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality);
    ctx.clip();
    const vignette = ctx.createLinearGradient(0, area[1] + area[3] * 0.45, 0, area[1] + area[3]);
    vignette.addColorStop(0, colorToRgba(bgcolor || litegraph?.NODE_DEFAULT_BGCOLOR || "#000000", 0));
    vignette.addColorStop(1, colorToRgba(bgcolor || litegraph?.NODE_DEFAULT_BGCOLOR || "#000000", 0.2));
    ctx.fillStyle = vignette;
    ctx.fillRect(area[0], area[1], area[2], area[3]);

    const frameInset = 4 + shapeIntensity * 1.8;
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: frameInset });
    ctx.lineWidth = Math.max(1.2, 0.9 + shapeIntensity * 0.5);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.12 + shapeIntensity * 0.1);
    ctx.stroke();

    const deckY = area[1] + Math.max(18, Number(runtime.active.node_title_height || 30) * 0.9);
    ctx.beginPath();
    ctx.moveTo(area[0] + 12, deckY);
    ctx.lineTo(area[0] + area[2] - 12, deckY);
    ctx.lineWidth = Math.max(1, 0.8 + shapeIntensity * 0.35);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_DEFAULT_BOXCOLOR || fgcolor || "#FFFFFF", 0.16 + shapeIntensity * 0.08);
    ctx.stroke();
    ctx.restore();
  }

  if (profile === "squircle") {
    ctx.save();
    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 1 });
    ctx.lineWidth = Math.max(1, 0.8 + shapeIntensity * 0.35);
    ctx.strokeStyle = colorToRgba(
      litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF",
      (selected ? 0.14 : 0.08) + shapeIntensity * 0.08,
    );
    ctx.shadowBlur = 8 + shapeIntensity * 8;
    ctx.shadowColor = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.04 + shapeIntensity * 0.03);
    ctx.stroke();
    ctx.restore();
  }

  if (profile === "capsule") {
    ctx.save();
    ctx.beginPath();
    const highlightWidth = Math.max(48, area[2] * (0.5 + shapeIntensity * 0.1));
    const highlightHeight = Math.min(20, Math.max(10, Number(runtime.active.node_title_height || 30) * (0.34 + shapeIntensity * 0.08)));
    const chipX = area[0] + area[2] * 0.5 - highlightWidth * 0.5;
    const chipY = area[1] + (6 + shapeIntensity * 1.2);
    ctx.roundRect(chipX, chipY, highlightWidth, highlightHeight, [highlightHeight * 0.5]);
    ctx.fillStyle = colorToRgba("#FFFFFF", 0.04 + shapeIntensity * 0.025);
    ctx.fill();
    ctx.lineWidth = Math.max(1, 0.8 + shapeIntensity * 0.2);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.08 + shapeIntensity * 0.08);
    ctx.stroke();

    ctx.beginPath();
    buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality, { inset: 2 });
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.06 + shapeIntensity * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  if (profile === "panel") {
    ctx.save();
    ctx.beginPath();
    const horizontalInset = 14 + shapeIntensity * 6;
    const topY = area[1] + Math.max(16, Number(runtime.active.node_title_height || 30) * (0.74 + shapeIntensity * 0.08));
    ctx.moveTo(area[0] + horizontalInset, topY);
    ctx.lineTo(area[0] + area[2] - horizontalInset, topY);
    ctx.lineWidth = Math.max(1.15, 0.95 + shapeIntensity * 0.35);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.16 + shapeIntensity * 0.12);
    ctx.stroke();

    ctx.beginPath();
    const bottomY = area[1] + area[3] - (12 + shapeIntensity * 2);
    ctx.moveTo(area[0] + horizontalInset + 2, bottomY);
    ctx.lineTo(area[0] + area[2] - horizontalInset - 2, bottomY);
    ctx.lineWidth = Math.max(0.9, 0.75 + shapeIntensity * 0.2);
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.08 + shapeIntensity * 0.08);
    ctx.stroke();

    const sideInset = 10 + shapeIntensity * 3;
    ctx.beginPath();
    ctx.moveTo(area[0] + sideInset, area[1] + 14);
    ctx.lineTo(area[0] + sideInset, area[1] + area[3] - 14);
    ctx.moveTo(area[0] + area[2] - sideInset, area[1] + 14);
    ctx.lineTo(area[0] + area[2] - sideInset, area[1] + area[3] - 14);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.04 + shapeIntensity * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  if (profile === "notch") {
    ctx.save();
    const chipWidth = Math.min(Math.max(76, area[2] * (0.22 + shapeIntensity * 0.08)), area[2] - 28);
    const chipHeight = 12 + shapeIntensity * 2.6;
    const chipX = area[0] + area[2] * 0.5 - chipWidth * 0.5;
    const chipY = area[1] + 3.5;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipWidth, chipHeight, [chipHeight * 0.5]);
    ctx.fillStyle = colorToRgba(litegraph?.NODE_DEFAULT_COLOR || fgcolor || "#FFFFFF", 0.12 + shapeIntensity * 0.06);
    ctx.fill();
    ctx.lineWidth = Math.max(1, 0.85 + shapeIntensity * 0.22);
    ctx.strokeStyle = colorToRgba(litegraph?.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.12 + shapeIntensity * 0.08);
    ctx.stroke();

    ctx.beginPath();
    const guideY = area[1] + Math.max(18, Number(runtime.active.node_title_height || 30) * (0.68 + shapeIntensity * 0.06));
    ctx.moveTo(area[0] + 14, guideY);
    ctx.lineTo(area[0] + area[2] - 14, guideY);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = colorToRgba(litegraph?.WIDGET_OUTLINE_COLOR || fgcolor || "#FFFFFF", 0.06 + shapeIntensity * 0.07);
    ctx.stroke();
    ctx.restore();
  }
}

function shouldOverrideNodeShape(node, litegraph) {
  const currentShape = resolveNodeShape(node?.renderingShape ?? node?._shape, litegraph);
  return currentShape !== litegraph?.CIRCLE_SHAPE;
}

function getActiveNodeSlotStyle(node) {
  if (!node || node.flags?.collapsed) {
    return "default";
  }
  return resolveNodeSlotStyle(runtime.active);
}

function applySlotBubbleOffset(position, node, isInput) {
  if (!Array.isArray(position)) {
    return position;
  }

  const slotStyle = getActiveNodeSlotStyle(node);
  let offset = 0;
  if (slotStyle === "floating") {
    offset = Math.max(18, Number(runtime.active.node_slot_height || 20) * 1.05);
  } else if (slotStyle === "pill") {
    offset = Math.max(8, Number(runtime.active.node_slot_height || 20) * 0.42);
  } else if (slotStyle === "ring") {
    offset = Math.max(3, Number(runtime.active.node_slot_height || 20) * 0.16);
  }
  if (offset <= 0 || node?.flags?.collapsed) {
    return position;
  }
  position[0] += isInput ? -offset : offset;
  return position;
}

function getSlotCentre(slot) {
  if (Array.isArray(slot?._centreOffset) && slot._centreOffset.length >= 2) {
    return slot._centreOffset;
  }
  const rect = slot?.boundingRect;
  const nodePos = slot?.node?.pos || [0, 0];
  if (!rect) {
    return [0, 0];
  }
  const size = Number(rect[3] || rect[2] || runtime.active.node_slot_height || 20);
  return [
    rect[0] - nodePos[0] + size * 0.5,
    rect[1] - nodePos[1] + size * 0.5,
  ];
}

function drawThemedSlotBubble(slot, ctx, options = {}) {
  const slotStyle = getActiveNodeSlotStyle(slot?.node);
  if (!slot || !ctx || slotStyle === "default" || slot.isWidgetInputSlot || options.lowQuality) {
    return;
  }

  const colorContext = options.colorContext;
  const highlight = Boolean(options.highlight);
  const [x, y] = getSlotCentre(slot);
  const baseColor = slot.renderingColor?.(colorContext) || "#9AB7A8";
  const shapeIntensity = getShapeIntensity();
  const radiusBase = highlight ? 8.25 : 7.25;

  ctx.save();
  if (slotStyle === "floating") {
    const radius = radiusBase + shapeIntensity * 0.55;
    const haloRadius = radius + 6.5 + shapeIntensity * 0.9;
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba(baseColor, highlight ? 0.18 : 0.12);
    ctx.shadowBlur = highlight ? 18 : 14;
    ctx.shadowColor = colorToRgba(baseColor, highlight ? 0.3 : 0.2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba(baseColor, 0.96);
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = highlight ? 1.5 : 1;
    ctx.strokeStyle = colorToRgba("#F4F9FF", highlight ? 0.65 : 0.38);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - radius * 0.32, y - radius * 0.32, Math.max(1.2, radius * 0.28), 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba("#FFFFFF", highlight ? 0.35 : 0.22);
    ctx.fill();
  } else if (slotStyle === "ring") {
    const radius = radiusBase - 0.8 + shapeIntensity * 0.28;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3.2, 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba(baseColor, 0.08);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba(baseColor, 0.12);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = highlight ? 2.25 : 1.85;
    ctx.strokeStyle = colorToRgba("#F3FBFF", highlight ? 0.54 : 0.34);
    ctx.stroke();
  } else if (slotStyle === "minimal") {
    const radius = Math.max(3.1, radiusBase * 0.48);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colorToRgba(baseColor, 0.76);
    ctx.fill();
  } else if (slotStyle === "pill") {
    const width = Math.max(16, Number(runtime.active.node_slot_height || 20) * (1.05 + shapeIntensity * 0.06));
    const height = Math.max(9, Number(runtime.active.node_slot_height || 20) * (0.48 + shapeIntensity * 0.03));
    ctx.beginPath();
    ctx.roundRect(x - width * 0.5, y - height * 0.5, width, height, [height * 0.5]);
    ctx.fillStyle = colorToRgba(baseColor, 0.18);
    ctx.shadowBlur = highlight ? 16 : 12;
    ctx.shadowColor = colorToRgba(baseColor, 0.18);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(x - width * 0.5, y - height * 0.5, width, height, [height * 0.5]);
    ctx.lineWidth = highlight ? 1.7 : 1.25;
    ctx.strokeStyle = colorToRgba("#F4F9FF", highlight ? 0.54 : 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function getSampleConcreteSlot(app, kind = "input") {
  const nodes = app?.graph?._nodes || app?.graph?.nodes || [];
  for (const node of nodes) {
    node?._setConcreteSlots?.();
    const slots = kind === "output" ? node?._concreteOutputs : node?._concreteInputs;
    const match = slots?.find?.((slot) => slot && !slot.isWidgetInputSlot);
    if (match) {
      return match;
    }
  }
  return null;
}

function ensureSlotDrawPatches(app) {
  let patched = true;

  const inputSlotSample = getSampleConcreteSlot(app, "input");
  const inputSlotProto = inputSlotSample ? Object.getPrototypeOf(inputSlotSample) : null;
  if (inputSlotProto?.draw && !inputSlotProto.draw.__themeLabCanvasPatched) {
    const drawInputSlot = inputSlotProto.draw;
    const wrappedDrawInputSlot = function(ctx, options) {
      const result = drawInputSlot.apply(this, arguments);
      drawThemedSlotBubble(this, ctx, options);
      return result;
    };
    wrappedDrawInputSlot.__themeLabCanvasPatched = true;
    inputSlotProto.draw = wrappedDrawInputSlot;
  } else if (!inputSlotProto?.draw) {
    patched = false;
  }

  const outputSlotSample = getSampleConcreteSlot(app, "output");
  const outputSlotProto = outputSlotSample ? Object.getPrototypeOf(outputSlotSample) : null;
  if (outputSlotProto?.draw && !outputSlotProto.draw.__themeLabCanvasPatched) {
    const drawOutputSlot = outputSlotProto.draw;
    const wrappedDrawOutputSlot = function(ctx, options) {
      const result = drawOutputSlot.apply(this, arguments);
      drawThemedSlotBubble(this, ctx, options);
      return result;
    };
    wrappedDrawOutputSlot.__themeLabCanvasPatched = true;
    outputSlotProto.draw = wrappedDrawOutputSlot;
  } else if (!outputSlotProto?.draw) {
    patched = false;
  }

  return patched;
}

function ensureRuntimePatches(app) {
  if (runtime.installed) {
    if (!runtime.slotPatchesInstalled) {
      runtime.slotPatchesInstalled = ensureSlotDrawPatches(app);
    }
    return true;
  }

  const litegraph = readLiteGraph();
  const graphCanvas = readGraphCanvas();
  if (!litegraph || !graphCanvas) {
    return false;
  }

  const drawNodeShape = graphCanvas.prototype?.drawNodeShape;
  if (typeof drawNodeShape === "function" && !drawNodeShape.__themeLabCanvasPatched) {
    const wrappedDrawNodeShape = function(node, ctx, size, fgcolor, bgcolor, selected) {
      const style = String(runtime.active.node_surface_style || "default");
      const profile = getNodeShapeProfile(node);
      const forcedShape = resolveThemeLabBaseShape(profile, litegraph, litegraph?.NODE_DEFAULT_SHAPE);
      const useCustomBody = shouldUseCustomBodyPaint(style, profile);
      const hadOwnShape = Object.prototype.hasOwnProperty.call(node || {}, "_shape");
      const previousShape = node?._shape;
      const previousThemeShape = node?.__themeLabRenderShape;
      const previousThemeShapeProfile = node?.__themeLabShapeProfile;
      const previousStrokeStyles = node?.strokeStyles;
      const applyForcedShape = node && shouldOverrideNodeShape(node, litegraph);

      if (applyForcedShape) {
        node.__themeLabRenderShape = forcedShape;
        node.__themeLabShapeProfile = profile;
        node._shape = forcedShape;
      }

      const suppressSelectedStroke = useCustomBody
        && !["default", "box", "round", "card"].includes(profile)
        && node?.strokeStyles
        && typeof node.strokeStyles === "object"
        && "selected" in node.strokeStyles;
      if (suppressSelectedStroke) {
        const { selected: _selectedStroke, ...rest } = node.strokeStyles;
        node.strokeStyles = rest;
      }

      if (isGlassSurfaceStyle(style)) {
        drawGlassBackdropBlur(ctx, node, size, litegraph, Boolean(this.low_quality), style);
      }

      if (useCustomBody) {
        drawNodeSurfaceBase(
          ctx,
          node,
          size,
          litegraph,
          Boolean(this.low_quality),
          selected,
          fgcolor,
          bgcolor,
        );
      }

      const nextFgColor = isGlassSurfaceStyle(style)
        ? colorToRgba(selected ? (litegraph?.NODE_SELECTED_TITLE_COLOR || fgcolor || "#FFFFFF") : (fgcolor || litegraph?.NODE_DEFAULT_COLOR || "#FFFFFF"), style === "liquid-glass" ? 0.12 : 0.08)
        : fgcolor;
      const nextBgColor = useCustomBody
        ? colorToRgba(bgcolor || litegraph?.NODE_DEFAULT_BGCOLOR || "#FFFFFF", 0)
        : isGlassSurfaceStyle(style)
        ? colorToRgba(bgcolor || litegraph?.NODE_DEFAULT_BGCOLOR || "#FFFFFF", style === "liquid-glass" ? 0.12 : 0.16)
        : bgcolor;

      try {
        const drawCoreNodeShape = () => drawNodeShape.call(this, node, ctx, size, nextFgColor, nextBgColor, selected);
        const result = useCustomBody
          ? withNodeOutlineClip(ctx, node, size, litegraph, Boolean(this.low_quality), drawCoreNodeShape)
          : drawCoreNodeShape();
        if (!ctx || !node || !size) {
          return result;
        }

        drawNodeSurfaceChrome(
          ctx,
          node,
          size,
          litegraph,
          Boolean(this.low_quality),
          selected,
          fgcolor,
          bgcolor,
        );

        const outlineWidth = Number(runtime.active.node_outline_width || 0);
        if (outlineWidth > 0 && !isGlassSurfaceStyle(style)) {
          ctx.save();
          ctx.beginPath();
          buildNodeOutlinePath(ctx, node, size, litegraph, Boolean(this.low_quality));
          ctx.lineWidth = outlineWidth;
          ctx.strokeStyle = litegraph.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF";
          ctx.globalAlpha = this.editor_alpha ?? ctx.globalAlpha;
          ctx.stroke();
          ctx.restore();
        }
        return result;
      } finally {
        if (node) {
          if (applyForcedShape) {
            if (hadOwnShape) {
              node._shape = previousShape;
            } else {
              delete node._shape;
            }
          }

          if (previousThemeShape === undefined) {
            delete node.__themeLabRenderShape;
          } else {
            node.__themeLabRenderShape = previousThemeShape;
          }

          if (previousThemeShapeProfile === undefined) {
            delete node.__themeLabShapeProfile;
          } else {
            node.__themeLabShapeProfile = previousThemeShapeProfile;
          }

          if (previousStrokeStyles !== undefined) {
            node.strokeStyles = previousStrokeStyles;
          }
        }
      }
    };
    wrappedDrawNodeShape.__themeLabCanvasPatched = true;
    graphCanvas.prototype.drawNodeShape = wrappedDrawNodeShape;
  }

  const nodeProto = globalThis.LGraphNode?.prototype
    || globalThis.window?.LGraphNode?.prototype
    || (() => {
      const sampleNode = app?.graph?._nodes?.[0] || app?.graph?.nodes?.[0];
      let proto = sampleNode ? Object.getPrototypeOf(sampleNode) : null;
      while (proto && typeof proto.getConnectionPos !== "function" && typeof proto.getInputPos !== "function") {
        proto = Object.getPrototypeOf(proto);
      }
      return proto;
    })();

  const getConnectionPos = nodeProto?.getConnectionPos;
  if (typeof getConnectionPos === "function" && !getConnectionPos.__themeLabCanvasPatched) {
    const wrappedGetConnectionPos = function(isInput, slotIndex, out) {
      const result = getConnectionPos.apply(this, arguments);
      return applySlotBubbleOffset(result, this, Boolean(isInput));
    };
    wrappedGetConnectionPos.__themeLabCanvasPatched = true;
    nodeProto.getConnectionPos = wrappedGetConnectionPos;
  }

  const getInputPos = nodeProto?.getInputPos;
  if (typeof getInputPos === "function" && !getInputPos.__themeLabCanvasPatched) {
    const wrappedGetInputPos = function(slotIndex) {
      const result = getInputPos.apply(this, arguments);
      return applySlotBubbleOffset(result, this, true);
    };
    wrappedGetInputPos.__themeLabCanvasPatched = true;
    nodeProto.getInputPos = wrappedGetInputPos;
  }

  const getOutputPos = nodeProto?.getOutputPos;
  if (typeof getOutputPos === "function" && !getOutputPos.__themeLabCanvasPatched) {
    const wrappedGetOutputPos = function(slotIndex) {
      const result = getOutputPos.apply(this, arguments);
      return applySlotBubbleOffset(result, this, false);
    };
    wrappedGetOutputPos.__themeLabCanvasPatched = true;
    nodeProto.getOutputPos = wrappedGetOutputPos;
  }

  runtime.slotPatchesInstalled = ensureSlotDrawPatches(app);

  const drawNodeWidgets = graphCanvas.prototype?.drawNodeWidgets;
  if (typeof drawNodeWidgets === "function" && !drawNodeWidgets.__themeLabCanvasPatched) {
    const wrappedDrawNodeWidgets = function(node, posY, ctx) {
      if (!ctx) {
        return drawNodeWidgets.apply(this, arguments);
      }
      const originalLineWidth = ctx.lineWidth;
      ctx.lineWidth = Math.max(0.5, Number(runtime.active.widget_outline_width || 1));
      try {
        return drawNodeWidgets.apply(this, arguments);
      } finally {
        ctx.lineWidth = originalLineWidth;
      }
    };
    wrappedDrawNodeWidgets.__themeLabCanvasPatched = true;
    graphCanvas.prototype.drawNodeWidgets = wrappedDrawNodeWidgets;
  }

  const groupCtor = readGroupCtor(litegraph, app);
  const drawGroup = groupCtor?.prototype?.draw;
  if (typeof drawGroup === "function" && !drawGroup.__themeLabCanvasPatched) {
    const wrappedDrawGroup = function(graphCanvasInstance, ctx) {
      if (!ctx) {
        return drawGroup.apply(this, arguments);
      }
      const originalLineWidth = ctx.lineWidth;
      ctx.lineWidth = Math.max(0.5, Number(runtime.active.group_outline_width || 1));
      try {
        return drawGroup.apply(this, arguments);
      } finally {
        ctx.lineWidth = originalLineWidth;
      }
    };
    wrappedDrawGroup.__themeLabCanvasPatched = true;
    groupCtor.prototype.draw = wrappedDrawGroup;
  }

  runtime.installed = true;
  return true;
}

function refreshNodeGeometry(app) {
  const graph = app?.graph;
  if (!graph) {
    return;
  }

  try {
    const nodes = graph._nodes || graph.nodes || [];
    for (const node of nodes) {
      node?._setConcreteSlots?.();
      node?.arrange?.();
      const nextSize = node?.computeSize?.();
      if (Array.isArray(nextSize) && typeof node?.setSize === "function" && Array.isArray(node.size)) {
        node.setSize([
          Math.max(node.size[0] || 0, nextSize[0] || 0),
          Math.max(node.size[1] || 0, nextSize[1] || 0),
        ]);
      }
    }
  } catch {
    // Ignore graph layout refresh errors.
  }

  try {
    graph.setDirtyCanvas?.(true, true);
  } catch {
    // Ignore dirty flag failures.
  }

  try {
    app?.canvas?.draw?.(true, true);
  } catch {
    // Ignore direct draw failures.
  }
}

export function normalizeThemeLabCanvasConfig(input) {
  const source = input && typeof input === "object" ? input : {};
  const next = { ...THEME_LAB_CANVAS_DEFAULTS };

  for (const [key, fallback] of Object.entries(THEME_LAB_CANVAS_DEFAULTS)) {
    const field = FIELD_INDEX.get(key);
    if (field?.type === "boolean") {
      next[key] = normalizeBoolean(source[key], fallback);
      continue;
    }
    if (field?.type === "select") {
      next[key] = normalizeSelect(source[key], field, fallback);
      continue;
    }

    const parsed = toFiniteNumber(source[key], fallback);
    next[key] = clamp(parsed, field?.min, field?.max);
  }

  return next;
}

export function ensureThemeLabCanvasConfig(theme) {
  if (!theme || typeof theme !== "object") {
    return normalizeThemeLabCanvasConfig(null);
  }

  const themeLabRoot = theme.theme_lab && typeof theme.theme_lab === "object"
    ? theme.theme_lab
    : (theme.theme_lab = {});

  const mergedSource = {
    ...(theme.themeLab?.canvas || {}),
    ...(theme.canvas || {}),
    ...(themeLabRoot.canvas || {}),
  };

  themeLabRoot.canvas = normalizeThemeLabCanvasConfig(mergedSource);
  return themeLabRoot.canvas;
}

export function applyThemeLabCanvasConfig(themeLabConfig, { app } = {}) {
  const nextConfig = normalizeThemeLabCanvasConfig(themeLabConfig?.canvas || themeLabConfig);
  const previousConfig = runtime.active;
  applyVueNodeThemeBridge(nextConfig);
  ensureRuntimePatches(app);

  if (configsEqual(previousConfig, nextConfig)) {
    return previousConfig;
  }

  runtime.active = nextConfig;

  const litegraph = readLiteGraph();
  if (!litegraph) {
    return runtime.active;
  }

  litegraph.NODE_TITLE_HEIGHT = runtime.active.node_title_height;
  litegraph.NODE_TITLE_TEXT_Y = Math.max(14, Math.round(runtime.active.node_title_height * 0.66));
  litegraph.NODE_SLOT_HEIGHT = runtime.active.node_slot_height;
  litegraph.NODE_WIDGET_HEIGHT = runtime.active.node_widget_height;
  litegraph.ROUND_RADIUS = runtime.active.node_corner_radius;
  litegraph.NODE_DEFAULT_SHAPE = resolveThemeLabBaseShape(
    runtime.active.node_shape_profile,
    litegraph,
    litegraph.NODE_DEFAULT_SHAPE,
  );
  applyThemeLabShapeToGraph(app, litegraph, runtime.active);
  scheduleVueNodeClassSync(runtime.active);

  const rerouteCtor = readRerouteCtor(litegraph, app);
  if (rerouteCtor) {
    rerouteCtor.radius = runtime.active.reroute_dot_size;
    rerouteCtor.slotRadius = runtime.active.reroute_slot_size;
  }

  const canvas = app?.canvas;
  if (canvas) {
    canvas.connections_width = runtime.active.connection_width;
    canvas.links_render_mode = {
      spline: litegraph.SPLINE_LINK ?? 2,
      linear: litegraph.LINEAR_LINK ?? 1,
      straight: litegraph.STRAIGHT_LINK ?? 0,
    }[runtime.active.link_render_mode] ?? (litegraph.SPLINE_LINK ?? 2);
    canvas.linkMarkerShape = {
      none: 0,
      circle: 1,
      arrow: 2,
    }[runtime.active.link_marker_shape] ?? 1;
    canvas.render_connections_border = runtime.active.render_connection_borders;
    canvas.render_connections_shadows = runtime.active.render_connection_shadows;
    canvas.render_connection_arrows = runtime.active.render_connection_arrows;
  }

  if (keysChanged(previousConfig, runtime.active, GEOMETRY_KEYS)) {
    refreshNodeGeometry(app);
  } else {
    try {
      app?.graph?.setDirtyCanvas?.(true, true);
    } catch {
      // Ignore dirty flag failures.
    }

    if (keysChanged(previousConfig, runtime.active, REROUTE_KEYS)) {
      try {
        app?.canvas?.draw?.(true, true);
      } catch {
        // Ignore direct draw failures.
      }
    }
  }

  scheduleVueNodeClassSync(runtime.active);

  return runtime.active;
}
