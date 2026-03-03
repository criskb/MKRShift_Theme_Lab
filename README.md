ComfyUI Theme Lab v2.0.0

Theme Lab ships with a rebuilt template-first Studio window instead of a full editor inside the sidebar tab.

What is included:
- Theme Lab Studio modal (left nav + large main workspace)
- Studio layout/classes aligned to Comfy Template Workflows dialog baseline (`90vw` / `83vh`, `w-80` side nav, template card grid)
- Modularized Studio architecture (`js/studio/template-studio.js`) for maintainable UI/page rendering
- Studio now opens through modern extension dialog API (`dialog.showExtensionDialog`) when available, with ComfyDialog fallback for compatibility
- Sidebar icon acts as direct Studio launcher
- Saved theme browser with Template-like grid/list layout toggle + card composition (`p-card` header/body/content structure)
- Full theme editor inside the Studio (Node Slot, LiteGraph, Comfy CSS, Advanced CSS)
- Active theme apply command and quick launchers (sidebar, bottom panel, menu/commands)
- Persistent storage in Comfy user data file: `themelab.themes.json`
- Backward migration from legacy `localStorage` single-theme format
- Bundled shipping folder for preset themes and preview images: `themes/library.json` + `themes/previews/`

Bundled presets:
- Theme Lab auto-loads `themes/library.json` and merges preset themes by `id`.
- Preset preview images can be referenced per theme with `preview.image_file`.
- If no preview image is set, cards fall back to generated gradients based on theme colors.

Comfy frontend APIs used:
- `settings`
- `commands`
- `keybindings`
- `menuCommands`
- `bottomPanelTabs`
- `aboutPageBadges`
- `registerSidebarTab`

Relevant docs:
- https://docs.comfy.org/custom-nodes/js/javascript_overview
- https://docs.comfy.org/custom-nodes/js/javascript_commands_keybindings
- https://docs.comfy.org/custom-nodes/js/javascript_sidebar_tabs
- https://docs.comfy.org/custom-nodes/js/javascript_bottom_panel_tabs
- https://docs.comfy.org/custom-nodes/js/javascript_dialog
