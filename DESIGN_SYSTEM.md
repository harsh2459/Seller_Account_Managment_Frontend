# Design System — OmniAdmin

Reference: Voyage AI dashboard style — clean, minimal, white sidebar, dark top bar.

Every new page and component MUST follow these rules exactly.

---

## Core Color Tokens

| Token          | Value     | Usage                                          |
|----------------|-----------|------------------------------------------------|
| Top bar BG     | `#1C1828` | Dark top bar background (full width)           |
| Active/Accent  | `#2E6B5E` | Active nav item bg, primary buttons, branding  |
| Sidebar BG     | `#FFFFFF` | White sidebar background                       |
| Content BG     | `#FFFFFF` | Main content area                              |
| Disabled Field | `#F5F5F5` | Read-only / disabled input background          |
| Muted Text     | `#6B7280` | Secondary text, placeholders                   |
| Borders        | `#D1D5DB` | All borders (inputs, sidebar divider)          |
| Sidebar border | `#E5E7EB` | `border-r` separating sidebar from content     |

In Tailwind:
- `bg-[#1C1828]` → top bar
- `bg-brand-500` / `text-brand-500` → `#2E6B5E` teal (active items, buttons)
- `border-slate-200` → sidebar/card borders
- `border-[#D1D5DB]` → input borders

---

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Dark top bar h-11 bg-[#1C1828] — FULL WIDTH        │
├────────────────────┬────────────────────────────────┤
│  Sidebar w-60      │  Content area                  │
│  bg-white          │  bg-white                      │
│  border-r          │  px-8 py-6                     │
│  border-slate-200  │  overflow-y-auto               │
└────────────────────┴────────────────────────────────┘
```

- **Top bar**: `h-11`, `bg-[#1C1828]`, spans full width (sidebar + content column)
- **Sidebar**: `w-60` (240px), `bg-white`, `border-r border-slate-200`
- **Content**: `bg-white`, `px-8 py-6`, scrollable

---

## Typography

| Role           | Size / Weight | Tailwind                           |
|----------------|---------------|------------------------------------|
| Page title     | 20px / 500    | `text-[20px] font-medium`          |
| Section label  | 14px / 500    | `text-[14px] font-medium`          |
| Body / input   | 13px / 400    | `text-[13px]`                      |
| Hint / caption | 12px / 400    | `text-[12px] text-slate-400`       |
| Nav item       | 13px / 500    | `text-[13px] font-medium`          |
| Sidebar section| 11px / 600    | `text-[11px] font-semibold uppercase tracking-wider text-slate-400` |

Font: `Fira Code` (monospace) — set globally.

---

## Top Bar Anatomy

- Background: `bg-[#1C1828]`
- Height: `h-11`
- Left: Breadcrumb — `OmniAdmin ❯ Current Page` in small white text
- Right: User avatar + name (white/dimmed)
- NO borders, NO shadow — pure dark strip

---

## Sidebar Anatomy

- Background: `bg-white`, `border-r border-slate-200`
- **Section labels**: `text-[11px] font-semibold uppercase tracking-wider text-slate-400`, padding `px-3 pt-4 pb-1`
- **Active item**: `bg-brand-500 text-white rounded-md` — teal background, white text, NO left border
- **Inactive item**: `text-slate-700`, hover: `hover:bg-slate-100 hover:text-slate-900`
- **Sub-items**: same active/inactive logic, slightly smaller text `text-[12px]`
- **Accordion**: sub-items inside `border-l border-slate-200 ml-3 pl-3`
- Icons: `size={15}` for top-level, `size={13}` for sub-items

### Adding nav items
Edit `NAV_ITEMS` or `ADMIN_ITEMS` in [Sidebar.jsx](src/components/layout/Sidebar.jsx).

---

## Component Styles (index.css)

### Cards
```
.card — bg-white, border border-slate-200, rounded-lg, subtle shadow
```

### Inputs
```
.input-base — border border-[#D1D5DB], rounded-md, text-[13px], focus:border-brand-500
Disabled: bg-[#F5F5F5], pointer-events-none, no focus ring
```

### Buttons
```
.btn-primary   — bg-brand-500 hover:bg-brand-600, white text, rounded-md, text-[13px]
.btn-secondary — bg-white, border border-[#D1D5DB], slate-700 text
.btn-danger    — bg-white, border border-red-200, red-600 text
```

---

## Key Design Rules

1. **Two-zone layout**: Dark top bar (#1C1828) + everything below is white. Never add dark bg inside content.
2. **Single accent**: Teal `#2E6B5E` (brand-500) for active nav + primary buttons ONLY.
3. **White sidebar**: Clean, no background colors on nav items except the active teal.
4. **No card borders on inner content**: Use `.card` only for tables/list containers, not for form field groups.
5. **Disabled = gray fill**: `#F5F5F5`, no pointer events, no focus ring.
6. **Minimal radius**: `rounded-md` for inputs/buttons, `rounded-lg` for cards, `rounded-full` for avatars.
7. **No shadows except cards**: Don't add shadow to buttons or inputs.

---

## Adding a New Page — Checklist

- [ ] Add route to `App.jsx` inside the `DashboardLayout` route group
- [ ] Add nav item to `Sidebar.jsx` `NAV_ITEMS`
- [ ] Add page title mapping to `Header.jsx` `TITLES` object
- [ ] Page heading: `<h1 className="text-[20px] font-medium text-slate-900 mb-6">`
- [ ] Section labels: `<p className="text-[14px] font-medium text-slate-800 mb-3">`
- [ ] Hint text: `<p className="text-[12px] text-slate-400 mt-1">`
- [ ] Use `<Button>` component (maps to `.btn-primary` etc.)
- [ ] Use `<Input>` component (maps to `.input-base`)
- [ ] Tables/containers: `<div className="card">`
- [ ] Background: always `bg-white` — no colored section backgrounds
