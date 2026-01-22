const canvas = document.getElementById("canvas");
const layersList = document.getElementById("layers");
const statusBar = document.getElementById("statusBar");
const lockBtn = document.getElementById("lockBtn");


let elements = [];
let selected = null;

let historyStack = [];
let historyIndex = -1;


/* ================= CREATE ELEMENT ================= */
function createElement(type) {
  const el = document.createElement("div");
  el.className = "element";
  el.dataset.type = type;
  el.style.width = "120px";
  el.style.height = "80px";
  el.style.left = "50px";
  el.style.top = "50px";
  el.style.transform = "rotate(0deg)";

  if (type === "text") {
    el.classList.add("text");

    const span = document.createElement("span");
    span.className = "text-content";
    span.textContent = "Text";
    span.style.pointerEvents = "none"; 
    span.style.userSelect = "none";
    span.style.width = "100%";
    span.style.height = "100%";
    span.style.display = "flex";
    span.style.alignItems = "center";
    span.style.justifyContent = "center";

    el.appendChild(span);
  }

  canvas.appendChild(el);
  elements.push(el);

  addHandles(el);
  enableDrag(el);
  select(el);
  syncZIndex();
  redrawLayersUI();
  save();
}

/* ================= SELECTION ================= */
function select(el) {
  if (selected) selected.classList.remove("selected");
  selected = el;
  el.classList.add("selected");
  updateProps();
  redrawLayersUI();
  updateStatusBar();
  lockBtn.textContent = el.classList.contains("locked")
  ? "🔓 Unlock"
  : "🔒 Lock";


}



canvas.addEventListener("click", e => {
  if (e.target === canvas && selected) {
    selected.classList.remove("selected");
    selected = null;
    redrawLayersUI();
    statusBar.textContent = "No element selected";

  }
});

/* ================= DRAG (Move) ================= */
function enableDrag(el) {
  el.addEventListener("mousedown", e => {
    if (el.classList.contains("locked")) return;

    if (
      e.target.classList.contains("handle") ||
      e.target.classList.contains("rotate-handle")
    ) return;

    const offsetX = e.offsetX;
    const offsetY = e.offsetY;
    const rect = canvas.getBoundingClientRect();

    function move(ev) {
      let x = ev.clientX - rect.left - offsetX;
      let y = ev.clientY - rect.top - offsetY;

      x = Math.max(0, Math.min(x, canvas.clientWidth - el.offsetWidth));
      y = Math.max(0, Math.min(y, canvas.clientHeight - el.offsetHeight));

      el.style.left = x + "px";
      el.style.top = y + "px";
      updateStatusBar();
      save();
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", move);
    }, { once: true });
  });

  el.addEventListener("click", e => {
    e.stopPropagation();
    select(el);
  });
}

/* ================= RESIZE ================= */
function resizeLogic(el, corner, e) {
  if (el.classList.contains("locked")) return;

  const sx = e.clientX;
  const sy = e.clientY;
  const sw = el.offsetWidth;
  const sh = el.offsetHeight;
  const sl = el.offsetLeft;
  const st = el.offsetTop;

  function resize(ev) {
    let dx = ev.clientX - sx; 
    let dy = ev.clientY - sy;

    let w = sw;
    let h = sh;
    let l = sl;
    let t = st;

    if (corner.includes("r")) w = sw + dx;
    if (corner.includes("l")) { w = sw - dx; l = sl + dx; }
    if (corner.includes("b")) h = sh + dy;
    if (corner.includes("t")) { h = sh - dy; t = st + dy; }

    if (w > 20) { el.style.width = w + "px"; el.style.left = l + "px"; }
    if (h > 20) { el.style.height = h + "px"; el.style.top = t + "px"; }
    updateStatusBar();
    save();
  }

  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize);
  }, { once: true });
}

/* ================= HANDLES ================= */
function addHandles(el) {
  const rotate = document.createElement("div");
  rotate.className = "rotate-handle";
  el.appendChild(rotate);

  rotate.addEventListener("mousedown", e => {
    if (el.classList.contains("locked")) return;
    e.stopPropagation();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    function rotateMove(ev) {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      el.style.transform = `rotate(${angle}deg)`;
      pRotate.value = Math.round(angle);
      updateStatusBar();
      save();
    }

    document.addEventListener("mousemove", rotateMove);
    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", rotateMove);
    }, { once: true });
  });

  ["tl","tr","bl","br"].forEach(corner => {
    const h = document.createElement("div");
    h.className = `handle ${corner}`;
    el.appendChild(h);
    h.addEventListener("mousedown", e => {
      e.stopPropagation();
      resizeLogic(el, corner, e);
    });
  });
}

/* ================= PROPERTIES ================= */
function updateProps() {
  if (!selected) return;

  pWidth.value = selected.offsetWidth;
  pHeight.value = selected.offsetHeight;
  pColor.value = rgbToHex(selected.style.backgroundColor);
  pRotate.value = selected.style.transform.replace(/[^\d-]/g, "");

        // text color 
        
  if (selected.dataset.type === "text") {
    const span = selected.querySelector(".text-content");
    pText.value = span.textContent;
    pTextColor.disabled = false;
    pTextColor.value = rgbToHex(span.style.color || "rgb(255,255,255)");
  } else {
    pText.value = "";
    pTextColor.disabled = true;
  }
}

function updateStatusBar() {
  if (!selected) {
    statusBar.textContent = "No element selected";
    return;
  }

  const type = selected.dataset.type;
  const x = parseInt(selected.style.left);
  const y = parseInt(selected.style.top);
  const w = selected.offsetWidth;
  const h = selected.offsetHeight;
  const r = selected.style.transform.replace(/[^\d-]/g, "") || 0;

  statusBar.textContent =
    `Selected: ${type.toUpperCase()} | ` +
    `X:${x} Y:${y} | W:${w} H:${h} | R:${r}°`;
}


pWidth.oninput = () => selected && (selected.style.width = pWidth.value + "px", save());
pHeight.oninput = () => selected && (selected.style.height = pHeight.value + "px", save());
pColor.oninput = () => selected && (selected.style.background = pColor.value, save());
pRotate.oninput = () => selected && (selected.style.transform = `rotate(${pRotate.value}deg)`, save());


pText.oninput = () => {
  if (selected?.dataset.type === "text") {
    selected.querySelector(".text-content").textContent = pText.value;
    save();
  }
};

pTextColor.oninput = () => {
  if (selected?.dataset.type === "text") {
    selected.querySelector(".text-content").style.color = pTextColor.value;
    save();
  }
};

/* ================= KEYBOARD ================= */
document.addEventListener("keydown", e => {

  // UNDO (CTRL + Z)
if (e.ctrlKey && e.key.toLowerCase() === "z") {
  e.preventDefault();
  undo();
  return;
}

// REDO (CTRL + Y)
if (e.ctrlKey && e.key.toLowerCase() === "y") {
  e.preventDefault();
  redo();
  return;
}



  if (!selected) return;

  let step = 5;
  let x = parseInt(selected.style.left);
  let y = parseInt(selected.style.top);

  // DUPLICATE (CTRL + D)
if (e.ctrlKey && e.key.toLowerCase() === "d") {
  e.preventDefault();
  duplicateSelected();
}


  if (e.key === "Delete") {
    selected.remove();
    elements = elements.filter(el => el !== selected);
    selected = null;
    redrawLayersUI();
    save();
    return;
  }

  if (e.key === "ArrowUp") y -= step;
  if (e.key === "ArrowDown") y += step;
  if (e.key === "ArrowLeft") x -= step;
  if (e.key === "ArrowRight") x += step;

  x = Math.max(0, Math.min(x, canvas.clientWidth - selected.offsetWidth));
  y = Math.max(0, Math.min(y, canvas.clientHeight - selected.offsetHeight));

  selected.style.left = x + "px";
  selected.style.top = y + "px";
  save();
});



/* ================= DELETE ================= */
deleteBtn.onclick = () => {
  if (!selected) return;
  selected.remove();
  elements = elements.filter(el => el !== selected);
  selected = null;
  redrawLayersUI();
  save();
};

/* ================= LAYERS ================= */
function redrawLayersUI() {
  layersList.innerHTML = "";
  elements.forEach((el, i) => {
    const li = document.createElement("li");
    li.textContent = `${el.dataset.type} ${i + 1}`;
    if (el === selected) {
      li.style.background = "#4aa3ff";
      li.style.color = "#000";
    }
    li.onclick = () => select(el);
    layersList.appendChild(li);
  });
}

function syncZIndex() {
  elements.forEach((el, i) => el.style.zIndex = i + 1);
}

/* ================= MOVE UP / DOWN ================= */
layerUp.onclick = () => {
  if (!selected) return;
  const i = elements.indexOf(selected);
  if (i < elements.length - 1) {
    [elements[i], elements[i + 1]] = [elements[i + 1], elements[i]];
    syncZIndex();
    redrawLayersUI();
    save();
  }
};

layerDown.onclick = () => {
  if (!selected) return;
  const i = elements.indexOf(selected);
  if (i > 0) {
    [elements[i], elements[i - 1]] = [elements[i - 1], elements[i]];
    syncZIndex();
    redrawLayersUI();
    save();
  }
};

/* ================= SAVE / LOAD ================= */


function save() {
  const snapshot = JSON.stringify(
    elements.map(el => ({
      type: el.dataset.type,
      x: el.style.left,
      y: el.style.top,
      w: el.style.width,
      h: el.style.height,
      bg: el.style.background,
      text:
        el.dataset.type === "text"
          ? el.querySelector(".text-content").textContent
          : "",
      color:
        el.dataset.type === "text"
          ? el.querySelector(".text-content").style.color
          : "",
      rot: el.style.transform,
      z: el.style.zIndex,

      locked: el.classList.contains("locked"),


    }))
  );

  // remove future states if new action happens
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(snapshot);
  historyIndex++;

  localStorage.setItem("layout", snapshot);
}


function load() {
  const data = JSON.parse(localStorage.getItem("layout") || "[]");
  data.forEach(d => {
    const el = document.createElement("div");
    el.className = "element";
    el.dataset.type = d.type;
    el.style.left = d.x;
    el.style.top = d.y;
    el.style.width = d.w;
    el.style.height = d.h;
    el.style.background = d.bg;
    el.style.transform = d.rot;
    el.style.zIndex = d.z;

    if (d.type === "text") {
      el.classList.add("text");
      const span = document.createElement("span");
      span.className = "text-content";
      span.textContent = d.text;
      span.style.color = d.color || "#fff";
      span.style.pointerEvents = "none";
      span.style.width = "100%";
      span.style.height = "100%";
      span.style.display = "flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";
      el.appendChild(span);
    }

    if (d.locked) {
  el.classList.add("locked");
}


    canvas.appendChild(el);
    elements.push(el);
    addHandles(el);
    enableDrag(el);
  });

  syncZIndex();
  redrawLayersUI();
}

/* ================= INIT ================= */
addRect.onclick = () => createElement("rectangle");
addText.onclick = () => createElement("text");
load();

/* ================= UTILS ================= */
function rgbToHex(rgb) {
  if (!rgb) return "#ffffff";
  const n = rgb.match(/\d+/g).map(Number);
  return "#" + n.map(x => x.toString(16).padStart(2, "0")).join("");
}


function undo() {
  if (historyIndex <= 0) return;

  historyIndex--;
  const data = JSON.parse(historyStack[historyIndex]);

  // clear canvas
  elements.forEach(el => el.remove());
  elements = [];
  selected = null;

  // rebuild
  data.forEach(d => {
    const el = document.createElement("div");
    el.className = "element";
    el.dataset.type = d.type;
    el.style.left = d.x;
    el.style.top = d.y;
    el.style.width = d.w;
    el.style.height = d.h;
    el.style.background = d.bg;
    el.style.transform = d.rot;
    el.style.zIndex = d.z;

    if (d.type === "text") {
      el.classList.add("text");
      const span = document.createElement("span");
      span.className = "text-content";
      span.textContent = d.text;
      span.style.color = d.color || "#fff";
      span.style.pointerEvents = "none";
      span.style.width = "100%";
      span.style.height = "100%";
      span.style.display = "flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";
      el.appendChild(span);
    }

    canvas.appendChild(el);
    elements.push(el);
    addHandles(el);
    enableDrag(el);
  });

  redrawLayersUI();
}

function redo() {
  if (historyIndex >= historyStack.length - 1) return;

  historyIndex++;
  const data = JSON.parse(historyStack[historyIndex]);

  // clear canvas
  elements.forEach(el => el.remove());
  elements = [];
  selected = null;

  // rebuild
  data.forEach(d => {
    const el = document.createElement("div");
    el.className = "element";
    el.dataset.type = d.type;
    el.style.left = d.x;
    el.style.top = d.y;
    el.style.width = d.w;
    el.style.height = d.h;
    el.style.background = d.bg;
    el.style.transform = d.rot;
    el.style.zIndex = d.z;

    if (d.type === "text") {
      el.classList.add("text");

      const span = document.createElement("span");
      span.className = "text-content";
      span.textContent = d.text;
      span.style.color = d.color || "#fff";
      span.style.pointerEvents = "none";
      span.style.width = "100%";
      span.style.height = "100%";
      span.style.display = "flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";

      el.appendChild(span);
    }

    canvas.appendChild(el);
    elements.push(el);
    addHandles(el);
    enableDrag(el);
  });

  redrawLayersUI();
}




  // dupicate logic
function duplicateSelected() {
  if (!selected) return;

  const data = {
    type: selected.dataset.type,
    x: parseInt(selected.style.left) + 20,
    y: parseInt(selected.style.top) + 20,
    w: selected.style.width,
    h: selected.style.height,
    bg: selected.style.background,
    rot: selected.style.transform,
    text: "",
    color: ""
  };

  if (data.type === "text") {
    const span = selected.querySelector(".text-content");
    data.text = span.textContent;
    data.color = span.style.color;
  }

  const el = document.createElement("div");
  el.className = "element";
  el.dataset.type = data.type;
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.width = data.w;
  el.style.height = data.h;
  el.style.background = data.bg;
  el.style.transform = data.rot;

  if (data.type === "text") {
    el.classList.add("text");

    const span = document.createElement("span");
    span.className = "text-content";
    span.textContent = data.text;
    span.style.color = data.color;
    span.style.pointerEvents = "none";
    span.style.width = "100%";
    span.style.height = "100%";
    span.style.display = "flex";
    span.style.alignItems = "center";
    span.style.justifyContent = "center";

    el.appendChild(span);
  }

  canvas.appendChild(el);
  elements.push(el);

  addHandles(el);
  enableDrag(el);
  select(el);
  syncZIndex();
  redrawLayersUI();
  save();
}




/* ================= EXPORT (JSON + HTML) ================= */

// JSON EXPORT — internal layout data
exportJSON.onclick = () => {
  const data = elements.map(el => ({
    type: el.dataset.type,
    x: el.style.left,
    y: el.style.top,
    width: el.style.width,
    height: el.style.height,
    background: el.style.background,
    color:
      el.dataset.type === "text"
        ? el.querySelector(".text-content")?.style.color
        : null,
    text:
      el.dataset.type === "text"
        ? el.querySelector(".text-content")?.textContent
        : null,
    transform: el.style.transform,
    zIndex: el.style.zIndex
  }));

  downloadFile(
    "design.json",
    JSON.stringify(data, null, 2),
    "application/json"
  );
};

// HTML EXPORT — visual reproduction using inline styles
exportHTML.onclick = () => {
  const htmlBody = elements.map(el => {
    const text =
      el.dataset.type === "text"
        ? el.querySelector(".text-content")?.textContent
        : "";

    const color =
      el.dataset.type === "text"
        ? el.querySelector(".text-content")?.style.color
        : "#000";

    return `
<div style="
  position:absolute;
  left:${el.style.left};
  top:${el.style.top};
  width:${el.style.width};
  height:${el.style.height};
  background:${el.style.background};
  color:${color};
  transform:${el.style.transform};
  z-index:${el.style.zIndex};
">
  ${text}
</div>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Exported Design</title>
</head>
<body style="margin:0; position:relative; background:#1b1f2a;">
${htmlBody}
</body>
</html>
`;

  downloadFile("design.html", html, "text/html");
};

// helper
function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function toggleLock() {
  if (!selected) return;

  if (selected.classList.contains("locked")) {
    selected.classList.remove("locked");
    lockBtn.textContent = "🔒 Lock";
  } else {
    selected.classList.add("locked");
    lockBtn.textContent = "🔓 Unlock";
  }

  save();
}
lockBtn.onclick = () => {
  toggleLock();
};
