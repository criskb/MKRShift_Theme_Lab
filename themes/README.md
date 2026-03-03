# Bundled Theme Assets

Use this folder to ship built-in themes with the addon.

- Add preset themes to `library.json` under the `themes` array.
- Put preview images in `previews/`.
- To bind a bundled image to a bundled theme, set:
  - `"preview": { "image_file": "previews/<file-name>.png" }`
  - or `"preview": { "image_file": "<file-name>.png" }` (auto-resolves to `previews/`).

If a theme has no preview image, Theme Lab uses a generated gradient preview.
