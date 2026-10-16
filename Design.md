# 🎨 Design System, UI/UX Guidelines & Typography — SkyFare India
## Government-Grade Visual Identity, Color Tokens & Responsive Specifications

* **Design System**: Sovereign India Intelligence (SII) Design Framework
* **Theme Support**: Adaptive Dark & Light Modes with System Preference Synchronization
* **Version**: `2.0.0 (Production Live)`
* **Last Updated**: `2026-10-16`

---

## 1. 🏛️ Design Philosophy & Aesthetic Vision

SkyFare India bridges **sovereign governmental authority** with **cutting-edge financial intelligence**. The design principles reflect:

1. **Sovereign Trust & Authenticity**:
   - Anchored by the Indian National Tricolor accent ribbon at the top of the viewport.
   - Formal institutional labeling (e.g. *MoSPI Price Statistics Division*, *DGCA Aircraft Rules 1937*, *Base 2024=100*).
2. **High Information Density with Visual Clarity**:
   - Complex macroeconomic statistics (5-formula side-by-side matrices, 14-corridor yield tables, unbundled fare tiers) presented cleanly without sensory overload.
3. **Ergonomic Multi-Device Responsiveness**:
   - Engineered for seamless usability across Windows workstations, tablets, and handheld mobile phones ($320\text{px}-480\text{px}$) with zero horizontal page clipping.

---

## 2. 🌈 Color Palette & Semantic Tokens

### 2.1 National Accent Strip (Top App Bar)
A 4px horizontal tri-strip rendered across the top edge of every page:
* **Indian Saffron**: `#F59E0B` (`bg-amber-500`)
* **White / Silver**: `#FFFFFF` (`bg-white dark:bg-slate-200`)
* **India Green**: `#059669` (`bg-emerald-600`)

### 2.2 Primary Sovereign & Brand Palette
* **Sovereign Blue (Primary Action)**:
  - Default: `#2563EB` (`bg-blue-600`, `text-blue-600`)
  - Hover: `#1D4ED8` (`bg-blue-700`)
  - Subdued / Tint: `#EFF6FF` (`bg-blue-50`, dark: `bg-blue-950/40`)
* **Institutional Indigo (Admin & Executive Badges)**:
  - Default: `#4F46E5` (`bg-indigo-600`, `text-indigo-600`)
  - Dark Accent: `#4338CA` (`bg-indigo-700`)
  - Subdued: `#EEF2FF` (`bg-indigo-50`, dark: `bg-indigo-950/40`)

### 2.3 Neutral Canvas & Surface Shades
| Token Name | Light Mode Hex | Dark Mode Hex | Tailwind Classes |
| :--- | :---: | :---: | :--- |
| **Page Background** | `#F8FAFC` | `#020617` | `bg-slate-50 dark:bg-slate-950` |
| **Primary Card / Surface** | `#FFFFFF` | `#0F172A` | `bg-white dark:bg-slate-900` |
| **Elevated Surface (Modals/Popovers)**| `#FFFFFF` | `#1E293B` | `bg-white dark:bg-slate-800` |
| **Primary Text** | `#0F172A` | `#F8FAFC` | `text-slate-900 dark:text-slate-100` |
| **Muted / Secondary Text** | `#64748B` | `#94A3B8` | `text-slate-500 dark:text-slate-400` |
| **Subtle Borders** | `#E2E8F0` | `#1E293B` | `border-slate-200 dark:border-slate-800` |

### 2.4 Semantic Status & Indicator Colors
* **Compliant / Verified / Low Price (Emerald)**:
  - Background: `bg-emerald-50 dark:bg-emerald-950/40`
  - Text: `text-emerald-700 dark:text-emerald-300`
  - Solid: `#10B981` (`bg-emerald-500`)
  - *Usage*: Corridors showing negative price changes ($< 0\%$, below baseline), verified live observations, compliant Rule 135 tariffs, active scrapers.
* **Stable Corridor / Nominal Variance (Sky Blue)**:
  - Background: `bg-blue-50 dark:bg-blue-950/40`
  - Text: `text-blue-700 dark:text-blue-300`
  - Solid: `#3B82F6` (`bg-blue-500`)
  - Selection Highlight / Focus: `#0284c7` with `#38bdf8` halo glow
  - *Usage*: Corridors with nominal price movement ($0\% - +5\%$ vs baseline), active corridor selection polylines on SOI Vector Map and Real Google Maps.
* **Moderate Alert / Elevated Demand (Amber)**:
  - Background: `bg-amber-50 dark:bg-amber-950/40`
  - Text: `text-amber-700 dark:text-amber-300`
  - Solid: `#F59E0B` (`bg-amber-500`)
  - *Usage*: Corridors with $+5\% - +15\%$ price increase, high-demand watchlist, pending reviews.
* **Surge Breach / Outlier / Danger (Rose)**:
  - Background: `bg-rose-50 dark:bg-rose-950/40`
  - Text: `text-rose-700 dark:text-rose-300`
  - Solid: `#EF4444` (`bg-rose-500`)
  - *Usage*: Corridors with $> +15\%$ surge breach, DGCA Rule 135 tariff breaches, quarantined outlier fares, failed keys.
* **Superlative Fisher / Econometric Benchmark (Violet)**:
  - Background: `bg-violet-50 dark:bg-violet-950/40`
  - Text: `text-violet-700 dark:text-violet-300`
  - Solid: `#8B5CF6` (`bg-violet-500`)
  - *Usage*: Fisher Ideal Superlative Index ($166.48$), UN CPI standard ribbons.

---

## 3. 🔤 Typography & Hierarchy System

SkyFare India pairs two typefaces loaded via Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### 3.1 Primary UI Font: `Plus Jakarta Sans`
* **Role**: Primary interface typeface across all headings, titles, labels, paragraphs, buttons, and navigation menus.
* **Font Stacks**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`.
* **Weights & Scales**:
  - `font-black` (800): Metric values (`114.45`), hero section titles, brand logo.
  - `font-bold` (700): Section headers, card titles, primary action buttons.
  - `font-semibold` (600): Sub-headers, tab items, navigation links, table column headers.
  - `font-medium` (500): Body descriptions, tooltips, helper text.
  - `font-normal` (400): Extended explanatory documentation, legal notices.

### 3.2 Monospace / Financial Font: `JetBrains Mono`
* **Role**: All quantitative numbers, financial figures, currency amounts, econometric index readings, corridor IATA codes, and cryptographic hashes.
* **Font Stacks**: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`.
* **Application**:
  - Currency Quotes: `₹5,420`, `₹12,850`
  - Index Values: `114.45`, `114.56`, `114.34`
  - Basis Points Deltas: `+42.4 bps`, `+3.64 bps`
  - Corridor Tags: `DEL-BOM`, `BOM-DEL`, `BLR-DEL`
  - Flight Numbers: `6E-4153`, `IX-4427`, `AI-4290`
  - Cryptographic Hashes: `f107...787b`, `0519...aa8d`

---

## 4. 📐 Responsive Grid & Layout Breakpoints

The layout dynamically adapts across standard Tailwind CSS breakpoints:

| Breakpoint | Viewport Width | Layout Behavior & Adaptation |
| :--- | :---: | :--- |
| **Mobile (`xs` / `< sm`)** | $320\text{px} - 639\text{px}$ | • Fixed desktop sidebar hidden; accessible via slide-in mobile drawer.<br/>• Search console stacks to 1 column (`grid-cols-1`).<br/>• Touch targets enforced at $\ge 44\text{px} \times 44\text{px}$.<br/>• Horizon yield pills use horizontal smooth touch-scroll (`overflow-x-auto no-scrollbar`).<br/>• Top tricolor header remains fixed with compact title. |
| **Tablet (`sm` / `md`)** | $640\text{px} - 1023\text{px}$ | • Search console displays in 2-column or 3-column grid.<br/>• Stat cards display in 2-column grid (`grid-cols-2`).<br/>• Tables enable smooth horizontal touch scrolling. |
| **Desktop (`lg`)** | $1024\text{px} - 1279\text{px}$ | • Permanent fixed left sidebar (`w-64`, sticky at `top-[65px]`).<br/>• 3-column and 4-column metric card rows.<br/>• Full interactive Leaflet route map and waterfall charts visible side-by-side. |
| **Widescreen (`xl` / `2xl`)** | $\ge 1280\text{px}$ | • Content centered within `max-w-7xl` container with balanced padding.<br/>• Full multi-horizon matrix ($T+1$ to $T+45$) displayed side-by-side without folding. |

---

## 5. 🧩 Component Styling Guidelines

### 5.1 Cards & Containers
* **Border Radius**:
  - Small pills & badges: `rounded-lg` ($8\text{px}$)
  - Form inputs & buttons: `rounded-xl` ($12\text{px}$)
  - Standard metric cards: `rounded-2xl` ($16\text{px}$)
  - Hero panels & master containers: `rounded-3xl` ($24\text{px}$)
* **Borders & Rings**:
  - `border border-slate-200 dark:border-slate-800`
  - Subtle focus rings: `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`
* **Glassmorphism**:
  - Sticky headers and sidebars: `bg-white/95 dark:bg-slate-900/95 backdrop-blur-md`

### 5.2 Interactive States & Micro-Interactions
* **Buttons**:
  - Include `transition-all duration-150` with subtle scale/shadow lifts on hover.
  - Active state: `active:scale-[0.98]`
  - Always apply `cursor-pointer`.
* **Dark Mode Transitions**:
  - Smooth theme switching controlled via the `dark` class toggled on `<html>` and `<body>`.

### 5.3 Sovereign Map Container Geometry & Deep Dive Alignment
* **Dual Engine Cartography**: Supports both Survey of India (SOI) Official Topographic Vector Map (`IndiaCorridorHeatmap.tsx`) and Photorealistic Real Google Maps (`RealGoogleMapView.tsx` with 3D tilt, satellite hybrid, and live meteorological cloud layers).
* **Height Parity Enforcement**:
  - Both map components declare `h-full min-h-[560px] lg:min-h-[590px]` with flex-stretch alignment (`items-stretch`).
  - Matches the exact vertical bounding box of the adjacent *Corridor Deep Dive & DGCA Rule 135 Check* card on desktop displays ($\ge 1024\text{px}$).
  - Eliminates awkward vertical letterboxing/margins above and below the territorial borders while providing ample headroom for flight route polylines and animated radar sweeps.
* **4-Tier Route Tariff Coloring**:
  - `🟢 Low Price (< 0%)`: Emerald (`#10b981`)
  - `🔵 Stable (0 - 5%)`: Sky Blue (`#3b82f6`)
  - `🟠 Watchlist (5 - 15%)`: Amber (`#f59e0b`)
  - `🔴 Surge Breach (> 15%)`: Rose (`#ef4444`)
  - Active Selected Corridor: Vivid sovereign blue (`#0284c7`) with `#38bdf8` pulse halo, brought to topmost z-index layer.

