const defaults = {
  angle: 0.62,
  size: 0.72,
  stopLen: 22,
  lineWeight: 4.8,
  initialBranchSize: 198,
  palette: "rainbow",
};

const state = {
  ...defaults,
  seed: 0,
  branchCount: 0,
  maxDepth: 0,
};

let treeCanvas;
let hostResizeObserver;

const paletteStops = {
  forest: ["#4f3221", "#2f7f54", "#abf26d"],
  sunset: ["#7a1f3d", "#ff6c5f", "#ffd166"],
  mono: ["#8f98a2", "#d6dee7", "#ffffff"],
};

const treePresets = {
  classic: {
    angle: 0.62,
    size: 0.72,
    stopLen: 22,
    lineWeight: 4.8,
    palette: "rainbow",
  },
  dense: {
    angle: 0.5,
    size: 0.79,
    stopLen: 14,
    lineWeight: 6.1,
    palette: "forest",
  },
  minimal: {
    angle: 0.78,
    size: 0.67,
    stopLen: 30,
    lineWeight: 3.4,
    palette: "mono",
  },
};

const ui = {
  angleInput: null,
  sizeInput: null,
  stopInput: null,
  weightInput: null,
  paletteInput: null,
  paletteSelect: null,
  paletteTrigger: null,
  paletteListbox: null,
  paletteSelectedLabel: null,
  paletteOptionButtons: [],
  angleOut: null,
  sizeOut: null,
  stopOut: null,
  weightOut: null,
  seedValue: null,
  branchesValue: null,
  depthValue: null,
  seedInput: null,
  applySeedBtn: null,
  applySeedFeedbackTimer: null,
  applySeedDefaultLabel: "Apply seed",
  copySeedBtn: null,
  copySeedFeedbackTimer: null,
  redrawSpinTimer: null,
  copySeedDefaultLabel: "Copy seed",
  openPrivacyBtn: null,
  closePrivacyBtn: null,
  privacyModal: null,
  privacyHideTimer: null,
  privacyLastActiveElement: null,
  presetButtons: [],
};

function setup() {
  treeCanvas = createCanvas(10, 10);
  treeCanvas.parent("canvas-host");
  pixelDensity(2);
  noLoop();

  cacheUi();
  bindUiEvents();
  bindKeyboardShortcuts();
  observeHostResize();
  resizeToHost();
  randomizeConfig();
  renderTree();

  window.requestAnimationFrame(() => {
    resizeToHost();
    renderTree();
  });
}

function windowResized() {
  resizeToHost();
  renderTree();
}

function draw() {
  background("#040b12");
  state.branchCount = 0;
  state.maxDepth = 0;

  randomSeed(state.seed);
  const fitScale = computeTreeFitScale();
  translate(width / 2, height - 24);
  scale(fitScale);
  branch(state.initialBranchSize, 0);

  updateStats();
}

function branch(len, depth) {
  state.branchCount += 1;
  state.maxDepth = Math.max(state.maxDepth, depth);

  stroke(resolveColor(depth));
  strokeWeight(Math.max(0.85, state.lineWeight - depth * 0.13));
  line(0, 0, 0, -len);
  translate(0, -len);

  if (len > state.stopLen) {
    const nextLen = len * state.size;
    const variance = random(-0.085, 0.085);
    const left = state.angle + random(-0.065, 0.065) + variance;
    const right = state.angle + random(-0.065, 0.065) - variance;

    push();
    rotate(left);
    branch(nextLen, depth + 1);
    pop();

    push();
    rotate(-right);
    branch(nextLen, depth + 1);
    pop();
  }
}

function resolveColor(depth) {
  if (state.palette === "rainbow") {
    const phase = depth * 0.24 + state.seed * 0.013;
    const red = 128 + 127 * Math.sin(phase);
    const green = 128 + 127 * Math.sin(phase + (TWO_PI / 3));
    const blue = 128 + 127 * Math.sin(phase + (TWO_PI * 2 / 3));
    return color(red, green, blue);
  }

  const stops = paletteStops[state.palette];
  const branchDepthHint = 20;
  const ratio = constrain(depth / branchDepthHint, 0, 1);
  const first = color(stops[0]);
  const second = color(stops[1]);
  const third = color(stops[2]);

  if (ratio < 0.5) {
    return lerpColor(first, second, ratio * 2);
  }

  return lerpColor(second, third, (ratio - 0.5) * 2);
}

function renderTree() {
  redraw();
}

function randomizeConfig() {
  state.seed = randomInt(1000, 999999);
  state.angle = randomFloat(0.2, 1.2);
  state.size = randomFloat(0.61, 0.82);
  state.stopLen = randomInt(10, 38);
  state.lineWeight = randomFloat(2.2, 8.4);
  state.initialBranchSize = randomFloat(height * 0.22, height * 0.35);
  state.palette = randomItem(Object.keys(paletteStops).concat("rainbow"));
  setActivePreset(null);

  syncInputsFromState();
}

function mutateConfig() {
  state.seed = randomInt(1000, 999999);
  state.angle = clamp(state.angle + randomFloat(-0.12, 0.12), 0.15, 1.3);
  state.size = clamp(state.size + randomFloat(-0.03, 0.03), 0.58, 0.85);
  state.stopLen = clamp(Math.round(state.stopLen + randomFloat(-4, 4)), 8, 42);
  state.lineWeight = clamp(state.lineWeight + randomFloat(-0.8, 0.8), 1.5, 10);
  setActivePreset(null);

  syncInputsFromState();
  renderTree();
}

function resetConfig() {
  state.seed = randomInt(1000, 999999);
  state.angle = defaults.angle;
  state.size = defaults.size;
  state.stopLen = defaults.stopLen;
  state.lineWeight = defaults.lineWeight;
  state.initialBranchSize = clamp(defaults.initialBranchSize, height * 0.2, height * 0.45);
  state.palette = defaults.palette;
  setActivePreset("classic");

  syncInputsFromState();
  renderTree();
}

function applyPreset(presetName) {
  const preset = treePresets[presetName];

  if (!preset) {
    return;
  }

  state.seed = randomInt(1000, 999999);
  state.angle = preset.angle;
  state.size = preset.size;
  state.stopLen = preset.stopLen;
  state.lineWeight = preset.lineWeight;
  state.initialBranchSize = randomFloat(height * 0.22, height * 0.35);
  state.palette = preset.palette;
  setActivePreset(presetName);

  syncInputsFromState();
  renderTree();
}

function cacheUi() {
  ui.angleInput = document.getElementById("angle-input");
  ui.sizeInput = document.getElementById("size-input");
  ui.stopInput = document.getElementById("stop-input");
  ui.weightInput = document.getElementById("weight-input");
  ui.paletteInput = document.getElementById("palette-input");
  ui.paletteSelect = document.getElementById("palette-select");
  ui.paletteTrigger = document.getElementById("palette-trigger");
  ui.paletteListbox = document.getElementById("palette-listbox");
  ui.paletteSelectedLabel = document.getElementById("palette-selected-label");
  ui.paletteOptionButtons = Array.from(document.querySelectorAll(".palette-option"));
  ui.angleOut = document.getElementById("angle-out");
  ui.sizeOut = document.getElementById("size-out");
  ui.stopOut = document.getElementById("stop-out");
  ui.weightOut = document.getElementById("weight-out");
  ui.seedValue = document.getElementById("seed-value");
  ui.branchesValue = document.getElementById("branches-value");
  ui.depthValue = document.getElementById("depth-value");
  ui.seedInput = document.getElementById("seed-input");
  ui.applySeedBtn = document.getElementById("apply-seed-btn");
  ui.copySeedBtn = document.getElementById("copy-seed-btn");
  ui.openPrivacyBtn = document.getElementById("open-privacy-btn");
  ui.closePrivacyBtn = document.getElementById("close-privacy-btn");
  ui.privacyModal = document.getElementById("privacy-modal");
  ui.presetButtons = Array.from(document.querySelectorAll("[data-preset]"));

  if (ui.applySeedBtn) {
    ui.applySeedDefaultLabel = ui.applySeedBtn.getAttribute("aria-label") || "Apply seed";
  }

  if (ui.copySeedBtn) {
    ui.copySeedDefaultLabel =
      ui.copySeedBtn.getAttribute("aria-label") || ui.copySeedBtn.textContent.trim();
  }

  if (ui.openPrivacyBtn) {
    ui.openPrivacyBtn.setAttribute("aria-expanded", "false");
  }
}

function bindUiEvents() {
  const randomizeBtn = document.getElementById("randomize-btn");
  const mutateBtn = document.getElementById("mutate-btn");
  const resetBtn = document.getElementById("reset-btn");
  const redrawBtn = document.getElementById("redraw-btn");
  const downloadBtn = document.getElementById("download-btn");

  randomizeBtn.addEventListener("click", () => {
    randomizeConfig();
    renderTree();
  });

  mutateBtn.addEventListener("click", mutateConfig);
  resetBtn.addEventListener("click", resetConfig);

  redrawBtn.addEventListener("click", () => {
    if (ui.redrawSpinTimer) {
      window.clearTimeout(ui.redrawSpinTimer);
      ui.redrawSpinTimer = null;
    }

    redrawBtn.classList.remove("is-spinning");
    void redrawBtn.offsetWidth;
    redrawBtn.classList.add("is-spinning");
    ui.redrawSpinTimer = window.setTimeout(() => {
      redrawBtn.classList.remove("is-spinning");
      ui.redrawSpinTimer = null;
    }, 450);

    state.seed = randomInt(1000, 999999);
    setActivePreset(null);
    syncInputsFromState();
    renderTree();
  });

  downloadBtn.addEventListener("click", () => {
    saveCanvas(treeCanvas, `fractal-tree-${state.seed}`, "png");
  });

  ui.angleInput.addEventListener("input", () => {
    state.angle = parseFloat(ui.angleInput.value);
    ui.angleOut.textContent = `${state.angle.toFixed(2)} rad`;
    renderTree();
  });

  ui.sizeInput.addEventListener("input", () => {
    state.size = parseFloat(ui.sizeInput.value);
    ui.sizeOut.textContent = `${state.size.toFixed(2)}x`;
    renderTree();
  });

  ui.stopInput.addEventListener("input", () => {
    state.stopLen = parseFloat(ui.stopInput.value);
    ui.stopOut.textContent = `${Math.round(state.stopLen)} px`;
    renderTree();
  });

  ui.weightInput.addEventListener("input", () => {
    state.lineWeight = parseFloat(ui.weightInput.value);
    ui.weightOut.textContent = `${state.lineWeight.toFixed(1)} px`;
    renderTree();
  });

  if (ui.paletteInput) {
    ui.paletteInput.addEventListener("change", () => {
      selectPalette(ui.paletteInput.value, { fromUser: true, shouldRender: true });
    });
  }

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  if (ui.applySeedBtn) {
    ui.applySeedBtn.addEventListener("click", () => {
      const didApply = applySeedFromInput();

      if (didApply) {
        animateApplySeedFeedback();
      }
    });
  }

  if (ui.seedInput) {
    ui.seedInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const didApply = applySeedFromInput();

      if (didApply) {
        animateApplySeedFeedback();
      }
    });
  }

  if (ui.copySeedBtn) {
    ui.copySeedBtn.addEventListener("click", copySeedToClipboard);
  }

  bindPaletteSelectEvents();
  bindPrivacyModalEvents();
}

function bindPaletteSelectEvents() {
  if (!ui.paletteSelect || !ui.paletteTrigger || ui.paletteOptionButtons.length === 0) {
    return;
  }

  ui.paletteTrigger.addEventListener("click", () => {
    if (isPaletteMenuOpen()) {
      closePaletteMenu();
      return;
    }

    openPaletteMenu();
    focusPaletteOptionByValue(state.palette);
  });

  ui.paletteTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPaletteMenu();
      focusPaletteOptionByValue(state.palette);
      return;
    }

    if (event.key === "Escape") {
      closePaletteMenu();
    }
  });

  ui.paletteOptionButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      selectPalette(button.dataset.value, { fromUser: true, shouldRender: true });
      closePaletteMenu(true);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusPaletteOptionByIndex(index + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusPaletteOptionByIndex(index - 1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusPaletteOptionByIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusPaletteOptionByIndex(ui.paletteOptionButtons.length - 1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPalette(button.dataset.value, { fromUser: true, shouldRender: true });
        closePaletteMenu(true);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closePaletteMenu(true);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!isPaletteMenuOpen() || !ui.paletteSelect) {
      return;
    }

    if (ui.paletteSelect.contains(event.target)) {
      return;
    }

    closePaletteMenu();
  });
}

function selectPalette(value, { fromUser = false, shouldRender = false } = {}) {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();
  const isKnownPalette =
    normalized === "rainbow" || Object.prototype.hasOwnProperty.call(paletteStops, normalized);

  if (!isKnownPalette) {
    return;
  }

  state.palette = normalized;

  if (fromUser) {
    setActivePreset(null);
  }

  syncInputsFromState();

  if (shouldRender) {
    renderTree();
  }
}

function getPaletteLabel(value) {
  if (!ui.paletteInput) {
    return value;
  }

  const option = Array.from(ui.paletteInput.options).find((candidate) => {
    return candidate.value === value;
  });

  return option ? option.textContent.trim() : value;
}

function updatePaletteSelectUi() {
  if (ui.paletteInput) {
    ui.paletteInput.value = state.palette;
  }

  if (ui.paletteSelectedLabel) {
    ui.paletteSelectedLabel.textContent = getPaletteLabel(state.palette);
  }

  ui.paletteOptionButtons.forEach((button) => {
    const isActive = button.dataset.value === state.palette;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", `${isActive}`);
    button.tabIndex = isActive ? 0 : -1;
  });
}

function isPaletteMenuOpen() {
  return Boolean(ui.paletteSelect && ui.paletteSelect.classList.contains("is-open"));
}

function openPaletteMenu() {
  if (!ui.paletteSelect || !ui.paletteTrigger) {
    return;
  }

  ui.paletteSelect.classList.add("is-open");
  ui.paletteTrigger.setAttribute("aria-expanded", "true");
}

function closePaletteMenu(shouldFocusTrigger = false) {
  if (!ui.paletteSelect || !ui.paletteTrigger) {
    return;
  }

  ui.paletteSelect.classList.remove("is-open");
  ui.paletteTrigger.setAttribute("aria-expanded", "false");

  if (shouldFocusTrigger) {
    ui.paletteTrigger.focus();
  }
}

function focusPaletteOptionByValue(value) {
  const index = ui.paletteOptionButtons.findIndex((button) => {
    return button.dataset.value === value;
  });

  focusPaletteOptionByIndex(index);
}

function focusPaletteOptionByIndex(index) {
  if (ui.paletteOptionButtons.length === 0) {
    return;
  }

  const clamped = clamp(index, 0, ui.paletteOptionButtons.length - 1);
  ui.paletteOptionButtons[clamped].focus();
}

function bindPrivacyModalEvents() {
  if (!ui.openPrivacyBtn || !ui.closePrivacyBtn || !ui.privacyModal) {
    return;
  }

  ui.openPrivacyBtn.addEventListener("click", openPrivacyModal);
  ui.closePrivacyBtn.addEventListener("click", closePrivacyModal);

  ui.privacyModal.addEventListener("click", (event) => {
    if (event.target === ui.privacyModal) {
      closePrivacyModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isPrivacyModalOpen()) {
      return;
    }

    event.preventDefault();
    closePrivacyModal();
  });
}

function isPrivacyModalOpen() {
  return Boolean(ui.privacyModal && !ui.privacyModal.hasAttribute("hidden"));
}

function openPrivacyModal() {
  if (!ui.privacyModal) {
    return;
  }

  if (isPaletteMenuOpen()) {
    closePaletteMenu();
  }

  if (ui.privacyHideTimer) {
    window.clearTimeout(ui.privacyHideTimer);
    ui.privacyHideTimer = null;
  }

  if (isPrivacyModalOpen()) {
    return;
  }

  ui.privacyLastActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  ui.privacyModal.hidden = false;
  document.body.classList.add("is-modal-open");
  if (ui.openPrivacyBtn) {
    ui.openPrivacyBtn.setAttribute("aria-expanded", "true");
  }

  window.requestAnimationFrame(() => {
    if (!ui.privacyModal) {
      return;
    }

    ui.privacyModal.classList.add("is-open");
    if (ui.closePrivacyBtn) {
      ui.closePrivacyBtn.focus();
    }
  });
}

function closePrivacyModal() {
  if (!ui.privacyModal || !isPrivacyModalOpen()) {
    return;
  }

  ui.privacyModal.classList.remove("is-open");
  document.body.classList.remove("is-modal-open");

  if (ui.openPrivacyBtn) {
    ui.openPrivacyBtn.setAttribute("aria-expanded", "false");
  }

  if (ui.privacyHideTimer) {
    window.clearTimeout(ui.privacyHideTimer);
  }

  ui.privacyHideTimer = window.setTimeout(() => {
    if (ui.privacyModal) {
      ui.privacyModal.hidden = true;
    }
    ui.privacyHideTimer = null;
  }, 180);

  if (ui.privacyLastActiveElement && typeof ui.privacyLastActiveElement.focus === "function") {
    ui.privacyLastActiveElement.focus();
    ui.privacyLastActiveElement = null;
  }
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (isPrivacyModalOpen()) {
      return;
    }

    const activeTag = (event.target?.tagName || "").toLowerCase();
    const isTyping =
      activeTag === "input" || activeTag === "select" || activeTag === "textarea";
    const withinPaletteSelect = Boolean(event.target?.closest?.("#palette-select"));

    if (isTyping || withinPaletteSelect || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "r") {
      event.preventDefault();
      randomizeConfig();
      renderTree();
      return;
    }

    if (key === "m") {
      event.preventDefault();
      mutateConfig();
      return;
    }

    if (key === "s") {
      event.preventDefault();
      saveCanvas(treeCanvas, `fractal-tree-${state.seed}`, "png");
    }
  });
}

function syncInputsFromState() {
  ui.angleInput.value = state.angle.toFixed(2);
  ui.sizeInput.value = state.size.toFixed(2);
  ui.stopInput.value = Math.round(state.stopLen);
  ui.weightInput.value = state.lineWeight.toFixed(1);
  updatePaletteSelectUi();

  ui.angleOut.textContent = `${state.angle.toFixed(2)} rad`;
  ui.sizeOut.textContent = `${state.size.toFixed(2)}x`;
  ui.stopOut.textContent = `${Math.round(state.stopLen)} px`;
  ui.weightOut.textContent = `${state.lineWeight.toFixed(1)} px`;

  if (ui.seedInput) {
    ui.seedInput.value = `${state.seed}`;
  }
}

function updateStats() {
  ui.seedValue.textContent = state.seed;
  ui.branchesValue.textContent = state.branchCount;
  ui.depthValue.textContent = state.maxDepth;
}

function setActivePreset(activePreset) {
  ui.presetButtons.forEach((button) => {
    const isActive = button.dataset.preset === activePreset;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", `${isActive}`);
  });
}

function applySeedFromInput() {
  if (!ui.seedInput) {
    return false;
  }

  const parsedSeed = Number.parseInt(ui.seedInput.value, 10);

  if (Number.isNaN(parsedSeed)) {
    ui.seedInput.value = `${state.seed}`;
    return false;
  }

  state.seed = Math.round(clamp(parsedSeed, 1000, 999999));
  setActivePreset(null);
  syncInputsFromState();
  renderTree();
  return true;
}

function animateApplySeedFeedback() {
  if (!ui.applySeedBtn) {
    return;
  }

  if (ui.applySeedFeedbackTimer) {
    window.clearTimeout(ui.applySeedFeedbackTimer);
    ui.applySeedFeedbackTimer = null;
  }

  ui.applySeedBtn.classList.remove("is-success");
  void ui.applySeedBtn.offsetWidth;
  ui.applySeedBtn.classList.add("is-success");
  ui.applySeedBtn.setAttribute("aria-label", "Seed applied");

  ui.applySeedFeedbackTimer = window.setTimeout(() => {
    if (!ui.applySeedBtn) {
      ui.applySeedFeedbackTimer = null;
      return;
    }

    ui.applySeedBtn.classList.remove("is-success");
    ui.applySeedBtn.setAttribute("aria-label", ui.applySeedDefaultLabel);
    ui.applySeedFeedbackTimer = null;
  }, 900);
}

async function copySeedToClipboard() {
  const seedText = `${state.seed}`;
  let copied = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(seedText);
      copied = true;
    } catch (error) {
      copied = false;
    }
  }

  if (!copied) {
    const helperInput = document.createElement("textarea");
    helperInput.value = seedText;
    helperInput.setAttribute("readonly", "readonly");
    helperInput.style.position = "absolute";
    helperInput.style.left = "-9999px";
    document.body.append(helperInput);
    helperInput.select();
    copied = document.execCommand("copy");
    helperInput.remove();
  }

  flashCopySeedFeedback(copied ? "Copied" : "Copy failed");
}

function flashCopySeedFeedback(label) {
  if (!ui.copySeedBtn) {
    return;
  }

  if (ui.copySeedFeedbackTimer) {
    window.clearTimeout(ui.copySeedFeedbackTimer);
    ui.copySeedFeedbackTimer = null;
  }

  const isIconButton = ui.copySeedBtn.classList.contains("icon-btn");

  if (isIconButton) {
    ui.copySeedBtn.setAttribute("aria-label", label);
    ui.copySeedBtn.setAttribute("title", label);
    ui.copySeedBtn.setAttribute("data-feedback", label);
    ui.copySeedBtn.classList.remove("is-feedback");
    void ui.copySeedBtn.offsetWidth;
    ui.copySeedBtn.classList.add("is-feedback");

    ui.copySeedFeedbackTimer = window.setTimeout(() => {
      ui.copySeedBtn.setAttribute("aria-label", ui.copySeedDefaultLabel);
      ui.copySeedBtn.setAttribute("title", ui.copySeedDefaultLabel);
      ui.copySeedBtn.removeAttribute("data-feedback");
      ui.copySeedBtn.classList.remove("is-feedback");
      ui.copySeedFeedbackTimer = null;
    }, 1400);
    return;
  }

  ui.copySeedBtn.textContent = label;

  window.setTimeout(() => {
    ui.copySeedBtn.textContent = ui.copySeedDefaultLabel;
  }, 1400);
}

function resizeToHost() {
  const host = document.getElementById("canvas-host");
  const hostWidth = host ? host.clientWidth : window.innerWidth;
  const hostHeight = host ? host.clientHeight : 0;
  const maxByWidth = Math.floor(hostWidth - 24);
  const fallbackByHeight = Math.floor(
    window.innerHeight * (window.innerWidth > 1080 ? 0.56 : 0.74),
  );
  const maxByHeight = hostHeight > 40 ? Math.floor(hostHeight - 24) : fallbackByHeight;
  const side = clamp(Math.min(maxByWidth, maxByHeight), 240, 760);

  if (Math.abs(width - side) < 1 && Math.abs(height - side) < 1) {
    return;
  }

  resizeCanvas(side, side);
  if (treeCanvas) {
    treeCanvas.style("width", `${side}px`);
    treeCanvas.style("height", `${side}px`);
  }
  state.initialBranchSize = clamp(state.initialBranchSize, side * 0.2, side * 0.45);
}

function observeHostResize() {
  const host = document.getElementById("canvas-host");

  if (!host || typeof ResizeObserver === "undefined") {
    return;
  }

  if (hostResizeObserver) {
    hostResizeObserver.disconnect();
  }

  hostResizeObserver = new ResizeObserver(() => {
    resizeToHost();
    renderTree();
  });

  hostResizeObserver.observe(host);
}

function computeTreeFitScale() {
  const pathLength = estimatePathLength(state.initialBranchSize, state.stopLen, state.size);
  const angleFactor = clamp(Math.sin(Math.abs(state.angle)) * 0.72 + 0.22, 0.25, 0.95);
  const estimatedHalfWidth = Math.max(
    state.initialBranchSize * 0.4,
    pathLength * angleFactor * 1.05,
  );
  const fitByHeight = (height * 0.78) / pathLength;
  const fitByWidth = (width * 0.45) / estimatedHalfWidth;
  return clamp(Math.min(1, fitByHeight, fitByWidth), 0.24, 1);
}

function estimatePathLength(initialLen, stopLen, sizeFactor) {
  if (sizeFactor <= 0 || sizeFactor >= 1) {
    return initialLen;
  }

  let total = 0;
  let segment = initialLen;
  let guard = 0;

  while (segment > stopLen && guard < 80) {
    total += segment;
    segment *= sizeFactor;
    guard += 1;
  }

  return total + segment;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomFloat(min, max + 1));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
