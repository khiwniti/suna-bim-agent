# Carbon Landing Page & Components Migration Design

**Date:** 2026-03-17
**Status:** Draft (Revised v2)
**Reference:** https://autonomous-bim-agent.vercel.app/

## Overview

Migrate the complete carbon credit landing page and related components from `src.zip` to the Carbon BIM project, **preserving all existing Carbon BIM features** (agents, dashboard, settings, billing, thread, triggers, etc.).

## Goals

1. **Exact Visual Match**: Landing page should look identical to `autonomous-bim-agent.vercel.app`
2. **Zero Regression**: All existing Carbon BIM features must work perfectly
3. **Theme Coexistence**: Carbon theme for landing/public pages, existing theme for dashboard/app

## Architecture

### Strategy: Namespaced CSS Variables (SAFE)

**CRITICAL**: Use `--carbon-*` prefixed variables to prevent ANY leakage to existing components.

```
┌─────────────────────────────────────────────────────────────┐
│                        globals.css                           │
├─────────────────────────────────────────────────────────────┤
│  :root { /* Existing Carbon BIM variables - UNCHANGED */ }      │
│  .dark { /* Existing Carbon BIM dark mode - UNCHANGED */ }      │
│                                                              │
│  /* NEW: Carbon-namespaced variables (NO CONFLICTS) */      │
│  :root {                                                     │
│    --carbon-primary: #10b981;                               │
│    --carbon-accent: #06b6d4;                                │
│    /* etc... */                                              │
│  }                                                           │
│                                                              │
│  /* NEW: Carbon utilities & animations (namespaced) */      │
│  .carbon-gradient-text, @keyframes carbon-float, etc.       │
└─────────────────────────────────────────────────────────────┘
```

### File Structure After Migration

```
apps/frontend/src/
├── app/
│   ├── globals.css                    # MODIFIED: Add carbon variables (namespaced)
│   ├── (home)/
│   │   ├── layout.tsx                 # UNCHANGED (no class modification needed)
│   │   └── page.tsx                   # MODIFIED: Use new LandingPage
│   └── (dashboard)/                   # UNCHANGED
│
├── components/
│   ├── landing/
│   │   ├── index.ts                   # MODIFIED: Export new components
│   │   ├── landing-page.tsx           # REPLACED: Full carbon landing
│   │   ├── CarbonLogo.tsx             # NEW: Carbon brand logo
│   │   ├── CarbonNavbar.tsx           # NEW: Landing page navbar
│   │   ├── FloatingParticles.tsx      # NEW
│   │   ├── GradientOrb.tsx            # NEW
│   │   ├── MeshGradient.tsx           # NEW
│   │   ├── ValueCard.tsx              # NEW
│   │   ├── ComparisonRow.tsx          # NEW
│   │   ├── TestimonialCard.tsx        # NEW
│   │   ├── HowItWorksStep.tsx         # NEW
│   │   └── StatCounter.tsx            # NEW
│   │
│   ├── carbon/                        # NEW DIRECTORY
│   │   ├── index.ts
│   │   ├── CertificationCard.tsx
│   │   └── CertificationDashboard.tsx
│   │
│   ├── calculator/                    # NEW DIRECTORY
│   │   ├── index.ts
│   │   ├── CarbonCalculator.tsx
│   │   ├── CarbonAnalyticsDashboard.tsx
│   │   ├── BOQAnalyzer.tsx
│   │   ├── MaterialBrowser.tsx
│   │   ├── MaterialSelector.tsx
│   │   ├── EmissionsChart.tsx
│   │   ├── RecommendationsPanel.tsx
│   │   └── ReportExportButtons.tsx
│   │
│   └── [existing components...]       # UNCHANGED
│
├── lib/
│   ├── carbon/                        # NEW DIRECTORY
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── calculator.ts
│   │   ├── emission-factors.ts
│   │   ├── thai-materials.ts
│   │   ├── analysis-pipeline.ts
│   │   ├── knowledge-graph.ts
│   │   ├── ifc-calculator-integration.ts
│   │   ├── ifc-material-mapper.ts
│   │   ├── kkp-boq-integration.ts
│   │   ├── trees-certification.ts
│   │   ├── tver-templates.ts
│   │   └── bank-reports.ts
│   │
│   └── [existing lib...]              # UNCHANGED
│
├── stores/
│   ├── carbon-store.ts                # NEW
│   └── [existing stores...]           # UNCHANGED
│
└── hooks/
    ├── panel-data/
    │   └── useCarbonData.ts           # NEW
    └── [existing hooks...]            # UNCHANGED
```

## CSS Migration Details

### Section 1: Preserve Existing Variables (NO CHANGES)

```css
/* These stay EXACTLY as they are - DO NOT MODIFY */
:root {
  --background: oklch(0.9741 0 129.63);
  --foreground: oklch(0.2277 0.0034 67.65);
  --primary: oklch(0.205 0 0);
  /* ... all existing variables stay unchanged ... */
}

.dark {
  --background: oklch(0.185 0.005 285.823);
  /* ... all existing dark variables stay unchanged ... */
}
```

### Section 2: Add Carbon-Namespaced Variables (NEW - ADDITIVE ONLY)

```css
/* ============================================
   CARBON THEME VARIABLES (Namespaced)
   These are ADDITIVE - they don't override anything
   ============================================ */
:root {
  /* Carbon Primary Colors */
  --carbon-primary: #10b981;
  --carbon-primary-foreground: #ffffff;
  --carbon-primary-hover: #059669;
  --carbon-primary-glow: rgba(16, 185, 129, 0.35);

  /* Carbon Secondary/Accent */
  --carbon-secondary: #ecfdf5;
  --carbon-secondary-foreground: #065f46;
  --carbon-accent: #06b6d4;
  --carbon-accent-foreground: #ffffff;

  /* Carbon Surfaces */
  --carbon-background: #fafcfb;
  --carbon-foreground: #0c1811;
  --carbon-muted: #f1f5f9;
  --carbon-muted-foreground: #64748b;
  --carbon-border: #e2e8f0;
  --carbon-card: #ffffff;
  --carbon-card-foreground: #0c1811;

  /* Carbon Gradients */
  --carbon-gradient-start: #10b981;
  --carbon-gradient-mid: #06b6d4;
  --carbon-gradient-end: #8b5cf6;

  /* Carbon Glass Effects */
  --carbon-glass-bg: rgba(255, 255, 255, 0.7);
  --carbon-glass-border: rgba(255, 255, 255, 0.3);

  /* Carbon Shadows */
  --carbon-shadow-glow: 0 0 40px var(--carbon-primary-glow);
  --carbon-shadow-glow-sm: 0 0 20px var(--carbon-primary-glow);
}

.dark {
  /* Carbon Dark Mode (namespaced) */
  --carbon-primary: #34d399;
  --carbon-primary-foreground: #022c22;
  --carbon-primary-hover: #6ee7b7;
  --carbon-primary-glow: rgba(52, 211, 153, 0.3);

  --carbon-secondary: #064e3b;
  --carbon-secondary-foreground: #d1fae5;
  --carbon-accent: #22d3ee;
  --carbon-accent-foreground: #042f2e;

  --carbon-background: #030a08;
  --carbon-foreground: #f0fdf4;
  --carbon-muted: #1e293b;
  --carbon-muted-foreground: #94a3b8;
  --carbon-border: #1e3a36;
  --carbon-card: #0d1f1a;
  --carbon-card-foreground: #f0fdf4;

  --carbon-gradient-start: #34d399;
  --carbon-gradient-mid: #22d3ee;
  --carbon-gradient-end: #a78bfa;

  --carbon-glass-bg: rgba(13, 31, 26, 0.8);
  --carbon-glass-border: rgba(52, 211, 153, 0.15);
}
```

### Section 3: Add Carbon Utilities & Animations (NEW - NAMESPACED)

```css
/* ============================================
   CARBON UTILITY CLASSES (All namespaced)
   ============================================ */

/* Gradient text effect */
.carbon-gradient-text {
  background: linear-gradient(135deg, var(--carbon-gradient-start), var(--carbon-gradient-mid), var(--carbon-gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glass card effect */
.carbon-glass-card {
  background: var(--carbon-glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--carbon-glass-border);
}

/* Glow shadow */
.carbon-shadow-glow {
  box-shadow: var(--carbon-shadow-glow);
}

/* Carbon-specific backgrounds */
.carbon-bg-primary {
  background-color: var(--carbon-primary);
}

.carbon-text-primary {
  color: var(--carbon-primary);
}

.carbon-border-primary {
  border-color: var(--carbon-primary);
}

/* ============================================
   CARBON ANIMATIONS (All namespaced)
   ============================================ */
@keyframes carbon-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

@keyframes carbon-pulse-glow {
  0%, 100% { box-shadow: 0 0 20px var(--carbon-primary-glow); }
  50% { box-shadow: 0 0 40px var(--carbon-primary-glow); }
}

@keyframes carbon-bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes carbon-pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes carbon-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes carbon-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Animation utility classes */
.carbon-animate-float {
  animation: carbon-float 6s ease-in-out infinite;
}

.carbon-animate-pulse-glow {
  animation: carbon-pulse-glow 2s ease-in-out infinite;
}

.carbon-animate-bounce-in {
  animation: carbon-bounce-in 0.6s ease-out;
}
```

## Component Migration Details

### Logo & Branding Components

**IMPORTANT**: Carbon branding elements for landing page ONLY (does not replace Carbon BIM/dashboard logos).

**Source Files:**
- Logo component: `/tmp/src_extract/src/components/ui/Logo.tsx`
- Usage in landing: LandingPage.tsx header (lines 538-555)
- Usage in footer: LandingPage.tsx footer (lines 1132-1134)

**Brand Elements to Migrate:**

1. **Carbon Logo Icon**:
   - Icon: `Leaf` from lucide-react (NOT Building2 used in Carbon BIM)
   - Container: `w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-purple-500`
   - Shadow: `shadow-lg shadow-primary/30`
   - Hover effect: `rotate: 10, scale: 1.1` with spring animation

2. **Brand Text**:
   - Text: "BIM Carbon" (gradient-text class)
   - Badge: `🇹🇭 Thailand` in `bg-primary/10 text-primary` pill

3. **CSS Class Adaptations for Logo:**
```tsx
// BEFORE (source - uses non-namespaced vars)
className="bg-gradient-to-br from-primary via-accent to-purple-500"

// AFTER (safe - uses carbon namespaced vars)
className="bg-gradient-to-br from-[var(--carbon-primary)] via-[var(--carbon-accent)] to-purple-500"
```

4. **Footer Logo**:
   - Smaller version: `w-6 h-6` container with `Leaf w-3 h-3`
   - Used with copyright text

**Files to Create:**
```
components/landing/
├── CarbonLogo.tsx       # NEW: Carbon brand logo component
└── CarbonNavbar.tsx     # NEW: Landing page navbar with logo
```

### LandingPage Component

**Source:** `/tmp/src_extract/src/components/landing/LandingPage.tsx` (43KB, ~1100 lines)

**Key Features to Migrate:**
- **Header/Navbar with CarbonLogo** (lines 536-584)
- FloatingParticles background effect
- GradientOrb animated blobs
- MeshGradient backdrop
- Hero section with chat input (Leaf icon branding)
- Value proposition cards
- Comparison table (vs competitors)
- "How It Works" steps
- Testimonials
- Stats counters
- CTA sections
- **Footer with CarbonLogo** (lines 1123-1138)

**Import Adaptations Required:**
```tsx
// Source imports → Target adaptations
import { useTranslation } from '@/i18n/provider'  →  import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/i18n/...'     →  import { LocaleSwitcher } from '@/components/home/locale-switcher'
import { cn } from '@/lib/utils'                   →  SAME (exists in Carbon BIM)
import { Button } from '@/components/ui/button'    →  SAME (exists in Carbon BIM)
```

**CSS Class Adaptations in Components:**
```tsx
// Source uses standard Tailwind classes that reference --primary, --accent, etc.
// These need to be changed to carbon-namespaced classes:

// BEFORE (would break Carbon BIM)
className="bg-primary text-primary-foreground"
className="from-primary to-accent"

// AFTER (safe, uses carbon variables)
className="carbon-bg-primary text-white"
className="from-[var(--carbon-primary)] to-[var(--carbon-accent)]"
// OR use Tailwind arbitrary values:
className="bg-[var(--carbon-primary)] text-[var(--carbon-primary-foreground)]"
```

### Carbon Library (`lib/carbon/`)

**Total: 11 files, ~5,000 lines**

| File | Purpose | Dependencies |
|------|---------|--------------|
| `types.ts` | TypeScript interfaces | None |
| `calculator.ts` | Core calculation logic | types.ts |
| `emission-factors.ts` | CO2 factors database | types.ts |
| `thai-materials.ts` | Thai material database (2,200 lines) | types.ts |
| `analysis-pipeline.ts` | Full analysis workflow | All above |
| `knowledge-graph.ts` | Material relationships | types.ts |
| `ifc-calculator-integration.ts` | BIM integration | types.ts, calculator |
| `ifc-material-mapper.ts` | Material mapping | thai-materials |
| `kkp-boq-integration.ts` | BOQ parsing | types.ts |
| `trees-certification.ts` | TREES certification | types.ts |
| `tver-templates.ts` | T-VER templates | types.ts |
| `bank-reports.ts` | Bank reporting | types.ts |

## i18n Integration

**IMPORTANT**: Use existing `next-intl` infrastructure, NOT new provider.

**Existing Carbon BIM i18n:**
- Config: `src/i18n/config.ts`
- Translations: `apps/frontend/translations/en.json`, `th.json` (already exists, 40KB)
- Switcher: `components/home/locale-switcher.tsx`

**Migration Strategy:**
1. Merge carbon landing translations INTO existing `translations/en.json`
2. Merge Thai translations INTO existing `translations/th.json`
3. Use existing `useTranslations` hook from next-intl
4. Use existing `LocaleSwitcher` component

**NO NEW i18n FILES NEEDED** - just merge translation keys.

## Layout Integration

**IMPORTANT**: NO layout modification needed with namespaced approach.

The landing page components will directly use `--carbon-*` variables via Tailwind arbitrary values or carbon utility classes. No `.carbon-theme` wrapper class is required.

```tsx
// (home)/layout.tsx - NO CHANGES NEEDED
export default function HomeLayout({ children }) {
  return <div>{children}</div>;
}
```

## Migration Steps (Implementation Order)

### Phase 1: CSS Foundation
1. Add `--carbon-*` namespaced variables to globals.css (additive only)
2. Add `carbon-*` utility classes
3. Add `carbon-*` keyframe animations
4. **VERIFY**: Run existing Carbon BIM app, confirm NO visual changes

### Phase 2: Landing Page Components
1. Create new component files in `components/landing/`
2. Migrate LandingPage.tsx with CSS class adaptations
3. Update imports to use existing Carbon BIM utilities
4. **VERIFY**: Landing page matches reference site

### Phase 3: Carbon Library
1. Copy `lib/carbon/` directory
2. Update import paths (`@/types/database` → check if exists)
3. Verify TypeScript compilation
4. **VERIFY**: No TS errors

### Phase 4: Additional Components
1. Add `components/carbon/` (certification)
2. Add `components/calculator/`
3. Add `stores/carbon-store.ts`

### Phase 5: i18n Integration
1. Merge landing translations into `translations/en.json`
2. Merge Thai translations into `translations/th.json`
3. **VERIFY**: Language switching works

### Phase 6: Testing & Verification
(See Regression Test Checklist below)

## Regression Test Checklist

**CRITICAL: All must pass before migration is complete**

### Dashboard Routes (must be visually UNCHANGED)
- [ ] `/dashboard` - Main dashboard loads correctly
- [ ] `/agents` - Agents page renders with correct styling
- [ ] `/agents/[threadId]` - Thread detail page works
- [ ] `/settings/api-keys` - API keys page functional
- [ ] `/settings/credentials` - Credentials page functional
- [ ] `/billing` - Billing/subscription page works
- [ ] `/knowledge` - Knowledge base page works
- [ ] `/files` - Files page works
- [ ] `/triggers` - Triggers page works

### Auth Routes (must work)
- [ ] `/auth` - Login page functional
- [ ] `/auth/password` - Password page works
- [ ] `/auth/reset-password` - Reset works

### UI Components (must be unchanged)
- [ ] Sidebar navigation - correct colors
- [ ] Buttons - correct primary/secondary styling
- [ ] Cards - correct background/border
- [ ] Modals/Dialogs - correct backdrop
- [ ] Toasts - correct styling
- [ ] Dark mode toggle - works on all pages

### Landing Page (new - must match reference)
- [ ] Visually matches `autonomous-bim-agent.vercel.app`
- [ ] Emerald/Teal color scheme
- [ ] Animations working
- [ ] Dark/light mode works
- [ ] Responsive design works

## Rollback Strategy

```bash
# Before starting migration
git checkout -b feature/carbon-landing-migration

# Checkpoint commits after each phase
git commit -m "Phase 1: Add carbon CSS variables"
git commit -m "Phase 2: Add landing page components"
# etc.

# If issues found:
git checkout main  # Rollback to pre-migration state
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CSS conflicts breaking existing UI | Use `--carbon-*` prefix (NEVER override existing vars) |
| Animations conflicting | Use `carbon-*` prefix on keyframes |
| i18n breaking | Use existing next-intl, only add translation keys |
| TypeScript errors | Verify tsconfig paths before copying |
| Component import errors | Map all paths before migration |

## Success Criteria

1. ✅ Landing page visually matches `autonomous-bim-agent.vercel.app`
2. ✅ All existing Carbon BIM pages work WITHOUT any visual changes
3. ✅ Dark/light mode works on BOTH themes
4. ✅ No TypeScript/ESLint errors
5. ✅ No console errors
6. ✅ Build completes successfully
7. ✅ All regression tests pass

## Files Changed Summary

| Category | New | Modified | Unchanged |
|----------|-----|----------|-----------|
| CSS | 0 | 1 (globals.css - additive only) | - |
| Components | ~22 | 1 (landing/index.ts) | ~200+ |
| Library | 12 | 0 | - |
| Translations | 0 | 2 (merge keys only) | - |
| Stores | 1 | 0 | - |
| Hooks | 1 | 0 | - |
| Layouts | 0 | 0 | All |

**Total estimated: ~37 new files, 3 modified files (additive changes only)**

**Logo/Branding Notes:**
- CarbonLogo uses Leaf icon (lucide-react) with gradient container
- Brand text is "BIM Carbon" with gradient effect
- Thailand badge "🇹🇭" shows regional focus
- Footer uses smaller logo variant
- ALL logo styling uses `--carbon-*` variables (no conflict with Carbon BIM logos)
