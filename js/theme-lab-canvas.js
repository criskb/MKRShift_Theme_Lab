const FIELD_INDEX = new Map();

export const THEME_LAB_CANVAS_DEFAULTS = Object.freeze({
  node_title_height: 30,
  node_slot_height: 20,
  node_widget_height: 20,
  node_corner_radius: 8,
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
  active: { ...THEME_LAB_CANVAS_DEFAULTS },
};

const GEOMETRY_KEYS = [
  "node_title_height",
  "node_slot_height",
  "node_widget_height",
  "node_corner_radius",
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

function buildNodeOutlinePath(ctx, node, size, litegraph, lowQuality) {
  const areaSource = Array.isArray(node?.boundingRect) || ArrayBuffer.isView(node?.boundingRect)
    ? node.boundingRect
    : [node?.pos?.[0] || 0, node?.pos?.[1] || 0, size?.[0] || 0, size?.[1] || 0];
  const pos = node?.pos || [0, 0];
  const area = [
    areaSource[0] - pos[0],
    areaSource[1] - pos[1],
    areaSource[2],
    areaSource[3],
  ];

  const shape = node?.renderingShape ?? node?._shape ?? litegraph?.BOX_SHAPE;
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
      shape === litegraph?.CARD_SHAPE ? [radius, radius, 0, 0] : [radius],
    );
    return;
  }
  if (shape === litegraph?.CIRCLE_SHAPE) {
    ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2);
    return;
  }
  ctx.rect(area[0], area[1], area[2], area[3]);
}

function ensureRuntimePatches(app) {
  if (runtime.installed) {
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
      const result = drawNodeShape.apply(this, arguments);
      const outlineWidth = Number(runtime.active.node_outline_width || 0);
      if (!(outlineWidth > 0) || !ctx || !node || !size) {
        return result;
      }

      ctx.save();
      ctx.beginPath();
      buildNodeOutlinePath(ctx, node, size, litegraph, Boolean(this.low_quality));
      ctx.lineWidth = outlineWidth;
      ctx.strokeStyle = litegraph.NODE_BOX_OUTLINE_COLOR || fgcolor || "#FFFFFF";
      ctx.globalAlpha = this.editor_alpha ?? ctx.globalAlpha;
      ctx.stroke();
      ctx.restore();
      return result;
    };
    wrappedDrawNodeShape.__themeLabCanvasPatched = true;
    graphCanvas.prototype.drawNodeShape = wrappedDrawNodeShape;
  }

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

  return runtime.active;
}
