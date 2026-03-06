const STUDIO_DIALOG_KEY = "theme-lab-studio";
const LAYOUT_STORAGE_KEY = "Comfy.ThemeLab.Layout";

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function themePreviewGradient(theme) {
  const comfy = theme.colors?.comfy_base || {};
  const bg = comfy["bg-color"] || comfy["base-background"] || "#1f1f24";
  const panel = comfy["comfy-menu-bg"] || comfy["secondary-background"] || "#32353f";
  const accentA = comfy["primary-background"] || theme.colors?.node_slot?.IMAGE || "#64B5F6";
  const accentB = comfy["accent-primary"] || theme.colors?.node_slot?.LATENT || "#FF9CF9";
  return `linear-gradient(135deg, ${bg} 0%, ${panel} 45%, ${accentA} 72%, ${accentB} 100%)`;
}

function getThemeDescription(record) {
  return String(record?.data?.description || "").trim();
}

function readLayout() {
  try {
    const value = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return value === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function writeLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Ignore storage failures.
  }
}

function icon(className, extraClass = "") {
  const el = document.createElement("i");
  el.className = `${className}${extraClass ? ` ${extraClass}` : ""}`;
  return el;
}

export class ThemeLabTemplateStudio {
  constructor(options) {
    this.options = options;

    this.page = "themes";
    this.search = "";
    this.layout = readLayout();

    this.root = null;
    this.main = null;
    this.filterSlot = null;
    this.headerLeft = null;
    this.headerRight = null;
    this.searchInput = null;
    this.countLabel = null;
    this.navButtons = new Map();
    this.livePreviewFrame = 0;
    this.livePreviewTheme = null;
    this.livePreviewApplyExtensionSettings = false;

    this.isOpen = false;
    this.usesExtensionDialog = false;
    this.extensionDialogController = null;
    this.extensionComponent = null;
    this.extensionHeaderComponent = null;
    this.extensionHost = null;
    this.nativeOverlay = null;
    this.nativeOverlayPanel = null;
    this.nativeFallbackNotified = false;
    this.nativeOverlayKeyHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    };

    this.fallbackDialog = new this.options.ComfyDialog();
    if (this.fallbackDialog?.element) {
      this.fallbackDialog.element.classList.add("tl-studio-shell");
      this.fallbackDialog.element.dataset.themelabDialog = "legacy";
    }
  }

  async ensureExtensionDialogComponents() {
    if (this.extensionComponent && this.extensionHeaderComponent) {
      return true;
    }

    const vue = await this.options.getVueRuntime();
    if (!vue) {
      return false;
    }

    const { defineComponent, h, ref, onMounted, onBeforeUnmount } = vue;
    const studio = this;

    this.extensionHeaderComponent = defineComponent({
      name: "ThemeLabStudioDialogHeader",
      setup() {
        return () => h("div", null, [h("h3", { class: "px-4" }, [h("span", null, "Theme Lab Studio")])]);
      },
    });

    this.extensionComponent = defineComponent({
      name: "ThemeLabStudioDialogContent",
      setup() {
        const host = ref(null);

        onMounted(() => {
          studio.attachToHost(host.value);
        });

        onBeforeUnmount(() => {
          studio.detachFromHost(host.value);
          studio.isOpen = false;
          studio.usesExtensionDialog = false;
          studio.extensionDialogController = null;
        });

        return () => h("div", { class: "h-full w-full", ref: host });
      },
    });

    return true;
  }

  attachToHost(hostEl) {
    if (!hostEl) {
      return;
    }

    this.ensureShell();
    this.renderMain();
    hostEl.replaceChildren(this.root);
    this.extensionHost = hostEl;

    if (this.page === "themes") {
      queueMicrotask(() => this.searchInput?.focus());
    }
  }

  detachFromHost(hostEl) {
    if (!hostEl || !this.root) {
      return;
    }

    this.clearQueuedLivePreview();

    if (this.root.parentElement === hostEl) {
      hostEl.removeChild(this.root);
    }

    this.extensionHost = null;
  }

  makeNavButton(id, label, iconClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tl-nav-item";
    button.append(icon(iconClass, "tl-nav-icon"), document.createTextNode(label));
    button.onclick = () => {
      this.page = id;
      this.renderMain();
    };
    this.navButtons.set(id, button);
    return button;
  }

  ensureShell() {
    if (this.root) {
      return;
    }

    this.root = document.createElement("div");
    this.root.className =
      "tl-studio-root rounded-2xl overflow-hidden relative h-[80vh] w-[90vw] max-w-[1400px]";
    this.root.dataset.testid = "theme-lab-studio-content";

    const grid = document.createElement("div");
    grid.className = "grid h-full w-full transition-[grid-template-columns] duration-300 ease-out";
    grid.style.gridTemplateColumns = "14rem 1fr";

    const nav = document.createElement("aside");
    nav.className = "h-full overflow-hidden bg-modal-panel-background flex flex-col";

    const navHeader = document.createElement("header");
    navHeader.className = "flex w-full h-18 shrink-0 gap-2 pl-6 pr-3 items-center-safe";
    const navTitleIcon = icon("icon-[lucide--palette]", "text-muted");
    const navTitle = document.createElement("h2");
    navTitle.className = "text-neutral text-base m-0";
    navTitle.textContent = "Theme Lab";
    navHeader.append(navTitleIcon, navTitle);

    const navList = document.createElement("div");
    navList.className =
      "flex w-full flex-auto overflow-y-auto gap-1 min-h-0 flex-col bg-modal-panel-background scrollbar-hide px-3 pb-3";

    navList.append(
      this.makeNavButton("themes", "Saved Themes", "icon-[lucide--layout-grid]"),
      this.makeNavButton("editor", "Theme Editor", "icon-[lucide--palette]"),
      this.makeNavButton("about", "About", "icon-[lucide--info]"),
    );

    this.countLabel = document.createElement("div");
    this.countLabel.className = "tl-nav-meta";
    navList.appendChild(this.countLabel);

    nav.append(navHeader, navList);

    const contentWrap = document.createElement("div");
    contentWrap.className = "flex flex-col bg-base-background overflow-hidden min-w-0";

    const header = document.createElement("header");
    header.className = "w-full h-18 px-6 flex items-center justify-between gap-2";

    this.headerLeft = document.createElement("div");
    this.headerLeft.className = "flex flex-1 shrink-0 gap-2 min-w-0";

    this.headerRight = document.createElement("div");
    this.headerRight.className = "flex items-center gap-2 shrink-0";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "tl-icon-btn";
    closeButton.setAttribute("aria-label", "Close dialog");
    closeButton.appendChild(icon("pi pi-times"));
    closeButton.onclick = () => this.close();

    header.append(this.headerLeft, this.headerRight, closeButton);

    const body = document.createElement("main");
    body.className = "flex min-h-0 flex-1 flex-col";

    this.filterSlot = document.createElement("div");
    this.filterSlot.className = "tl-filter-slot";

    this.main = document.createElement("div");
    this.main.className = "min-h-0 flex-1 px-6 pt-0 pb-10 overflow-y-auto scrollbar-custom";

    body.append(this.filterSlot, this.main);
    contentWrap.append(header, body);

    grid.append(nav, contentWrap);
    this.root.appendChild(grid);
  }

  async open(page = "themes") {
    this.page = page;
    this.ensureShell();
    this.renderMain();
    this.isOpen = true;

    const dialogService = this.options.getManager()?.dialog;

    if (typeof dialogService?.showLayoutDialog === "function") {
      const hasComponents = await this.ensureExtensionDialogComponents();
      if (hasComponents) {
        const dialog = dialogService.showLayoutDialog({
          key: STUDIO_DIALOG_KEY,
          component: this.extensionComponent,
          props: {},
          dialogComponentProps: {
            modal: true,
            dismissableMask: true,
            closable: true,
            pt: {
              root: { class: "tl-layout-dialog-root" },
              content: { class: "p-0! m-0! overflow-hidden" },
            },
          },
        });

        if (dialog) {
          this.usesExtensionDialog = true;
          this.extensionDialogController = { dialog };
          this.patchDialogMask();
          if (this.page === "themes") {
            queueMicrotask(() => this.searchInput?.focus());
          }
          return;
        }
      }
    }

    if (typeof dialogService?.showExtensionDialog === "function") {
      const hasComponents = await this.ensureExtensionDialogComponents();
      if (hasComponents) {
        const controller = dialogService.showExtensionDialog({
          key: STUDIO_DIALOG_KEY,
          title: "Theme Lab Studio",
          component: this.extensionComponent,
          headerComponent: this.extensionHeaderComponent,
          dialogComponentProps: {
            modal: true,
            dismissableMask: true,
            closable: true,
            pt: {
              root: { class: "tl-extension-dialog-root" },
              content: { class: "p-0! m-0! overflow-hidden" },
            },
          },
        });

        if (controller?.dialog) {
          this.usesExtensionDialog = true;
          this.extensionDialogController = controller;
          this.patchDialogMask();
          if (this.page === "themes") {
            queueMicrotask(() => this.searchInput?.focus());
          }
          return;
        }
      }
    }

    this.usesExtensionDialog = false;
    this.extensionDialogController = null;
    if (!this.nativeFallbackNotified) {
      this.nativeFallbackNotified = true;
      this.options.showToast({
        severity: "warn",
        summary: "Theme Lab",
        detail: "Using compatibility overlay because frontend dialog component mount is unavailable.",
      });
    }
    this.openNativeOverlay();
  }

  patchDialogMask() {
    const applyMaskStyle = () => {
      const roots = Array.from(document.querySelectorAll(".tl-layout-dialog-root, .tl-extension-dialog-root"));
      for (const root of roots) {
        const panel = root.classList?.contains("p-dialog") ? root : root.closest(".p-dialog");
        if (!panel) {
          continue;
        }

        const mask = panel.closest(".p-dialog-mask");
        if (mask) {
          mask.style.background = "rgba(0, 0, 0, 0.68)";
          mask.style.position = "fixed";
          mask.style.inset = "0";
          mask.style.width = "100vw";
          mask.style.height = "100vh";
          mask.style.zIndex = "10020";
          mask.style.backdropFilter = "none";
          mask.style.webkitBackdropFilter = "none";
        }

        panel.style.boxShadow = "none";
        panel.style.filter = "none";
        panel.style.backdropFilter = "none";
        panel.style.webkitBackdropFilter = "none";
        panel.style.border = "none";
        panel.style.outline = "none";
        panel.style.background = "transparent";

        const content = panel.querySelector(".p-dialog-content");
        if (content) {
          content.style.background = "transparent";
          content.style.boxShadow = "none";
          content.style.filter = "none";
          content.style.backdropFilter = "none";
          content.style.webkitBackdropFilter = "none";
        }
      }
    };

    applyMaskStyle();
    requestAnimationFrame(applyMaskStyle);
    setTimeout(applyMaskStyle, 0);
  }

  close() {
    this.isOpen = false;

    if (this.usesExtensionDialog && this.extensionDialogController?.dialog) {
      this.extensionDialogController.dialog.visible = false;
      return;
    }

    if (this.closeNativeOverlay()) {
      return;
    }

    this.fallbackDialog.close();
  }

  openNativeOverlay() {
    this.closeNativeOverlay();
    this.ensureShell();
    this.renderMain();

    const overlay = document.createElement("div");
    overlay.className = "tl-native-mask";
    overlay.dataset.themelabDialog = "native";

    const panel = document.createElement("div");
    panel.className = "tl-native-panel";
    panel.appendChild(this.root);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        this.close();
      }
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", this.nativeOverlayKeyHandler, true);

    this.nativeOverlay = overlay;
    this.nativeOverlayPanel = panel;

    if (this.page === "themes") {
      queueMicrotask(() => this.searchInput?.focus());
    }
  }

  closeNativeOverlay() {
    if (!this.nativeOverlay) {
      return false;
    }

    this.clearQueuedLivePreview();
    document.removeEventListener("keydown", this.nativeOverlayKeyHandler, true);
    if (this.root?.parentElement === this.nativeOverlayPanel) {
      this.nativeOverlayPanel.removeChild(this.root);
    }
    this.nativeOverlay.remove();
    this.nativeOverlay = null;
    this.nativeOverlayPanel = null;
    return true;
  }

  refresh() {
    if (this.isOpen) {
      this.clearQueuedLivePreview();
      this.renderMain();
    }
  }

  clearQueuedLivePreview() {
    if (this.livePreviewFrame) {
      cancelAnimationFrame(this.livePreviewFrame);
      this.livePreviewFrame = 0;
    }
    this.livePreviewTheme = null;
    this.livePreviewApplyExtensionSettings = false;
  }

  queueLivePreview(theme, { applyExtensionSettings = false } = {}) {
    this.livePreviewTheme = theme;
    this.livePreviewApplyExtensionSettings ||= Boolean(applyExtensionSettings);
    if (this.livePreviewFrame) {
      return;
    }

    this.livePreviewFrame = requestAnimationFrame(() => {
      this.livePreviewFrame = 0;
      const nextTheme = this.livePreviewTheme;
      const applyExtensionSettingsNow = this.livePreviewApplyExtensionSettings;
      this.livePreviewTheme = null;
      this.livePreviewApplyExtensionSettings = false;
      if (nextTheme && this.options.isLivePreviewEnabled()) {
        this.options.applyTheme(nextTheme, { applyExtensionSettings: applyExtensionSettingsNow });
      }
    });
  }

  resetChrome() {
    this.searchInput = null;
    this.headerLeft?.replaceChildren();
    this.headerRight?.replaceChildren();
    this.filterSlot?.replaceChildren();
  }

  renderMain() {
    if (!this.main) {
      return;
    }

    this.clearQueuedLivePreview();
    this.resetChrome();
    this.main.replaceChildren();
    this.main.classList.toggle("tl-main-about", this.page === "about");

    for (const [id, button] of this.navButtons.entries()) {
      button.classList.toggle("is-active", id === this.page);
    }

    if (this.countLabel) {
      const count = this.options.getThemeRecords().length;
      this.countLabel.textContent = `${count} saved theme${count === 1 ? "" : "s"}`;
    }

    if (this.page === "themes") {
      this.renderThemesPage();
      return;
    }

    if (this.page === "editor") {
      this.renderEditorPage();
      return;
    }

    this.renderAboutPage();
  }

  makeButton(label, onclick, className = "tl-btn") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.onclick = onclick;
    return button;
  }

  makeSearchBox({ value = "", placeholder = "Search...", onInput }) {
    const wrap = document.createElement("label");
    wrap.className = "tl-searchbox";

    const iconEl = icon("pi pi-search", "tl-searchbox-icon");

    const input = document.createElement("input");
    input.type = "search";
    input.className = "tl-searchbox-input";
    input.placeholder = placeholder;
    input.value = value;
    input.addEventListener("input", onInput);

    wrap.append(iconEl, input);
    return { wrap, input };
  }

  makeLayoutToggle() {
    const wrap = document.createElement("div");
    wrap.className = "tl-layout-toggle";

    const gridButton = this.makeButton("Grid", () => this.setLayout("grid"), "tl-toggle-btn");
    const listButton = this.makeButton("List", () => this.setLayout("list"), "tl-toggle-btn");

    gridButton.classList.toggle("is-active", this.layout === "grid");
    listButton.classList.toggle("is-active", this.layout === "list");

    wrap.append(gridButton, listButton);
    return wrap;
  }

  setLayout(layout) {
    this.layout = layout === "list" ? "list" : "grid";
    writeLayout(this.layout);
    this.renderMain();
  }

  renderThemesPage() {
    const records = [...this.options.getThemeRecords()]
      .sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf())
      .filter((record) => {
        if (!this.search) {
          return true;
        }
        const name = String(record.name || "").toLowerCase();
        const description = getThemeDescription(record).toLowerCase();
        return name.includes(this.search) || description.includes(this.search);
      });

    const { wrap: searchWrap, input } = this.makeSearchBox({
      value: this.search,
      placeholder: "Search themes...",
      onInput: () => {
        this.search = input.value.trim().toLowerCase();
        this.renderMain();
      },
    });
    this.searchInput = input;
    this.headerLeft.appendChild(searchWrap);

    this.headerRight.append(
      this.makeButton("Apply Active", async () => {
        const active = this.options.getActiveThemeRecord();
        this.options.setActiveThemeId(active.id, { apply: false });
        if (typeof this.options.applyThemeAndPersist === "function") {
          await this.options.applyThemeAndPersist(active);
        } else {
          this.options.applyTheme(active.data, { applyExtensionSettings: true });
          this.options.showToast({
            severity: "success",
            summary: "Theme Lab",
            detail: `Applied ${active.name}.`,
          });
        }
        this.renderMain();
      }),
      this.makeButton("Edit Active", () => {
        this.page = "editor";
        this.renderMain();
      }),
    );

    const filterRow = document.createElement("div");
    filterRow.className = "tl-filter-row";

    const filterLeft = document.createElement("div");
    filterLeft.className = "tl-filter-left";

    filterLeft.append(
      this.makeLayoutToggle(),
      this.makeButton("New", () => {
        this.options.createTheme({ baseTheme: this.options.clone(this.options.defaultTheme), name: "New Theme" });
        this.page = "editor";
        this.renderMain();
        this.options.showToast({ severity: "success", summary: "Theme Lab", detail: "Created a new theme." });
      }, "tl-btn tl-btn-secondary"),
      this.makeButton("Import", async () => {
        const count = await this.options.importThemesFromFilePicker();
        if (count > 0) {
          this.renderMain();
          if (this.options.isLivePreviewEnabled()) {
            this.options.applyTheme(this.options.getActiveTheme(), { applyExtensionSettings: true });
          }
        }
      }, "tl-btn tl-btn-secondary"),
      this.makeButton("Export Library", () => {
        this.options.exportThemeLibrary();
      }, "tl-btn tl-btn-secondary"),
    );

    filterRow.appendChild(filterLeft);

    const title = document.createElement("div");
    title.className = "tl-filter-title";
    title.textContent = "Saved Themes";

    this.filterSlot.append(filterRow, title);

    const content = this.layout === "list" ? this.renderThemeList(records) : this.renderThemeGrid(records);
    this.main.appendChild(content);

    queueMicrotask(() => this.searchInput?.focus());
  }

  renderThemeGrid(records) {
    const grid = document.createElement("div");
    grid.className = "tl-theme-grid";

    if (!records.length) {
      const empty = document.createElement("div");
      empty.className = "tl-empty";
      empty.textContent = "No themes match your search.";
      grid.appendChild(empty);
      return grid;
    }

    for (const record of records) {
      grid.appendChild(this.createThemeCard(record));
    }

    return grid;
  }

  renderThemeList(records) {
    const wrap = document.createElement("div");
    wrap.className = "tl-theme-table-wrap";

    const table = document.createElement("table");
    table.className = "tl-theme-table";

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Theme</th><th>Updated</th><th></th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    if (!records.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "No themes match your search.";
      cell.className = "text-muted";
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      for (const record of records) {
        const row = document.createElement("tr");
        row.className = record.id === this.options.getLibrary().activeThemeId ? "is-active" : "";

        const nameCell = document.createElement("td");
        nameCell.className = "tl-theme-table-name-cell";

        const nameStack = document.createElement("div");
        nameStack.className = "tl-theme-table-name";

        const nameTitle = document.createElement("div");
        nameTitle.className = "tl-theme-table-title";
        nameTitle.textContent = record.name;

        nameStack.appendChild(nameTitle);

        const description = getThemeDescription(record);
        if (description) {
          const descriptionEl = document.createElement("div");
          descriptionEl.className = "tl-theme-table-description";
          descriptionEl.textContent = description;
          nameStack.appendChild(descriptionEl);
        }

        nameCell.appendChild(nameStack);

        const metaCell = document.createElement("td");
        metaCell.textContent = formatTimestamp(record.updatedAt);

        const actionCell = document.createElement("td");
        const openBtn = this.makeButton(
          "Open",
          (event) => {
            event.stopPropagation();
            this.options.setActiveThemeId(record.id, { apply: false });
            this.page = "editor";
            this.renderMain();
          },
          "tl-btn tl-btn-secondary tl-btn-sm",
        );
        actionCell.appendChild(openBtn);

        row.append(nameCell, metaCell, actionCell);
        row.onclick = () => {
          this.options.setActiveThemeId(record.id, { apply: false });
          this.renderMain();
        };

        tbody.appendChild(row);
      }
    }

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  createThemeCard(record) {
    const card = document.createElement("div");
    card.className =
      "tl-theme-card flex flex-col overflow-hidden rounded-lg cursor-pointer p-2 transition-colors duration-200 aspect-240/311";

    if (record.id === this.options.getLibrary().activeThemeId) {
      card.classList.add("is-active");
    }

    card.title = "Click to select this theme.";
    card.onclick = () => {
      this.options.setActiveThemeId(record.id, { apply: false });
      this.renderMain();
    };

    const top = document.createElement("div");
    top.className = "relative p-0 overflow-hidden aspect-square rounded-lg";

    const preview = document.createElement("div");
    preview.className = "h-full w-full rounded-lg tl-theme-preview";
    const fallbackGradient = themePreviewGradient(record.data);
    const previewUrl = typeof this.options.getThemePreviewUrl === "function"
      ? this.options.getThemePreviewUrl(record)
      : "";

    if (previewUrl) {
      preview.style.background = fallbackGradient;
      preview.style.backgroundImage = `url("${previewUrl}")`;
      preview.style.backgroundSize = "cover";
      preview.style.backgroundPosition = "center";
      preview.style.backgroundRepeat = "no-repeat";
    } else {
      preview.style.background = fallbackGradient;
    }

    top.appendChild(preview);

    const bottom = document.createElement("div");
    bottom.className = "flex-1 w-full h-full";

    const body = document.createElement("div");
    body.className = "tl-theme-card-body";

    const name = document.createElement("h3");
    name.className = "tl-theme-card-title";
    name.textContent = record.name;

    body.appendChild(name);

    const description = getThemeDescription(record);
    if (description) {
      const descriptionEl = document.createElement("p");
      descriptionEl.className = "tl-theme-card-description";
      descriptionEl.textContent = description;
      body.appendChild(descriptionEl);
    }

    const meta = document.createElement("p");
    meta.className = "tl-theme-card-updated";
    meta.textContent = `Updated ${formatTimestamp(record.updatedAt)}`;

    body.appendChild(meta);
    bottom.appendChild(body);
    card.append(top, bottom);

    return card;
  }

  renderEditorPage() {
    const record = this.options.getActiveThemeRecord();
    const records = this.options.getThemeRecords();

    const title = document.createElement("div");
    title.className = "tl-header-title";
    title.append(icon("icon-[lucide--palette]", "text-muted"), document.createTextNode("Theme Editor"));
    this.headerLeft.appendChild(title);

    this.headerRight.appendChild(
      this.makeButton("Back to Themes", () => {
        this.page = "themes";
        this.renderMain();
      }, "tl-btn tl-btn-secondary"),
    );

    const toolbar = document.createElement("div");
    toolbar.className = "tl-filter-row";

    const left = document.createElement("div");
    left.className = "tl-filter-left";

    const selectWrap = document.createElement("label");
    selectWrap.className = "tl-inline-input";
    const selectLabel = document.createElement("span");
    selectLabel.textContent = "Edit theme";

    const themeSelect = document.createElement("select");
    themeSelect.className = "tl-text-input tl-theme-select";
    for (const item of records) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      option.selected = item.id === record.id;
      themeSelect.appendChild(option);
    }
    themeSelect.addEventListener("change", () => {
      const nextRecord = this.options.setActiveThemeId(themeSelect.value, {
        apply: this.options.isLivePreviewEnabled(),
      });
      if (nextRecord) {
        this.renderMain();
      }
    });

    selectWrap.append(selectLabel, themeSelect);

    const applyButton = this.makeButton("Apply", async () => {
      const active = this.options.getActiveThemeRecord();
      if (typeof this.options.applyThemeAndPersist === "function") {
        await this.options.applyThemeAndPersist(active);
      } else {
        this.options.applyTheme(active.data, { applyExtensionSettings: true });
        this.options.showToast({ severity: "success", summary: "Theme Lab", detail: "Theme applied." });
      }
    });

    const rescanButton = this.makeButton("Rescan Extensions", async () => {
      if (typeof this.options.refreshExtensionProviders !== "function") {
        return;
      }
      await this.options.refreshExtensionProviders();
      this.renderMain();
      this.options.showToast({
        severity: "success",
        summary: "Theme Lab",
        detail: "Extension settings rescanned.",
      });
    }, "tl-btn tl-btn-secondary");

    const duplicateButton = this.makeButton("Duplicate", () => {
      this.options.duplicateTheme(record.id);
      this.page = "themes";
      this.renderMain();
    }, "tl-btn tl-btn-secondary");

    const exportButton = this.makeButton("Export", () => this.options.exportThemeRecord(record), "tl-btn tl-btn-secondary");
    const setPreviewButton = this.makeButton(
      "Set Preview Image",
      async () => {
        if (typeof this.options.setThemePreviewFromPicker !== "function") {
          return;
        }
        const updated = await this.options.setThemePreviewFromPicker(record);
        if (updated) {
          this.renderMain();
        }
      },
      "tl-btn tl-btn-secondary",
    );
    const clearPreviewButton = this.makeButton(
      "Clear Preview",
      () => {
        if (typeof this.options.clearThemePreview !== "function") {
          return;
        }
        const updated = this.options.clearThemePreview(record);
        if (updated) {
          this.renderMain();
        }
      },
      "tl-btn tl-btn-secondary",
    );

    const resetButton = this.makeButton(
      "Reset",
      async () => {
        let confirmed = true;
        if (this.options.shouldConfirmReset()) {
          confirmed = await this.options.confirmDialog({
            title: "Reset Theme",
            message: "Reset current theme values to defaults?",
            type: "default",
          });
        }

        if (!confirmed) {
          return;
        }

        this.options.resetActiveTheme();
        this.renderMain();
        if (this.options.isLivePreviewEnabled()) {
          this.options.applyTheme(this.options.getActiveTheme(), { applyExtensionSettings: true });
        }
      },
      "tl-btn tl-btn-secondary",
    );

    const deleteButton = this.makeButton(
      "Delete",
      async () => {
        if (this.options.getThemeRecords().length <= 1) {
          this.options.showToast({ severity: "warn", summary: "Theme Lab", detail: "At least one theme must remain." });
          return;
        }

        const confirmed = await this.options.confirmDialog({
          title: "Delete Theme",
          message: `Delete "${record.name}"?`,
          type: "default",
        });

        if (!confirmed) {
          return;
        }

        this.options.deleteTheme(record.id);
        this.page = "themes";
        this.renderMain();
      },
      "tl-btn tl-btn-danger",
    );

    deleteButton.disabled = this.options.getThemeRecords().length <= 1;

    left.append(
      selectWrap,
      applyButton,
      rescanButton,
      duplicateButton,
      exportButton,
      setPreviewButton,
      clearPreviewButton,
      resetButton,
      deleteButton,
    );
    toolbar.appendChild(left);

    const editorTitle = document.createElement("div");
    editorTitle.className = "tl-filter-title";
    editorTitle.textContent = record.name;

    this.filterSlot.append(toolbar, editorTitle);

    const body = document.createElement("div");
    body.className = "tl-body tl-editor-scroll";

    const syncEditorIdentity = (activeRecord) => {
      const nextName = String(activeRecord?.name || "Theme");
      editorTitle.textContent = nextName;
      const activeOption = Array.from(themeSelect.options).find((option) => option.value === activeRecord?.id);
      if (activeOption) {
        activeOption.textContent = nextName;
      }
    };

    const onAny = ({ preview = true, applyExtensionSettings = false } = {}) => {
      const activeRecord = this.options.getActiveThemeRecord();
      activeRecord.name = String(activeRecord.data.name ?? "").trim() || "Theme";
      activeRecord.data.name = activeRecord.name;
      syncEditorIdentity(activeRecord);
      this.options.markRecordUpdated(activeRecord);
      this.options.scheduleLibraryPersist();
      if (preview && this.options.isLivePreviewEnabled()) {
        this.queueLivePreview(activeRecord.data, { applyExtensionSettings });
      }
    };

    void this.options.buildEditorSections(body, record.data, onAny, {
      refresh: () => this.renderEditorPage(),
      reloadAndReopenStudio: (page = "editor") => this.options.reloadAndReopenStudio?.(page),
      previewTheme: (applyExtensionSettings = false) => {
        if (!this.options.isLivePreviewEnabled()) {
          return;
        }
        const active = this.options.getActiveThemeRecord();
        this.options.applyTheme(active.data, { applyExtensionSettings });
      },
    });
    this.main.appendChild(body);
  }

  renderAboutPage() {
    const title = document.createElement("div");
    title.className = "tl-header-title";
    const titleText = document.createElement("span");
    titleText.className = "tl-about-title";
    titleText.append(
      document.createTextNode("About Theme "),
      Object.assign(document.createElement("span"), {
        className: "tl-brand-lab",
        textContent: "Lab",
      }),
    );
    title.append(icon("icon-[lucide--info]", "text-muted"), titleText);
    this.headerLeft.appendChild(title);

    const card = document.createElement("div");
    card.className = "tl-about";

    const h3 = document.createElement("h3");
    h3.append(
      document.createTextNode("Theme "),
      Object.assign(document.createElement("span"), {
        className: "tl-brand-lab",
        textContent: "Lab",
      }),
      document.createTextNode(" Studio"),
    );

    const p1 = document.createElement("p");
    p1.textContent = "Theme Lab is a full-screen theme workspace for ComfyUI. It lets you browse saved looks, edit them in one place, and apply them without leaving the canvas.";

    const p2 = document.createElement("p");
    p2.textContent = "Each saved theme combines official Comfy palette colors with Theme Lab-specific canvas tuning, preview images, and scanned extension-side styling controls. On startup and when the editor opens, Theme Lab inspects loaded custom-node settings and adds visual controls under Extension sections when they look themeable.";

    const p3 = document.createElement("p");
    p3.textContent = "Use Saved Themes to manage your library, Theme Editor to tune colors and canvas geometry, and Apply to sync the active look back into ComfyUI's runtime theme file.";

    const list = document.createElement("ul");
    list.className = "tl-about-list";
    for (const item of [
      "Match UI colors, node slots, widgets, links, reroutes, and canvas spacing in one theme record.",
      "Store theme previews alongside saved themes so the library is visual instead of text-only.",
      "Export the active theme to ComfyUI while keeping Theme Lab-only metadata in the extension library.",
      "Scan loaded custom-node settings and group visual controls under Extension - Name sections in the editor.",
      "Use live preview to iterate quickly, then apply once you want the current theme committed.",
    ]) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }

    const repo = document.createElement("a");
    repo.className = "tl-about-repo";
    repo.href = "https://github.com/criskb/MKRShift_Theme_Lab";
    repo.target = "_blank";
    repo.rel = "noreferrer";
    repo.append(icon("icon-[lucide--github]"), document.createTextNode("Open Theme Lab Repository"));

    const meta = document.createElement("div");
    meta.className = "tl-about-meta";
    for (const [label, value] of [
      ["Library", "themelab.themes.json"],
      ["Previews", "themelab/previews"],
      ["Comfy Export", "themes/Theme Lab.json"],
    ]) {
      const row = document.createElement("div");
      row.className = "tl-about-meta-row";

      const labelEl = document.createElement("span");
      labelEl.className = "tl-about-meta-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("code");
      valueEl.className = "tl-about-meta-value";
      valueEl.textContent = value;

      row.append(labelEl, valueEl);
      meta.appendChild(row);
    }

    const signature = document.createElement("div");
    signature.className = "tl-about-signature";
    const signatureBrand = document.createElement("span");
    signatureBrand.className = "tl-about-signature-brand";
    signatureBrand.append(
      Object.assign(document.createElement("span"), {
        className: "tl-about-signature-mkr",
        textContent: "MKR",
      }),
      document.createTextNode("Shift"),
    );
    signature.append(
      document.createTextNode("Made by Cris K B "),
      signatureBrand,
    );

    card.append(h3, p1, p2, p3, list, repo, meta, signature);
    this.main.appendChild(card);
  }
}
