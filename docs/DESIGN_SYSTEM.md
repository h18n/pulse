# Design System

## 1. Aesthetic: "Hacker Chic"
Pulse employs a dark, data-dense, "Hacker Chic" aesthetic deliberately designed for SREs and developers who look at dashboards for hours a day. Key attributes include:
*   High contrast primary interface against deep dark backgrounds (slate/indigo).
*   Glassmorphism (blur backgrounds) for floating panels.
*   Monospaced typography for numerical data and code blocks.

## 2. Color Palette
We rely on customized Tailwind CSS colors:
*   **Backgrounds:** `slate-950` (Primary), `slate-900` (Secondary/Panels).
*   **Accents:** `indigo-500` (Primary Action), `emerald-500` (Success/Healthy), `red-500` (Error/Critical), `amber-500` (Warning).
*   **Typography:** `slate-200` (Primary Text), `slate-400` (Secondary Text).

## 3. Typography
*   **Primary Font:** `Inter` (Sans-serif) for general UI elements and headings.
*   **Data Font:** `JetBrains Mono` or `Fira Code` for all technical data, logs, trace IDs, and numeric metrics to ensure horizontal alignment.

## 4. Components Library
We use **shadcn/ui** and **Tailwind CSS** as our foundational UI layer.
*   Components prioritize density over whitespace to surface as much telemetry as possible.
*   All interactive elements must support keyboard navigation (WCAG 2.1 AA accessiblity).

## 5. Iconography
*   We use **Lucide React** for consistent, clean vector icons. Icons are sized at `w-5 h-5` on primary navigations and `w-4 h-4` for inline hints.
