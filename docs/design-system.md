# Design System — Luxurious

> A premium HSL-based design system for the Luxurious crypto trading management platform.
> Supports **Light** and **Dark** modes. The secondary brand color is **Gold** (replacing the violet from the original reference project).

---

## 🎨 Color Palette

### Core Token Reference

| Variable | Light Mode HSL | Dark Mode HSL | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `214 45% 98%` | `221 49% 11%` | Page/app background |
| `--foreground` | `222 47% 11%` | `213 36% 97%` | Primary text color |
| `--card` | `0 0% 100%` | `218 40% 14%` | Card/panel surface |
| `--card-foreground` | `222 47% 11%` | `213 36% 97%` | Text on cards |
| `--primary` | `221 83% 53%` | `221 83% 53%` | Brand blue |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | Text on primary |
| `--secondary` | `43 96% 48%` | `43 96% 48%` | **Brand Gold** ✨ |
| `--secondary-foreground` | `0 0% 100%` | `222 47% 11%` | Text on gold |
| `--accent` | `216 100% 96%` | `218 46% 18%` | Subtle accent surface |
| `--muted` | `215 44% 94%` | `217 31% 20%` | Muted background |
| `--muted-foreground` | `216 23% 45%` | `213 36% 65%` | Muted text |
| `--border` | `215 32% 90%` | `218 36% 24%` | Default border |
| `--input` | `215 32% 90%` | `218 36% 24%` | Input border |
| `--ring` | `221 83% 53%` | `221 83% 53%` | Focus ring |
| `--radius` | `0.875rem` | `0.875rem` | Base corner radius |

### 🥇 Gold Secondary (Luxurious Brand)

The gold replaces the violet secondary from the reference project. Use gold for:
- Premium badges / rank indicators
- Call-to-action accents
- Highlight borders on selected member cards
- Status indicators for top-tier members

```css
/* Gold token */
--secondary: 43 96% 48%;           /* #f5a500 — Rich Gold */
--secondary-foreground: 0 0% 100%; /* White text on gold (dark bg) */
--secondary-muted: 43 96% 90%;     /* Pale gold for light backgrounds */
--secondary-glow: 43 96% 60%;      /* Brighter gold for hover/glow */
```

### Functional Colors

| Type | HSL | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `152 69% 42%` | `text-emerald-500` | Profit, active status |
| **Warning** | `37 92% 50%` | `text-amber-500` | Pending, caution |
| **Destructive** | `0 84% 61%` | `text-red-500` | Errors, loss, ban |
| **Info** | `217 91% 60%` | `text-blue-500` | Informational notices |
| **Gold Accent** | `43 96% 48%` | `text-[hsl(var(--secondary))]` | Rank highlights |

---

## 🔡 Typography

### Font Stack

```
Primary: "Geist", "Inter", "Segoe UI", Arial, sans-serif
Font features: cv02, cv03, cv04, cv11
```

### Scale

| Element | Size / Weight | Usage |
| :--- | :--- | :--- |
| **Hero Headline** | `32px mobile / 44px desktop / bold` | `Build the network.` landing headline |
| **Hero Name** | `24px / bold` | Viewer name inside owl hero |
| **Large Stat** | `40px / bold` | Home stat tiles |
| **Section Header** | `22px / bold` | Org chart and members cards |
| **Body Base** | `14px / normal` | Default UI text |
| **Body Small** | `12px / normal` | Helper copy, timestamps, status rows |
| **Labels** | `11px / extrabold / uppercase / tracking-[0.14em]` | Section labels |
| **Sidebar Labels** | `10px / bold / uppercase / tracking-[0.18em]` | Nav group titles |
| **Version Badge** | `10px / bold` | Version text |

---

## 🧊 UI Components & Styling

### Layout

| Property | Value |
| :--- | :--- |
| Sidebar Width | `232px` |
| Main Container | `flex min-h-screen bg-background` |
| Min App Width | `1180px` |
| Card Padding | `p-5` / `p-4` |
| Section Spacing | `space-y-5` |

### Corner Radius

| Context | Value |
| :--- | :--- |
| Base (`--radius`) | `0.875rem` (14px) |
| Cards | `16px` / `rounded-2xl` |
| Buttons / Badges | `12px` / `rounded-xl` |
| Nav Items | `8px` / `rounded-lg` |
| Input Fields | `10px` / `rounded-xl` |

### Shadows

| Mode | Value |
| :--- | :--- |
| Light Card | `0 20px 50px -38px hsl(215 44% 70%)` |
| Dark Card | `inset 0 1px 0 rgb(255 255 255 / 0.03)` |
| Gold Glow | `0 0 16px hsl(43 96% 48% / 0.35)` |

### Sidebar Branding Card

- Background: `#2563eb` (Solid Blue)
- Pattern: `radial-gradient(circle, white 1px, transparent 1px)` at 16px size, 20% opacity
- Text: White, secondary info in `blue-100`
- Logo: Monogram or icon in white

### Dashboard Hero Card

- Background: `#F5F8FF -> #DDE9FF` in light, `#26459E -> #1E3A8A` in dark
- Shape: `34px` radius, `22px / 18px / 18px / 0` padding pattern
- Summary panel: white in light, deep navy overlay in dark
- Mascot: owl art required on home hero for parity with mobile

---

## 🛠️ Tailwind CSS Config Integration

Add to `tailwind.config.js` / `tailwind.config.ts`:

```js
theme: {
  extend: {
    colors: {
      border:  "hsl(var(--border))",
      input:   "hsl(var(--input))",
      ring:    "hsl(var(--ring))",
      background:  "hsl(var(--background))",
      foreground:  "hsl(var(--foreground))",
      primary: {
        DEFAULT:    "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT:    "hsl(var(--secondary))",   // Gold
        foreground: "hsl(var(--secondary-foreground))",
        muted:      "hsl(var(--secondary-muted))",
        glow:       "hsl(var(--secondary-glow))",
      },
      accent: {
        DEFAULT:    "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      muted: {
        DEFAULT:    "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      card: {
        DEFAULT:    "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
      destructive: {
        DEFAULT:    "hsl(0 84% 61%)",
        foreground: "hsl(0 0% 100%)",
      },
    },
    borderRadius: {
      lg:   "var(--radius)",
      md:   "calc(var(--radius) - 2px)",
      sm:   "calc(var(--radius) - 4px)",
      xl:   "calc(var(--radius) + 2px)",
      "2xl":"calc(var(--radius) + 4px)",
    },
    fontFamily: {
      sans: ["Geist", "Inter", "Segoe UI", "Arial", "sans-serif"],
    },
  },
}
```

### CSS Variables (`src/index.css`)

```css
@layer base {
  :root {
    --background:          214 45% 98%;
    --foreground:          222 47% 11%;
    --card:                0 0% 100%;
    --card-foreground:     222 47% 11%;
    --primary:             221 83% 53%;
    --primary-foreground:  0 0% 100%;
    --secondary:           43 96% 48%;     /* Gold */
    --secondary-foreground:0 0% 100%;
    --secondary-muted:     43 96% 90%;
    --secondary-glow:      43 96% 60%;
    --accent:              216 100% 96%;
    --accent-foreground:   222 47% 11%;
    --muted:               215 44% 94%;
    --muted-foreground:    216 23% 45%;
    --border:              215 32% 90%;
    --input:               215 32% 90%;
    --ring:                221 83% 53%;
    --radius:              0.875rem;
  }

  .dark {
    --background:          221 49% 11%;
    --foreground:          213 36% 97%;
    --card:                218 40% 14%;
    --card-foreground:     213 36% 97%;
    --primary:             221 83% 53%;
    --primary-foreground:  0 0% 100%;
    --secondary:           43 96% 48%;     /* Gold stays vibrant in dark */
    --secondary-foreground:222 47% 11%;
    --secondary-muted:     43 60% 20%;
    --secondary-glow:      43 96% 60%;
    --accent:              218 46% 18%;
    --accent-foreground:   213 36% 97%;
    --muted:               217 31% 20%;
    --muted-foreground:    213 36% 65%;
    --border:              218 36% 24%;
    --input:               218 36% 24%;
    --ring:                221 83% 53%;
  }
}
```

---

## ✨ Org Chart Node Theming

Member cards in the org chart follow a specific visual hierarchy:

| Rank Tier | Card Accent | Badge Color |
| :--- | :--- | :--- |
| Root / Master | Gold border + Gold glow | `secondary` |
| Upline (L1) | Primary blue border | `primary` |
| Downline (L2) | Muted border, subtle bg | `muted` |
| Inactive | Dashed border, dimmed text | `destructive` (red dot) |

---

*Last updated: 2026-04-30 | Phase 1 — Dummy Frontend*
