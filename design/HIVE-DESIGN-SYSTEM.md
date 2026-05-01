# The Hive — Design System
**Schreiber Horizon · Predictive Expiry & Waste Prevention Engine**
Version 1.0 · April 2026

---

## 1. Brand Identity

The Hive is a B2B SaaS product built on Schreiber's food manufacturing legacy. The visual language is **industrial-precision**: clean, data-dense, and trustworthy — with an olive-green primary that references food, nature, and safety. The triangle logo motif (echoing the Schreiber Horizon wordmark) appears across UI accents.

---

## 2. Colour Palette

### Primary Brand Colours
| Token | Hex | Usage |
|---|---|---|
| `--green-primary` | `#6B7C2E` | Primary buttons, active nav, key accents, links |
| `--green-dark` | `#4A5620` | Hover states on primary, nav sidebar header |
| `--green-light` | `#8FA03A` | Secondary accents, highlight bars |
| `--green-muted` | `#EEF1E0` | Backgrounds, tinted panels |
| `--green-xlight` | `#F7F9EE` | Page backgrounds with green tint |

### Neutral / Grey Scale
| Token | Hex | Usage |
|---|---|---|
| `--grey-900` | `#1A1C17` | Body text, headings |
| `--grey-700` | `#3D4035` | Secondary text |
| `--grey-500` | `#6B6E62` | Muted labels, placeholder text |
| `--grey-300` | `#B8BAB3` | Borders, dividers |
| `--grey-100` | `#EBEBEA` | Input backgrounds, table stripes |
| `--grey-50` | `#F5F5F4` | Page background |
| `--white` | `#FFFFFF` | Card surfaces, modals |

### Semantic Status Colours
| Token | Hex | Usage |
|---|---|---|
| `--status-critical` | `#C0392B` | Expired lots, critical alerts |
| `--status-warning` | `#C87A00` | At-risk lots, pending actions |
| `--status-safe` | `#2E7D32` | Active/safe status |
| `--status-info` | `#1565C0` | Informational states |
| `--status-critical-bg` | `#FDECEA` | Background for critical badges |
| `--status-warning-bg` | `#FFF3CD` | Background for warning badges |
| `--status-safe-bg` | `#E8F5E9` | Background for safe badges |
| `--status-info-bg` | `#E3F0FC` | Background for info badges |

### Risk Score Gradient
Risk scores (0–100) interpolate across:
- **0–39** (Low): `#2E7D32` → safe green
- **40–69** (Medium): `#C87A00` → amber
- **70–89** (High): `#E65100` → deep orange
- **90–100** (Critical): `#C0392B` → red

---

## 3. Typography

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Condensed:wght@600;700&display=swap" rel="stylesheet">
```

| Role | Family | Weight | Size | Line Height |
|---|---|---|---|---|
| Display / Hero | Roboto Condensed | 700 | 28–36px | 1.1 |
| Page Title (H1) | Roboto Condensed | 600 | 20–24px | 1.2 |
| Section Heading (H2) | Roboto | 700 | 16px | 1.3 |
| Card Title (H3) | Roboto | 600 | 13px | 1.4 |
| Body / Default | Roboto | 400 | 12–13px | 1.5 |
| Label / Caption | Roboto | 500 | 10–11px | 1.4 |
| Code / Lot Numbers | Roboto Mono | 400 | 10–11px | 1.4 |

---

## 4. Spacing & Layout

The system uses an **8px base unit** with half-steps at 4px.

```
4px  — xs   (tight gaps, icon padding)
8px  — sm   (component internal spacing)
12px — md   (card padding, small gaps)
16px — lg   (section gaps, standard padding)
24px — xl   (major section spacing)
32px — 2xl  (page-level spacing)
```

### Grid
- **Sidebar layout**: 200px fixed sidebar + fluid main content
- **Card grids**: 12-column CSS grid, responsive at 1200 / 900 / 600px breakpoints
- **KPI row**: always 4 columns at full width

---

## 5. Components

### 5.1 Buttons

```css
/* Primary — Hive Green */
.btn-primary {
  background: #6B7C2E;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 16px;
  height: 32px;
  font: 500 11px/1 'Roboto', sans-serif;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #4A5620; }

/* Secondary — Ghost */
.btn-secondary {
  background: transparent;
  color: #3D4035;
  border: 1px solid #B8BAB3;
  border-radius: 4px;
  padding: 0 14px;
  height: 32px;
  font: 400 11px/1 'Roboto', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-secondary:hover { border-color: #6B7C2E; color: #6B7C2E; }

/* Destructive */
.btn-danger {
  background: #C0392B;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 16px;
  height: 32px;
  font: 500 11px/1 'Roboto', sans-serif;
  cursor: pointer;
}
.btn-danger:hover { background: #9B2D23; }

/* Icon Button — compact */
.btn-icon {
  width: 28px; height: 28px;
  border-radius: 4px;
  border: 1px solid #B8BAB3;
  background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.btn-icon:hover { border-color: #6B7C2E; color: #6B7C2E; }
```

---

### 5.2 Badges / Status Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font: 600 9px/1.4 'Roboto', sans-serif;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.badge-critical  { background: #FDECEA; color: #C0392B; }
.badge-warning   { background: #FFF3CD; color: #C87A00; }
.badge-safe      { background: #E8F5E9; color: #2E7D32; }
.badge-info      { background: #E3F0FC; color: #1565C0; }
.badge-neutral   { background: #EBEBEA; color: #6B6E62; }
```

---

### 5.3 Risk Score Bar

```html
<div class="risk-bar" data-score="80">
  <div class="risk-fill" style="width: 80%"></div>
</div>
<span class="risk-label">80</span>
```

```css
.risk-bar {
  display: inline-block;
  width: 64px; height: 5px;
  background: #EBEBEA;
  border-radius: 3px;
  vertical-align: middle;
}
.risk-fill {
  height: 100%; border-radius: 3px;
  /* JS sets background via score range:
     0-39: #2E7D32 | 40-69: #C87A00 | 70-89: #E65100 | 90-100: #C0392B */
}
```

---

### 5.4 Cards

```css
.card {
  background: #fff;
  border: 1px solid #EBEBEA;
  border-radius: 6px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
/* Left-border accent variant for alerts */
.card-alert-critical { border-left: 3px solid #C0392B; }
.card-alert-warning  { border-left: 3px solid #C87A00; }
.card-alert-info     { border-left: 3px solid #1565C0; }
```

---

### 5.5 Form Elements

```css
.form-label {
  display: block;
  font: 600 10px/1 'Roboto', sans-serif;
  color: #3D4035;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}
.form-input, .form-select, .form-textarea {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #B8BAB3;
  border-radius: 4px;
  font: 400 11px/1.4 'Roboto', sans-serif;
  color: #1A1C17;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #6B7C2E;
  box-shadow: 0 0 0 2px rgba(107,124,46,0.15);
}
.form-input.error { border-color: #C0392B; }
.form-error { font: 400 9px 'Roboto'; color: #C0392B; margin-top: 2px; }
.form-textarea { height: 64px; padding: 8px 10px; resize: vertical; }
```

---

### 5.6 Data Table

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 11px/1.4 'Roboto', sans-serif;
}
.data-table th {
  text-align: left;
  padding: 6px 10px;
  border-bottom: 1.5px solid #EBEBEA;
  font: 600 9px/1 'Roboto', sans-serif;
  color: #6B6E62;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.data-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #F5F5F4;
  color: #1A1C17;
}
.data-table tr:hover { background: #F7F9EE; }
.data-table tr.row-critical { background: rgba(192,57,43,0.03); }
.data-table tr.row-warning  { background: rgba(200,122,0,0.04); }
```

---

### 5.7 Navigation — Sidebar

```css
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #EBEBEA;
  padding: 8px 0;
  flex-shrink: 0;
}
.sidebar-group {
  font: 700 9px/1 'Roboto', sans-serif;
  color: #B8BAB3;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 10px 14px 4px;
}
.sidebar-link {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  font: 400 11px/1 'Roboto', sans-serif;
  color: #3D4035;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}
.sidebar-link:hover { background: #F7F9EE; color: #6B7C2E; }
.sidebar-link.active {
  background: #EEF1E0;
  color: #4A5620;
  font-weight: 500;
  border-right: 2px solid #6B7C2E;
}
```

---

### 5.8 Top Bar (App Shell)

```css
.topbar {
  height: 44px;
  background: #1A1C17;  /* near-black dark olive */
  display: flex; align-items: center;
  padding: 0 16px; gap: 12px;
  flex-shrink: 0;
}
.topbar-logo-text {
  font: 700 14px/1 'Roboto Condensed', sans-serif;
  color: #fff;
  letter-spacing: 0.5px;
}
.topbar-facility-chip {
  font: 400 10px/1 'Roboto', sans-serif;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.08);
  border-radius: 3px; padding: 3px 8px;
}
.topbar-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: #6B7C2E;
  font: 700 9px/1 'Roboto', sans-serif;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
}
```

---

### 5.9 KPI Card

```css
.kpi-card {
  background: #fff;
  border: 1px solid #EBEBEA;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.kpi-number {
  font: 700 28px/1 'Roboto Condensed', sans-serif;
  letter-spacing: -0.5px;
}
.kpi-label {
  font: 400 10px/1.3 'Roboto', sans-serif;
  color: #6B6E62;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
```

---

### 5.10 Modal

```css
.modal-overlay {
  position: absolute; inset: 0;
  background: rgba(26,28,23,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 88%; max-width: 380px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
}
.modal-title {
  font: 700 14px/1 'Roboto Condensed', sans-serif;
  color: #1A1C17;
  margin-bottom: 14px;
}
```

---

### 5.11 Progress Bar

```css
.progress-track {
  height: 5px;
  border-radius: 3px;
  background: #EBEBEA;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  background: #6B7C2E;
  transition: width 0.3s ease;
}
.progress-fill.warning { background: #C87A00; }
.progress-fill.critical { background: #C0392B; }
```

---

### 5.12 Timeline Item

```css
.timeline-item {
  display: flex; gap: 8px;
  padding: 5px 0;
  font: 400 10px/1.5 'Roboto', sans-serif;
}
.timeline-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  margin-top: 4px; flex-shrink: 0;
}
```

---

## 6. Icon Usage

Use **Lucide icons** (line-weight SVG) at 14×14px inline in buttons/nav, 16×16px in headings, and 20×20px in empty states. Never mix emoji and icons in the same context — in the app UI, always icons; emoji only in technical notes/comments.

**Standard icon map:**
| Context | Icon name |
|---|---|
| Users | `users` |
| Facilities | `building-2` |
| Settings | `settings` |
| Products | `package` |
| Lots | `tag` |
| Work Orders | `clipboard-list` |
| Pick List / FEFO | `zap` |
| Suggestions | `lightbulb` |
| Alerts | `bell` |
| Dashboard | `bar-chart-2` |
| Trends | `trending-down` |
| Move / Transfer | `arrow-right` |
| Risk / Warning | `alert-triangle` |
| Expired | `x-circle` |
| Safe / Check | `check-circle` |
| Export | `download` |
| Import | `upload` |
| Filter | `sliders-horizontal` |

---

## 7. Motion Tokens

```css
--transition-fast:    0.12s ease;
--transition-base:    0.20s ease;
--transition-slow:    0.35s ease;
--transition-spring:  0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
```

Hover states use `--transition-fast`. Modal appears with `scale(0.97) → scale(1)` + `opacity: 0 → 1` using `--transition-base`. Row highlights fade in with `--transition-fast`.

---

## 8. Elevation (Box Shadows)

```css
--shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05);
--shadow-lg:   0 12px 32px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.07);
--shadow-modal: 0 20px 60px rgba(0,0,0,0.22);
```

---

## 9. Logo Usage

The Hive logo (SVG) appears in the topbar at 28px height. The triangle icon alone (without wordmark) is used at 16px in compact contexts. On dark backgrounds (`#1A1C17`), use the white wordmark with the green/yellow-green triangle. On light backgrounds, use the full colour version.

**Topbar minimum clear space:** 16px left, 12px right of the logo before other elements.

---

## 10. Accessibility

- All interactive elements meet WCAG 2.1 AA contrast ratios
- Focus states: `outline: 2px solid #6B7C2E; outline-offset: 2px`
- Badge text never carries meaning alone — always pair with icon or label
- Error states: red border + error message text (never colour alone)
- Tables include `<th scope="col">` and `<caption>` for screen readers
- Modal: `role="dialog"`, `aria-modal="true"`, focus trapped on open

---

*Maintained by Schreiber Horizon Product Team. For questions, contact the Hive product team via The Hatchery.*
