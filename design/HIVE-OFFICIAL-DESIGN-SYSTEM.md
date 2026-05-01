# The Hive — Official Design System
**Schreiber Foods · Enterprise Warehouse Management Platform**
Version 2.0 · May 2026

---

## 1. Brand Identity

The Hive is a dark-first, high-density enterprise WMS. The visual language is **precision-industrial**: dark chrome, high-contrast golden yellow on near-black — evoking warehouse control systems and terminal dashboards. The hexagonal logo references the hive/honeycomb motif and industrial precision.

**Design principles:**
- Dark surfaces as the default — not a dark mode option
- Yellow as the single accent colour; everything else is achromatic
- Density over whitespace — more information per viewport
- Flat, not skeuomorphic — no gradients, minimal shadows, crisp edges
- Tab-based navigation for multi-context work

---

## 2. Colour Palette

### Core Brand
| Token | Hex | Usage |
|---|---|---|
| `--hive-yellow` | `#F5C518` | Primary CTA buttons, active tabs, active nav items, highlights, selected rows, badges |
| `--hive-yellow-dark` | `#D4A900` | Hover state on yellow buttons |
| `--hive-yellow-text` | `#1A1A1A` | Text placed ON yellow backgrounds |

### Surface & Background
| Token | Hex | Usage |
|---|---|---|
| `--bg-app` | `#1A1A1A` | Application chrome, top nav bar, sidebar |
| `--bg-nav` | `#111111` | Deeper nav panel, active tab underline container |
| `--bg-page` | `#E8E8E8` | Content area page background (light) |
| `--bg-surface` | `#FFFFFF` | Cards, panels, modals, table containers |
| `--bg-row-selected` | `#FFFBE6` | Selected table row highlight (yellow tint) |
| `--bg-row-hover` | `#F9F9F9` | Table row hover |
| `--bg-filter` | `#FFFFFF` | Filter sidebar background |

### Text
| Token | Hex | Usage |
|---|---|---|
| `--text-on-dark` | `#FFFFFF` | Text on dark nav/topbar |
| `--text-on-dark-muted` | `#A0A0A0` | Secondary text on dark |
| `--text-primary` | `#1A1A1A` | Body text on light surfaces |
| `--text-secondary` | `#555555` | Labels, captions, muted on light |
| `--text-dim` | `#888888` | Disabled, placeholder |
| `--text-yellow-nav` | `#F5C518` | Active nav item text on dark |

### Borders & Dividers
| Token | Hex | Usage |
|---|---|---|
| `--border-light` | `#E0E0E0` | Table rows, card borders on light |
| `--border-dark` | `#333333` | Dividers on dark surfaces |
| `--border-input` | `#CCCCCC` | Form input borders |
| `--border-focus` | `#F5C518` | Input focus ring |

### Semantic Status (used in data tables)
| Token | Hex | Usage |
|---|---|---|
| `--status-open` | `#2196F3` | Open/active status |
| `--status-available` | `#4CAF50` | Available inventory |
| `--status-unavailable` | `#F44336` | Unavailable/blocked |
| `--status-warning` | `#FF9800` | Warning states |
| `--status-error-badge` | `#D32F2F` | Error badge background |
| `--status-error-text` | `#FFFFFF` | Error badge text |

---

## 3. Typography

**Font:** System native — no web font import required.

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
```

The Hive uses a compact, data-dense typographic scale. No decorative or display fonts.

| Role | Size | Weight | Color |
|---|---|---|---|
| Nav label | 13px | 400 | `#FFFFFF` / `#F5C518` (active) |
| Page title | 16px | 600 | `#1A1A1A` |
| Section heading | 14px | 600 | `#1A1A1A` |
| Table header | 12px | 600 | `#555555` |
| Table cell | 13px | 400 | `#1A1A1A` |
| Label / caption | 11px | 400 | `#555555` |
| Badge / chip | 11px | 600 | varies |
| Filter label | 12px | 400 | `#1A1A1A` |
| Step indicator number | 14px | 700 | `#FFFFFF` (on dark circle) |

---

## 4. Spacing

Base unit: **4px**. All spacing is multiples of 4.

```
4px   — xs   (tight internal padding)
8px   — sm   (chip padding, badge gap)
12px  — md   (row padding, small gaps)
16px  — lg   (card padding, section gaps)
24px  — xl   (major section margins)
32px  — 2xl  (page-level padding)
```

---

## 5. Components

### 5.1 Top Navigation Bar

```
Height: 48px
Background: #1A1A1A
Border-bottom: 1px solid #333333
```

Contains: hexagonal logo + wordmark left-aligned, nav menu items horizontally centred, utility controls (Favorites, user badge, clock) right-aligned.

**Logo area:**
- Hex icon in `#F5C518` gold
- "THE" in `#FFFFFF`, "HIVE" in `#F5C518`
- Font: bold, condensed sans

**Nav items:**
```css
.nav-item {
  color: #A0A0A0;
  font-size: 13px;
  padding: 0 14px;
  height: 48px;
  display: flex; align-items: center;
  border-bottom: 3px solid transparent;
  transition: color 0.15s;
}
.nav-item:hover { color: #FFFFFF; }
.nav-item.active {
  color: #F5C518;
  border-bottom-color: #F5C518;
  font-weight: 500;
}
```

### 5.2 Tab Bar (Sub-navigation)

Sits immediately below the nav bar. Dark background, tab per open entity.

```
Height: 36px
Background: #111111
Border-bottom: 1px solid #333333
```

```css
.tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0 14px;
  height: 36px;
  font-size: 12px;
  color: #A0A0A0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tab.active {
  color: #F5C518;
  border-bottom-color: #F5C518;
  background: rgba(245,197,24,0.06);
}
.tab-close {
  font-size: 11px;
  color: #666;
  cursor: pointer;
  padding: 0 2px;
}
.tab-close:hover { color: #fff; }
```

### 5.3 Buttons

**Primary (Yellow CTA):**
```css
.btn-primary {
  background: #F5C518;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 600;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-primary:hover { background: #D4A900; }
```

**Secondary (Ghost/Outline):**
```css
.btn-secondary {
  background: transparent;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 400;
  height: 36px;
  padding: 0 20px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:hover { border-color: #999; }
```

**Icon Button (Tool action):**
```css
.btn-icon {
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 14px;
}
.btn-icon:hover { background: #F5F5F5; border-color: #999; }
```

### 5.4 Filter Sidebar

```
Width: 220px
Background: #FFFFFF
Border-right: 1px solid #E0E0E0
Padding: 16px
```

**Filter field:**
```css
.filter-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 12px;
  color: #1A1A1A;
  background: #FFFFFF;
  margin-bottom: 8px;
}
.filter-input:focus {
  outline: none;
  border-color: #F5C518;
  box-shadow: 0 0 0 2px rgba(245,197,24,0.2);
}
.filter-select {
  /* same as input, + dropdown arrow */
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron */
}
```

**Search button:**  
Uses `.btn-primary` at full width, with search icon.

**Clear All:**  
Uses `.btn-secondary` at full width.

### 5.5 Data Table

High-density grid, consistent with enterprise WMS conventions.

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #555555;
  border-bottom: 2px solid #E0E0E0;
  white-space: nowrap;
  background: #FFFFFF;
}
.data-table tbody td {
  padding: 9px 12px;
  border-bottom: 1px solid #E0E0E0;
  color: #1A1A1A;
  vertical-align: middle;
}
.data-table tbody tr:hover td { background: #F9F9F9; }
.data-table tbody tr.selected td { background: #FFFBE6; }

/* Checkbox column */
.data-table .col-check { width: 36px; }
.data-table input[type="checkbox"] {
  accent-color: #F5C518;
  width: 14px; height: 14px;
}
```

### 5.6 Breadcrumb / Step Indicator

Used for multi-step flows (e.g. Book Appointment: Step 1 → 2 → 3).

```css
.step-indicator {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px;
}
.step-num {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.step-num.active { background: #F5C518; color: #1A1A1A; }
.step-label { font-weight: 500; color: #1A1A1A; }
.step-label.inactive { color: #A0A0A0; font-weight: 400; }
.step-divider { width: 20px; height: 1px; background: #CCCCCC; }
```

### 5.7 Badges / Status Pills

```css
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}
.badge-yellow  { background: #F5C518; color: #1A1A1A; }        /* Active/selected tab, highlights */
.badge-error   { background: #D32F2F; color: #FFFFFF; }        /* Notification counts */
.badge-blue    { background: #E3F2FD; color: #1565C0; border: 1px solid #90CAF9; }  /* Info */
.badge-green   { background: #E8F5E9; color: #2E7D32; border: 1px solid #A5D6A7; } /* Available */
.badge-red     { background: #FFEBEE; color: #C62828; border: 1px solid #EF9A9A; } /* Unavailable */
.badge-neutral { background: #F5F5F5; color: #555555; border: 1px solid #E0E0E0; } /* NA / neutral */
```

### 5.8 Chip (Tool / Data tags)

The same chip pattern from the wireframe — adapted to Hive palette.

```css
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 500;
}
/* Colour variants follow semantic chip categories */
.chip-kb       { color: #0D47A1; background: #E3F2FD; border-color: #90CAF9; }
.chip-llm      { color: #4A148C; background: #F3E5F5; border-color: #CE93D8; }
.chip-in       { color: #1A1A1A; background: #F5F5F5; border-color: #CCCCCC; }
.chip-out      { color: #7A4A10; background: #FFF8E1; border-color: #FFD54F; }
.chip-na       { color: #888888; background: #FAFAFA; border-color: #E0E0E0; font-style: italic; }
.chip-in-tool  { color: #0D47A1; background: #E8F0FA; border-color: #90CAF9; }
.chip-out-tool { color: #4A148C; background: #EDE7F6; border-color: #CE93D8; }
```

### 5.9 Panel / Card

```css
.panel {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}
.panel-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #E0E0E0;
  color: #1A1A1A;
}
.panel-body { padding: 16px; }
```

### 5.10 Workflow Card (Blueprint specific)

```css
.wf-card {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  width: 280px;
  flex-shrink: 0;
}
/* Yellow accent stripe at top */
.wf-card .wf-stripe {
  height: 4px;
  border-radius: 4px 4px 0 0;
}
/* WF badge uses Hive yellow tint for active, greyscale for others */
.wf-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
```

### 5.11 Selected Orders / Detail Panel

Right-side detail panels use:

```css
.detail-panel {
  width: 280px;
  background: #FFFFFF;
  border-left: 1px solid #E0E0E0;
  padding: 16px;
  font-size: 12px;
}
.detail-row {
  display: flex; justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #F0F0F0;
}
.detail-label { color: #555555; font-weight: 600; }
.detail-value { color: #1A1A1A; text-align: right; }
```

---

## 6. Iconography

- Icons are small (14–16px), flat, monochrome
- On dark nav: white `#FFFFFF` or grey `#A0A0A0`
- On light content: dark grey `#555555`
- Notification badge: red circle `#D32F2F` with white number, superimposed top-right on icon
- Tool icons in chips: 12×12px, no outline

---

## 7. Elevation

The Hive is fundamentally **flat**. Panels and tables sit flush or with 1px borders — no dramatic shadows.

```css
--shadow-none:  none;
--shadow-panel: 0 1px 4px rgba(0,0,0,0.10);
--shadow-modal: 0 4px 20px rgba(0,0,0,0.25);
```

---

## 8. Motion

Transitions are minimal — this is a utility product, not a marketing site.

```css
--transition-fast: 0.12s ease;
--transition-base: 0.20s ease;
```

Hover and active state transitions use `--transition-fast` only. No page-transition animations.

---

## 9. Logo Usage

**Official mark:**
- Hexagonal icon in `#F5C518` gold
- Wordmark: "THE" in `#FFFFFF`, "HIVE" in `#F5C518`
- Font: bold condensed, all-caps

**On dark backgrounds (nav bar):** full colour logo  
**On light backgrounds:** use SVG with dark text variant or embed PNG  
**Minimum clear space:** 12px on all sides  
**Minimum size:** 24px height for icon alone; 80px width for full wordmark

---

## 10. Page Layout

```
┌─────────────────────────────────────────────┐  ← Top nav bar (48px, #1A1A1A)
├─────────────────────────────────────────────┤  ← Tab bar (36px, #111111)
├──────────────┬──────────────────────────────┤  ← Content area
│ Filter panel │   Main content panel         │
│ (220px)      │   (fluid, bg: #E8E8E8)       │
│ bg: #FFFFFF  │                              │
│              │   ┌──────────────────────┐   │
│              │   │ Table / Grid         │   │
│              │   │ bg: #FFFFFF          │   │
│              │   └──────────────────────┘   │
└──────────────┴──────────────────────────────┘
```

---

## 11. Accessibility

- All interactive elements meet WCAG 2.1 AA contrast
- Yellow `#F5C518` on `#1A1A1A` passes AA for large text; use bold weight for small text
- Focus states: `outline: 2px solid #F5C518; outline-offset: 2px`
- Checkboxes use `accent-color: #F5C518`
- Error states: red border + error message text (never colour alone)

---

*Maintained by Schreiber Horizon Product Team. Reflects The Hive v2.x enterprise application.*
