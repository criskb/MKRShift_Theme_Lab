const INTERNAL_PROVIDER_IDS = new Set([
  "themelab",
]);

const CORE_CATEGORY_ROOTS = new Set([
  "Comfy",
  "Comfy-Desktop",
  "Mask Editor",
  "3D",
  "Theme Lab",
]);

const VISUAL_CONTEXT_KEYWORDS = [
  "theme",
  "style",
  "appearance",
  "visual",
  "display",
  "layout",
  "ui",
  "canvas",
  "graph",
  "grid",
  "node",
  "widget",
  "panel",
  "editor",
  "connection",
  "link",
  "slot",
];

const VISUAL_VALUE_KEYWORDS = [
  "color",
  "colour",
  "css",
  "variable",
  "background",
  "foreground",
  "accent",
  "surface",
  "fill",
  "glow",
  "shadow",
  "box shadow",
  "drop shadow",
  "outline",
  "border",
  "stroke",
  "highlight",
  "opacity",
  "alpha",
  "contrast",
  "blur",
  "font",
  "typography",
  "text",
  "radius",
  "corner",
  "round",
  "padding",
  "margin",
  "spacing",
  "size",
  "width",
  "height",
  "line",
  "dot",
  "marker",
  "visibility",
  "icon",
  "image",
];

const VISUAL_TEXT_KEYWORDS = [
  "font",
  "theme",
  "style",
  "appearance",
  "css",
  "variable",
  "background",
  "foreground",
  "accent",
  "icon",
  "shadow",
  "surface",
];

function slugify(value, fallback = "provider") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function splitCamelCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return splitCamelCase(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueApis(apis) {
  return Array.from(new Set((apis || []).filter(Boolean)));
}

function readSettingLookup(settingApis) {
  for (const settingApi of uniqueApis(settingApis)) {
    const lookup = settingApi?.settingsLookup
      || settingApi?.settingsParamLookup
      || null;
    if (lookup && typeof lookup === "object") {
      return lookup;
    }
  }
  return null;
}

function readRegisteredExtensions(appInstance) {
  const raw = appInstance?.extensions;
  if (Array.isArray(raw)) {
    return raw;
  }
  if (Array.isArray(raw?.value)) {
    return raw.value;
  }
  return [];
}

function categorySegments(definition) {
  const raw = definition?.category;
  if (Array.isArray(raw)) {
    return raw.map((part) => String(part || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(/[\\/]/).map((part) => String(part || "").trim()).filter(Boolean);
  }
  return [];
}

function buildDefinitionSearchText(definition) {
  return [
    definition?.id,
    definition?.name,
    definition?.tooltip,
    ...categorySegments(definition),
  ]
    .map((value) => splitCamelCase(String(value || "")).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function hasKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isScalarValue(value) {
  return value == null || ["string", "number", "boolean"].includes(typeof value);
}

function isColorString(value) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(normalized)
    || /^rgba?\(/i.test(normalized)
    || /^hsla?\(/i.test(normalized);
}

function normalizeSettingType(definition, currentValue) {
  const type = String(definition?.type || "").toLowerCase();
  if (type === "boolean") {
    return "boolean";
  }
  if (type === "slider" || type === "number") {
    return "number";
  }
  if (type === "combo" || type === "select") {
    return "select";
  }
  if (type === "color") {
    return "color";
  }

  if (isColorString(currentValue)) {
    return "color";
  }

  return "text";
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => {
    if (option && typeof option === "object") {
      return {
        value: String(option.value ?? option.text ?? ""),
        label: String(option.text ?? option.label ?? option.value ?? ""),
      };
    }

    return {
      value: String(option ?? ""),
      label: String(option ?? ""),
    };
  }).filter((option) => option.value);
}

function getSettingValue(settingApis, id) {
  for (const settingApi of uniqueApis(settingApis)) {
    if (typeof settingApi?.get === "function") {
      const current = settingApi.get(id);
      if (current !== undefined) {
        return current;
      }
    }

    if (typeof settingApi?.getSettingValue === "function") {
      const current = settingApi.getSettingValue(id);
      if (current !== undefined) {
        return current;
      }
    }
  }

  return undefined;
}

function resolveLiveValue(definition, settingApis) {
  const id = definition?.id;
  if (id) {
    const current = getSettingValue(settingApis, id);
    if (current !== undefined) {
      return current;
    }
  }
  return definition?.defaultValue;
}

function isThemeableDefinition(definition, settingApis) {
  const currentValue = resolveLiveValue(definition, settingApis);
  const type = normalizeSettingType(definition, currentValue);

  if (!isScalarValue(currentValue) && currentValue !== undefined) {
    return false;
  }

  if (type === "color") {
    return true;
  }

  const searchText = buildDefinitionSearchText(definition);
  if (!searchText) {
    return false;
  }

  const hasContext = hasKeyword(searchText, VISUAL_CONTEXT_KEYWORDS);
  const hasValue = hasKeyword(searchText, VISUAL_VALUE_KEYWORDS);

  if (hasValue) {
    return true;
  }

  if (type === "text") {
    return hasKeyword(searchText, VISUAL_TEXT_KEYWORDS);
  }

  return hasContext;
}

function buildUniqueKey(id, usedKeys) {
  const suffix = String(id || "").split(".").pop() || "";
  const base = suffix ? `${suffix.slice(0, 1).toLowerCase()}${suffix.slice(1)}` : slugify(id, "setting");
  if (!usedKeys.has(base)) {
    usedKeys.add(base);
    return base;
  }

  const fallback = slugify(String(id || "").replace(/\./g, "-"), "setting");
  if (!usedKeys.has(fallback)) {
    usedKeys.add(fallback);
    return fallback;
  }

  let index = 2;
  while (usedKeys.has(`${fallback}-${index}`)) {
    index += 1;
  }
  const unique = `${fallback}-${index}`;
  usedKeys.add(unique);
  return unique;
}

function buildProviderItem(definition, settingApis, usedKeys) {
  const settingId = String(definition?.id || "").trim();
  if (!settingId) {
    return null;
  }

  const currentValue = resolveLiveValue(definition, settingApis);
  const type = normalizeSettingType(definition, currentValue);
  if (!isScalarValue(currentValue) && currentValue !== undefined) {
    return null;
  }

  const item = {
    key: buildUniqueKey(settingId, usedKeys),
    label: String(definition?.name || titleCase(settingId.split(".").pop() || settingId)),
    type,
    default: currentValue,
    settingId,
  };

  if (type === "number") {
    item.min = definition?.attrs?.min;
    item.max = definition?.attrs?.max;
    item.step = definition?.attrs?.step;
  }

  if (type === "select") {
    item.options = normalizeOptions(definition?.options);
  }

  return item;
}

function collectCategoryRoots(definitions) {
  const counts = new Map();
  for (const definition of definitions || []) {
    const root = categorySegments(definition)[0];
    if (!root) {
      continue;
    }
    counts.set(root, (counts.get(root) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
}

function deriveProviderTitle(extension, definitions) {
  const roots = collectCategoryRoots(definitions);
  const preferredRoot = roots.find(([root]) => !CORE_CATEGORY_ROOTS.has(root))?.[0];
  if (preferredRoot) {
    return preferredRoot;
  }

  const extensionName = String(extension?.name || "").trim();
  if (extensionName) {
    return titleCase(extensionName.split(".").pop() || extensionName);
  }

  return "Extension";
}

function shouldSkipExtension(extension, definitions) {
  const extensionName = String(extension?.name || "").trim();
  const extensionId = slugify(extensionName, "");
  if (!definitions.length || INTERNAL_PROVIDER_IDS.has(extensionId)) {
    return true;
  }

  const roots = collectCategoryRoots(definitions).map(([root]) => root);
  return roots.length > 0 && roots.every((root) => CORE_CATEGORY_ROOTS.has(root));
}

function buildSectionName(definition) {
  const parts = categorySegments(definition).slice(1);
  return parts.length ? parts.join(" / ") : "General";
}

function buildProviderFromDefinitions({ id, title, definitions, settingApis }) {
  const sections = {};
  const usedKeys = new Set();

  for (const definition of definitions) {
    const item = buildProviderItem(definition, settingApis, usedKeys);
    if (!item) {
      continue;
    }

    const sectionName = buildSectionName(definition);
    (sections[sectionName] ||= []).push(item);
  }

  if (!Object.keys(sections).length) {
    return null;
  }

  const orderedSections = Object.fromEntries(
    Object.entries(sections)
      .map(([sectionName, items]) => [
        sectionName,
        [...items].sort((left, right) => String(left.label || "").localeCompare(String(right.label || ""))),
      ])
      .sort(([left], [right]) => {
        if (left === "General") {
          return -1;
        }
        if (right === "General") {
          return 1;
        }
        return String(left).localeCompare(String(right));
      }),
  );

  return { id, title, sections: orderedSections };
}

function buildProvidersFromRegisteredExtensions(appInstance, settingApis, claimedSettingIds) {
  const providers = [];

  for (const extension of readRegisteredExtensions(appInstance)) {
    const definitions = Array.isArray(extension?.settings)
      ? extension.settings.filter((definition) => definition?.id && isThemeableDefinition(definition, settingApis))
      : [];

    if (shouldSkipExtension(extension, definitions)) {
      continue;
    }

    for (const definition of definitions) {
      claimedSettingIds.add(definition.id);
    }

    const title = deriveProviderTitle(extension, definitions);
    const provider = buildProviderFromDefinitions({
      id: `extension-${slugify(title, "extension")}`,
      title,
      definitions,
      settingApis,
    });

    if (provider) {
      providers.push(provider);
    }
  }

  return providers;
}

function shouldIncludeFallbackDefinition(definition, claimedSettingIds) {
  const id = String(definition?.id || "").trim();
  if (!id || claimedSettingIds.has(id)) {
    return false;
  }

  const root = categorySegments(definition)[0];
  if (root && CORE_CATEGORY_ROOTS.has(root)) {
    return false;
  }

  return Boolean(root || id.includes("."));
}

function fallbackProviderIdentity(definition) {
  const segments = categorySegments(definition);
  const root = segments[0];
  if (root) {
    return {
      id: `extension-${slugify(root, "extension")}`,
      title: titleCase(root),
    };
  }

  const id = String(definition?.id || "");
  const prefix = id.split(".")[0] || id;
  return {
    id: `extension-${slugify(prefix, "extension")}`,
    title: titleCase(prefix),
  };
}

function buildFallbackProviders(settingApis, claimedSettingIds) {
  const lookup = readSettingLookup(settingApis);
  if (!lookup || typeof lookup !== "object") {
    return [];
  }

  const groups = new Map();
  for (const definition of Object.values(lookup)) {
    if (!shouldIncludeFallbackDefinition(definition, claimedSettingIds)) {
      continue;
    }
    if (!isThemeableDefinition(definition, settingApis)) {
      continue;
    }

    const identity = fallbackProviderIdentity(definition);
    if (!groups.has(identity.id)) {
      groups.set(identity.id, { id: identity.id, title: identity.title, definitions: [] });
    }
    groups.get(identity.id).definitions.push(definition);
  }

  return Array.from(groups.values())
    .map((group) => buildProviderFromDefinitions({
      id: group.id,
      title: group.title,
      definitions: group.definitions,
      settingApis,
    }))
    .filter(Boolean);
}

export function buildRegisteredExtensionProviders({ app, settingApis = [] }) {
  const claimedSettingIds = new Set();
  const apis = uniqueApis([
    ...settingApis,
    app?.ui?.settings,
  ]);
  const providers = [
    ...buildProvidersFromRegisteredExtensions(app, apis, claimedSettingIds),
    ...buildFallbackProviders(apis, claimedSettingIds),
  ];

  const merged = new Map();
  for (const provider of providers) {
    if (!provider?.id) {
      continue;
    }

    const canonicalId = `extension-${slugify(provider.title || provider.id, "extension")}`;

    if (!merged.has(canonicalId)) {
      merged.set(canonicalId, {
        id: canonicalId,
        title: provider.title,
        sections: {},
      });
    }

    const target = merged.get(canonicalId);
    if (!target.title && provider.title) {
      target.title = provider.title;
    }

    for (const [sectionName, items] of Object.entries(provider.sections || {})) {
      const sectionItems = (target.sections[sectionName] ||= []);
      const seenSettingIds = new Set(sectionItems.map((item) => String(item?.settingId || item?.key || "")));

      for (const item of items || []) {
        const uniqueKey = String(item?.settingId || item?.key || "");
        if (seenSettingIds.has(uniqueKey)) {
          continue;
        }
        seenSettingIds.add(uniqueKey);
        sectionItems.push(item);
      }

      sectionItems.sort((left, right) => String(left?.label || "").localeCompare(String(right?.label || "")));
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => String(left.title || "").localeCompare(String(right.title || "")));
}
