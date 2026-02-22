const defaults = {
  angle: 0.62,
  size: 0.72,
  stopLen: 22,
  lineWeight: 4.8,
  initialBranchSize: 220,
  palette: "rainbow",
};

const state = {
  ...defaults,
  seed: 0,
  branchCount: 0,
  maxDepth: 0,
};

let treeCanvas;

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
  angleOut: null,
  sizeOut: null,
  stopOut: null,
  weightOut: null,
  seedValue: null,
  branchesValue: null,
  depthValue: null,
  seedInput: null,
  applySeedBtn: null,
  copySeedBtn: null,
  copySeedDefaultLabel: "Copy seed",
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
  resizeToHost();
  randomizeConfig();
  renderTree();
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
  translate(width / 2, height);
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
  state.initialBranchSize = randomFloat(height * 0.24, height * 0.4);
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
  state.initialBranchSize = randomFloat(height * 0.24, height * 0.4);
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
  ui.presetButtons = Array.from(document.querySelectorAll("[data-preset]"));

  if (ui.copySeedBtn) {
    ui.copySeedDefaultLabel = ui.copySeedBtn.textContent.trim();
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

  ui.paletteInput.addEventListener("change", () => {
    state.palette = ui.paletteInput.value;
    setActivePreset(null);
    renderTree();
  });

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  if (ui.applySeedBtn) {
    ui.applySeedBtn.addEventListener("click", applySeedFromInput);
  }

  if (ui.seedInput) {
    ui.seedInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      applySeedFromInput();
    });
  }

  if (ui.copySeedBtn) {
    ui.copySeedBtn.addEventListener("click", copySeedToClipboard);
  }
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const activeTag = (event.target?.tagName || "").toLowerCase();
    const isTyping =
      activeTag === "input" || activeTag === "select" || activeTag === "textarea";

    if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
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
  ui.paletteInput.value = state.palette;

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
    return;
  }

  const parsedSeed = Number.parseInt(ui.seedInput.value, 10);

  if (Number.isNaN(parsedSeed)) {
    ui.seedInput.value = `${state.seed}`;
    return;
  }

  state.seed = Math.round(clamp(parsedSeed, 1000, 999999));
  setActivePreset(null);
  syncInputsFromState();
  renderTree();
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

  ui.copySeedBtn.textContent = label;

  window.setTimeout(() => {
    ui.copySeedBtn.textContent = ui.copySeedDefaultLabel;
  }, 1200);
}

function resizeToHost() {
  const host = document.getElementById("canvas-host");
  const hostWidth = host ? host.clientWidth : window.innerWidth;
  const side = clamp(Math.floor(hostWidth - 28), 280, 760);
  resizeCanvas(side, side);
  state.initialBranchSize = clamp(state.initialBranchSize, side * 0.2, side * 0.45);
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
