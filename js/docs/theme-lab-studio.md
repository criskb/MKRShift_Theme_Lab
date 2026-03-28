# Theme Lab Studio

Theme Lab is a frontend-only ComfyUI extension for browsing, editing, previewing, and applying themes without leaving the canvas.

## Studio Pages

### Saved Themes

- Browse bundled and user themes in grid or list mode.
- Search by theme name or description.
- Preview local thumbnails or generated gradient covers.

### Theme Editor

- Edit core ComfyUI palette colors.
- Tune LiteGraph canvas colors and geometry.
- Mix built-in node base shapes like box, round, and card with Theme Lab node modes.
- Switch between bundled node modes such as soft cards, media cards, glass panels, liquid glass, floating tabs, mono slab, and minimal wire treatments.
- Adjust typography, UI density, and Theme Lab-specific CSS variables.
- Save extension styling overrides for discovered custom-node settings and CSS variables.

### About

- Explains where Theme Lab stores user themes and how it exports the active ComfyUI palette.

## Apply Flow

When you click `Apply`, Theme Lab:

1. Writes the selected theme into ComfyUI's `themes/Theme Lab.json`.
2. Refreshes the active runtime palette where the frontend allows it.
3. Keeps Theme Lab-only metadata such as descriptions, preview images, and extension styling in the Theme Lab user library.

## Extension Styling Safety

Theme Lab can surface visual controls discovered from:

- loaded extension settings
- scanned CSS variables in installed custom node frontend files

Some third-party extensions cache their UI aggressively. If an extension does not visibly update after styling changes, use the Theme Lab reload action or refresh the canvas/browser.

## Node Modes

Node modes restyle the default ComfyUI node renderer. They can make nodes feel softer, flatter, more preview-driven, or semi-transparent and glassy, but they do not replace ComfyUI with a completely custom node-card system. Fully bespoke layouts like reference moodboards usually need a dedicated node renderer or node-specific frontend components.
