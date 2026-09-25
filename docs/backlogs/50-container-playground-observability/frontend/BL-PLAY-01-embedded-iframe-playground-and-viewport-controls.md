# Backlog Item: BL-PLAY-01 - Embedded Iframe Playground & Viewport Controls
> **Feature:** Container Playground & Observability | **Layer:** Frontend (`client/src/components/playground/PlaygroundWindow.jsx`)

---

## 🎯 Task Objective
Build the **PlaygroundWindow** component containing an embedded browser preview iframe, URL bar header (`https://app-xxxx.trycloudflare.com`), and responsive viewport toggles (`Desktop`, `Mobile`).

---

## 🛠️ File Locations & Component Specs
* **React Component:** `client/src/components/playground/PlaygroundWindow.jsx`

---

## 📝 Implementation Tasks
1. Build mockup browser header bar with mock domain input, reload button, and external link button.
2. Render `<iframe src={previewUrl} className="w-full h-full border-0" />`.
3. Add responsive toggle buttons (`Desktop`, `Tablet`, `Mobile 375px`).

---

## 🧪 How to Test (Frontend)
1. Open `/playground` in React dev app -> verify preview iframe renders with browser mockup header.
