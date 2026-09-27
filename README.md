# AURA — Immersive 3D Store

A first-person, browser-based concept store built with **React**, **TypeScript**, **Three.js** and **Tailwind CSS**. Walk the shop floor with WASD, inspect products on an interactive 3D turntable, and check out through Razorpay.

![Tech](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Tech](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Tech](https://img.shields.io/badge/Three.js-r169-000000?logo=three.js&logoColor=white)
![Tech](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Tech](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## Features

- **First-person navigation** — WASD movement relative to view direction, mouse look via the Pointer Lock API, Shift to walk slowly, subtle head-bob, and axis-separated collision so you slide along obstacles instead of sticking.
- **Four-quadrant store layout** — Electronics and Furniture flank the entrance, Kitchen & Dining fills the left rear, and a branded checkout lane occupies the right rear.
- **Glowing product hotspots** — camera-facing sprites that pulse, flare on hover, and drive a shared spotlight plus an emissive lift on the product itself.
- **Interactive product modal** — each item opens a live WebGL turntable you can drag to orbit and scroll to zoom, running in its own isolated renderer.
- **Directory search** — press `/` to search products by name, department, synonym or spec ("tv", "oled", "120hz", "couch"). Picking a result flies you to the product and opens its detail modal; picking a department flies you there. Fully keyboard-driven, with your recent picks remembered.
- **Persistent cart** — cart contents survive a reload. Only product ids and quantities are stored, so prices always come from the live catalog.
- **Proximity-driven cart** — the cart only exists at the checkout lane. Press `C` anywhere and the camera flies you there; close it and you're returned to the exact spot and heading you left from.
- **Razorpay Checkout** — test-mode payment flow wired to the live cart total in INR.
- **Adaptive quality** — measures frame rate and steps the renderer up or down between presets without any user-facing controls.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move relative to where you're looking |
| `Mouse` | Look around |
| `Shift` | Walk slowly |
| `Click` / `E` | Inspect the product under the crosshair |
| `C` | Open the cart (flies you to checkout) |
| `/` | Open the directory — search or jump to a department |
| `↑` `↓` `Enter` | Move through and pick a directory result |
| `Esc` | Close overlay / pause |

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure Razorpay (optional — a test key is bundled as a fallback)
cp .env.example .env
#    then set VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# 3. Run
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (zero-warning policy) |
| `npm run format` | Prettier |

### Test payments

The Razorpay integration runs in **test mode**. Use card `4111 1111 1111 1111`, any future expiry, any CVV, and any OTP.

---

### Architecture

The Three.js code is **deliberately framework-agnostic**. `StoreEngine` owns the scene, render loop and player simulation and exposes a small imperative API; React never touches a Three object directly.

```
  React (UI, overlays, cart)          StoreEngine (scene, loop, physics)
            │                                     │
            │  commands: travelToCheckout(),      │
            │            captureSnapshot()  ──────▶
            │                                     │
            ◀──────  events: onHoverChange,       │
                             onProductActivate,   │
                             onEnterCheckoutZone  │
```

State lives in three Zustand stores — `useCartStore` (lines, quantities, totals), `useUiStore` (phase, overlays, toast) and `useRecentStore` (recent directory picks) — so no prop drilling and no context re-render cascades. The cart and recents persist to `localStorage`; both store only ids and quantities and re-resolve them against `CATALOG` on load, so a catalog edit is never frozen into a returning visitor's browser and a hand-edited payload can't crash the app.

---

## Performance notes

Getting this to a stable frame rate drove several deliberate decisions worth calling out:

**Light budget.** Three.js forward-renders, so *every* light is evaluated per fragment of every surface. An early revision gave each product its own accent spotlight and reached 42 lights, which was unusable. The final scene runs on **11**: per-product lighting is faked with additive floor decals plus a single shared spotlight that follows whatever you're looking at.

**Static shadow baking.** Nothing in the scene moves, so `shadowMap.autoUpdate` is disabled after the first frame. Shadow maps render once and freeze, which makes additional shadow casters essentially free at runtime.

**Instancing.** Ceiling slats (~100), downlights (~114), beams, shelf boards, queue poles and baskets are `InstancedMesh` — one draw call each instead of dozens. The shopping cart model is 47 meshes over 2 materials, so it's merged per material *then* instanced: the entire fleet of 8 carts costs **2 draw calls** instead of 376.

**Pick proxies.** Raycasting the real GLB meshes meant testing up to ~21,000 triangles every pick. Each product now has an invisible 12-triangle proxy box matching its bounds, so the whole scene's pick cost is ~240 triangles — an **88× reduction**.

**Model normalisation.** Source models ship at wildly different authoring scales. Each product declares one real-world dimension (`fit: { axis: 'y', to: 2.366 }`) and `fitModel()` derives the uniform scale, then re-seats the object centred on X/Z and resting exactly on the floor. Hotspot heights, collision boxes and light-pool sizes are all derived from the resulting bounds rather than hardcoded.
