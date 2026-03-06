function deriveExtensionApiBase() {
  try {
    const url = new URL(import.meta.url, globalThis.location?.href || "http://localhost/");
    const match = url.pathname.match(/\/extensions\/([^/]+)\//);
    if (match?.[1]) {
      return `/${match[1]}/api`;
    }
  } catch {
    // ignore
  }
  return "/MKRShift_Theme_Lab/api";
}

const EXTENSION_API_BASE = deriveExtensionApiBase();

function normalizeProvider(provider) {
  if (!provider || typeof provider !== "object" || !provider.id) {
    return null;
  }

  return {
    id: String(provider.id),
    title: String(provider.title || "Extension"),
    sections: provider.sections && typeof provider.sections === "object" ? provider.sections : {},
  };
}

export async function fetchScannedExtensionStyleProviders({ api, force = false } = {}) {
  const path = `${EXTENSION_API_BASE}/extension-style-providers${force ? "?refresh=1" : ""}`;

  try {
    const response = typeof api?.fetchApi === "function"
      ? await api.fetchApi(path, { cache: "no-store" })
      : await fetch(path, { cache: "no-store" });

    if (!response?.ok) {
      return [];
    }

    const payload = await response.json();
    const providers = Array.isArray(payload?.providers)
      ? payload.providers
      : Array.isArray(payload)
        ? payload
        : [];

    return providers.map(normalizeProvider).filter(Boolean);
  } catch {
    return [];
  }
}
