# 🧩 DOM Figma Like Editor (Vanilla JavaScript)

A mini **Figma-inspired design editor** built using **HTML, CSS, and Vanilla JavaScript**.  
The goal of this project is to understand how real design editors work internally by
focusing on **DOM manipulation, mouse events, state management, and editor-style UX**
  without using any external frameworks or libraries.

---

## 🔗 Live Demo   👉 [Click here to view live project](https://figma-canvas.vercel.app/)



## 🚀 Core Features

- Add **Rectangle** elements
- Add **Text** elements
- Single element selection at a time
- Drag elements inside a bounded canvas
- Resize elements using **four corner handles**
- Rotate elements using a rotation handle
- Layers panel with **Move Up / Move Down**
- Properties panel:
  - Width
  - Height
  - Background color
  - Text content (text elements)
  - Text color
  - Rotation
- Keyboard arrow movement (5px step)
- Delete selected element
- Persistent layout using **localStorage**

---

## ⭐ Additional Features

### 1️⃣ Duplicate Element  `Ctrl + D`

**What it does**
- Creates an exact copy of the currently selected element
- The duplicated element appears slightly offset so it is clearly visible

**Approach & Logic**
- Read all properties from the selected element (position, size, styles)
- Create a new DOM element using the same data
- Offset the new element’s `x` and `y` position by `+20px`
- Push the new element into the `elements[]` state array
- Re-sync layers and save state

---

### 2️⃣ Undo  `Ctrl + Z`

**What it does**
- Reverts the editor to the previous state

**Approach & Logic**
- Maintain a `historyStack[]` array that stores snapshots of editor state
- Each snapshot is a **pure JSON representation** of all elements
- On undo:
  - Decrease `historyIndex`
  - Clear the canvas
  - Rebuild all elements from the stored snapshot

---

### 3️⃣ Redo  `Ctrl + Y`

**What it does**
- Restores the previously undone state

**Approach & Logic**
- Uses the same `historyStack[]`
- Increases `historyIndex`
- Reconstructs the canvas from the next snapshot

---

### 4️⃣ Status Bar (Bottom Information Line)

**Example**
Selected: TEXT | X:120 Y:80 | W:200 H:60 | R:15°


**What it does**
- Displays real time information about the selected element

**Approach & Logic**
- A fixed bottom status bar updates on:
  - Selection
  - Dragging
  - Resizing
  - Rotation
- Reads live values directly from the selected element’s styles

**Why it matters**
- Improves spatial awareness
- Common UX pattern in real editors like Figma and Photoshop

---

### 5️⃣ Lock / Unlock Element 🔒

**What it does**
- Prevents the selected element from being moved, resized, or rotated

**Approach & Logic**
- Adds a `.locked` class to the element
- All interaction handlers check:
```js
if (el.classList.contains("locked")) return;
