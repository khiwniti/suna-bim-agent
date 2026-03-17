# Carbon Landing Page & Components Migration Design

**Date:** 2026-03-17
**Status:** Draft
**Reference:** https://autonomous-bim-agent.vercel.app/

## Overview

Migrate the complete carbon credit landing page and related components from `src.zip` to the Kortix project, preserving all existing Kortix features (agents, dashboard, settings, billing, etc.).

## Goals

1. **Exact Visual Match**: Landing page should look identical to `autonomous-bim-agent.vercel.app`
2. **Zero Regression**: All existing Kortix features must work perfectly
3. **Theme Coexistence**: Carbon theme for landing/public pages, existing theme for dashboard/app

## Architecture

### Strategy: Scoped Theme Migration

```
┌─────────────────────────────────────────────────────────────┐
│                        globals.css                           │
├─────────────────────────────────────────────────────────────┤
│  :root { /* Existing Kortix variables - UNCHANGED */ }      │
│  .dark { /* Existing Kortix dark mode - UNCHANGED */ }      │
│                                                              │
│  /* NEW: Carbon-scoped theme */                              │
│  .carbon-theme { /* Carbon Emerald/Teal variables */ }      │
│  .carbon-theme.dark { /* Carbon dark mode */ }              │
│                                                              │
│  /* NEW: Carbon utilities & animations */                    │
│  .glass-effect, .carbon-gradient, @keyframes float, etc.    │
└─────────────────────────────────────────────────────────────┘
```

### File Structure After Migration

```
apps/frontend/src/
├── app/
│   ├── globals.css                    # MODIFIED: Add carbon theme section
│   ├── (home)/
│   │   ├── layout.tsx                 # MODIFIED: Add carbon-theme class
│   │   └── page.tsx                   # MODIFIED: Use new LandingPage
│   └── (dashboard)/                   # UNCHANGED
│
├── components/
│   ├── landing/
│   │   ├── index.ts                   # MODIFIED: Export new components
│   │   ├── landing-page.tsx           # REPLACED: Full carbon landing
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
├── i18n/
│   ├── en.json                        # MODIFIED: Add landing translations
│   ├── th.json                        # NEW: Thai translations
│   ├── provider.tsx                   # NEW: i18n provider
│   ├── LanguageSwitcher.tsx           # NEW
│   └── [existing i18n...]             # UNCHANGED
│
└── hooks/
    ├── panel-data/
    │   └── useCarbonData.ts           # NEW
    └── [existing hooks...]            # UNCHANGED
```

## CSS Migration Details

### Section 1: Preserve Existing Variables (NO CHANGES)

```css
/* These stay EXACTLY as they are */
:root {
  --background: oklch(0.9741 0 129.63);
  --foreground: oklch(0.2277 0.0034 67.65);
  --primary: oklch(0.205 0 0);
  /* ... all existing variables ... */
}

.dark {
  --background: oklch(0.185 0.005 285.823);
  /* ... all existing dark variables ... */
}
```

### Section 2: Add Carbon Theme Scope (NEW)

```css
/* Carbon theme - applied via .carbon-theme class on layout */
.carbon-theme {
  /* Override core colors for carbon pages */
  --background: #fafcfb;
  --foreground: #0c1811;
  --primary: #10b981;
  --primary-foreground: #ffffff;
  --primary-hover: #059669;
  --primary-glow: rgba(16, 185, 129, 0.35);
  --secondary: #ecfdf5;
  --secondary-foreground: #065f46;
  --accent: #06b6d4;
  --accent-foreground: #ffffff;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --card: #ffffff;
  --card-foreground: #0c1811;
  --ring: #10b981;

  /* Carbon-specific additions */
  --gradient-start: #10b981;
  --gradient-mid: #06b6d4;
  --gradient-end: #8b5cf6;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.3);
  --shadow-glow: 0 0 40px var(--primary-glow);
}

.carbon-theme.dark {
  --background: #030a08;
  --foreground: #f0fdf4;
  --primary: #34d399;
  --primary-foreground: #022c22;
  --primary-hover: #6ee7b7;
  --primary-glow: rgba(52, 211, 153, 0.3);
  --secondary: #064e3b;
  --secondary-foreground: #d1fae5;
  --accent: #22d3ee;
  --accent-foreground: #042f2e;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --border: #1e3a36;
  --card: #0d1f1a;
  --card-foreground: #f0fdf4;
  --ring: #34d399;

  --gradient-start: #34d399;
  --gradient-mid: #22d3ee;
  --gradient-end: #a78bfa;
  --glass-bg: rgba(13, 31, 26, 0.8);
  --glass-border: rgba(52, 211, 153, 0.15);
}
```

### Section 3: Add Carbon Utilities & Animations (NEW)

```css
/* Gradient text effect */
.carbon-theme .gradient-text {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glass card effect */
.carbon-theme .glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
}

/* Glow shadow */
.carbon-theme .shadow-glow {
  box-shadow: var(--shadow-glow);
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px var(--primary-glow); }
  50% { box-shadow: 0 0 40px var(--primary-glow); }
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

/* Scrollbar for carbon theme */
.carbon-theme::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--muted-foreground) 0%, var(--muted) 100%);
}

.carbon-theme::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}
```

## Component Migration Details

### LandingPage Component

**Source:** `/tmp/src_extract/src/components/landing/LandingPage.tsx` (43KB, ~1100 lines)

**Key Features to Migrate:**
- FloatingParticles background effect
- GradientOrb animated blobs
- MeshGradient backdrop
- Hero section with chat input
- Value proposition cards
- Comparison table (vs competitors)
- "How It Works" steps
- Testimonials
- Stats counters
- CTA sections

**Import Adaptations Required:**
```tsx
// Source imports
import { useTranslation } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadProgress } from '@/components/chat/UploadProgress';

// Target adaptations
import { useTranslations } from 'next-intl';  // Use existing next-intl
import { LocaleSwitcher } from '@/components/home/locale-switcher';  // Use existing
// useFileUpload and UploadProgress need to be checked for compatibility
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

### i18n Translations

**English additions needed:** ~2,000 translation keys for landing page
**Thai translations:** Full th.json (130KB)

**Strategy:** Merge with existing `next-intl` setup rather than adding new provider

## Layout Integration

### (home)/layout.tsx Modification

```tsx
// Current
export default function HomeLayout({ children }) {
  return <div>{children}</div>;
}

// After
export default function HomeLayout({ children }) {
  return (
    <div className="carbon-theme">
      {children}
    </div>
  );
}
```

This ensures:
- Landing page gets carbon theme
- Dashboard routes remain unaffected (different layout)

## Migration Steps (Implementation Order)

### Phase 1: CSS Foundation
1. Add `.carbon-theme` variables to globals.css
2. Add carbon utility classes
3. Add new animations
4. Test that existing pages are unaffected

### Phase 2: Landing Page Components
1. Create new component files in `components/landing/`
2. Split LandingPage.tsx into smaller components
3. Adapt imports to use existing Kortix utilities
4. Update (home)/layout.tsx with carbon-theme class

### Phase 3: Carbon Library
1. Copy `lib/carbon/` directory
2. Verify TypeScript types compatibility
3. Update import paths

### Phase 4: Additional Components
1. Add `components/carbon/` (certification)
2. Add `components/calculator/`
3. Add `stores/carbon-store.ts`

### Phase 5: i18n Integration
1. Merge landing translations into existing en.json
2. Add th.json for Thai support
3. Test language switching

### Phase 6: Testing & Verification
1. Visual comparison with live site
2. Test all existing Kortix features
3. Test dark/light mode
4. Test responsive design

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CSS conflicts breaking existing UI | Use `.carbon-theme` scoping |
| Import path differences | Map paths during migration |
| i18n provider conflicts | Use existing next-intl |
| Missing dependencies | Check package.json compatibility |
| TypeScript errors | Update tsconfig paths if needed |

## Success Criteria

1. Landing page visually matches `autonomous-bim-agent.vercel.app`
2. All existing Kortix pages work without visual changes
3. Dark/light mode works on both themes
4. No TypeScript/ESLint errors
5. No console errors
6. Build completes successfully

## Files Changed Summary

| Category | New | Modified | Unchanged |
|----------|-----|----------|-----------|
| CSS | 0 | 1 (globals.css) | - |
| Components | ~20 | 2 | ~200+ |
| Library | 12 | 0 | - |
| i18n | 2 | 1 | - |
| Stores | 1 | 0 | - |
| Hooks | 1 | 0 | - |

**Total estimated: ~35 new files, 4 modified files**
