const FANCY_GRID_BRIDGE_KEY = "__MKRSHIFT_FANCY_GRID__";
export const FANCY_GRID_PROVIDER_ID = "fancy-grid";

const FANCY_GRID_DEFAULTS = Object.freeze({
  enabled: true,
  spacing: 30,
  radius: 220,
  strength: 0.2,
  connectionInfluence: 0.2,
  nodeVisualFalloff: "soft",
  gridVisibility: 1,
  spring: 0.15,
  damping: 0.8,
  dotRadius: 1.4,
  dotAlpha: 0.84,
  dotColor: "#FFFFFF",
  lineAlpha: 0.075,
  lineWidth: 1,
  lineColor: "#AAB6D6",
  linkGlow: 1,
  nodeGlow: 1,
  highlightColor: "#38A8FF",
  accentColor: "#FFFFFF",
  backgroundColorTop: "#0F141B",
  backgroundColorBottom: "#090D12",
  backgroundGlowColor: "#122438",
  backgroundAlpha: 0.22,
  nodePadding: 14,
  nodeCornerRadius: 20,
  performanceMode: "balanced",
});

const FANCY_GRID_SECTIONS = Object.freeze({
  General: Object.freeze([
    { key: "enabled", label: "Enabled", type: "boolean" },
    {
      key: "performanceMode",
      label: "Performance Mode",
      type: "select",
      options: [
        { value: "eco", label: "Eco" },
        { value: "balanced", label: "Balanced" },
        { value: "quality", label: "Quality" },
      ],
    },
  ]),
  Field: Object.freeze([
    { key: "spacing", label: "Grid Spacing", type: "number", min: 18, max: 42, step: 1 },
    { key: "radius", label: "Influence Radius", type: "number", min: 120, max: 320, step: 2 },
    { key: "strength", label: "Node Influence", type: "number", min: 0, max: 0.4, step: 0.01 },
    { key: "connectionInfluence", label: "Connection Influence", type: "number", min: 0, max: 0.5, step: 0.01 },
    { key: "spring", label: "Springiness", type: "number", min: 0.05, max: 0.3, step: 0.01 },
    { key: "damping", label: "Damping", type: "number", min: 0.65, max: 0.92, step: 0.01 },
  ]),
  Look: Object.freeze([
    {
      key: "nodeVisualFalloff",
      label: "Node Visual Falloff",
      type: "select",
      options: [
        { value: "soft", label: "Soft" },
        { value: "edge", label: "Edge Fade" },
      ],
    },
    { key: "gridVisibility", label: "Grid Visibility", type: "number", min: 0, max: 1, step: 0.01 },
    { key: "linkGlow", label: "Connection Glow", type: "number", min: 0, max: 2, step: 0.05 },
    { key: "nodeGlow", label: "Node Glow", type: "number", min: 0, max: 2, step: 0.05 },
    { key: "dotRadius", label: "Dot Radius", type: "number", min: 0.5, max: 4, step: 0.1 },
    { key: "dotAlpha", label: "Dot Brightness", type: "number", min: 0.15, max: 1, step: 0.01 },
    { key: "lineWidth", label: "Line Width", type: "number", min: 0.25, max: 3, step: 0.05 },
    { key: "lineAlpha", label: "Line Brightness", type: "number", min: 0.02, max: 0.25, step: 0.005 },
    { key: "nodePadding", label: "Node Padding", type: "number", min: 0, max: 32, step: 1 },
    { key: "nodeCornerRadius", label: "Node Corner Radius", type: "number", min: 0, max: 36, step: 1 },
  ]),
  Colors: Object.freeze([
    { key: "dotColor", label: "Dot Color", type: "color" },
    { key: "lineColor", label: "Line Color", type: "color" },
    { key: "highlightColor", label: "Highlight Color", type: "color" },
    { key: "accentColor", label: "Accent Color", type: "color" },
    { key: "backgroundColorTop", label: "Background Top", type: "color" },
    { key: "backgroundColorBottom", label: "Background Bottom", type: "color" },
    { key: "backgroundGlowColor", label: "Background Glow", type: "color" },
    { key: "backgroundAlpha", label: "Background Alpha", type: "number", min: 0, max: 1, step: 0.01 },
  ]),
});

function getFancyGridBridge() {
  return globalThis[FANCY_GRID_BRIDGE_KEY] || null;
}

function normalizeFancyGridDefaults(input = {}) {
  return {
    ...FANCY_GRID_DEFAULTS,
    ...(input && typeof input === "object" ? input : {}),
  };
}

function buildSectionDefaults(defaults, items) {
  return items.map((item) => ({
    ...item,
    default: defaults[item.key] ?? item.default,
  }));
}

export function isFancyGridAvailable() {
  const bridge = getFancyGridBridge();
  return Boolean(bridge && typeof bridge.setTheme === "function" && typeof bridge.clearTheme === "function");
}

export function buildFancyGridProvider() {
  if (!isFancyGridAvailable()) {
    return null;
  }

  const bridge = getFancyGridBridge();
  const defaults = normalizeFancyGridDefaults(bridge?.getDefaults?.());

  return {
    id: FANCY_GRID_PROVIDER_ID,
    title: "Fancy Grid",
    sections: Object.fromEntries(
      Object.entries(FANCY_GRID_SECTIONS).map(([sectionName, items]) => [
        sectionName,
        buildSectionDefaults(defaults, items),
      ]),
    ),
  };
}

export function applyFancyGridTheme(valueMap) {
  const bridge = getFancyGridBridge();
  if (!bridge?.setTheme) {
    return false;
  }

  bridge.setTheme(valueMap && typeof valueMap === "object" ? valueMap : {});
  return true;
}

export function clearFancyGridTheme() {
  const bridge = getFancyGridBridge();
  if (!bridge?.clearTheme) {
    return false;
  }

  bridge.clearTheme();
  return true;
}
