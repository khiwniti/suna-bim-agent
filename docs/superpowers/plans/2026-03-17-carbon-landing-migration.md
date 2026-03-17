# Carbon Landing Page Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the migration of carbon landing page and components from src.zip to Carbon BIM, with zero regression to existing features.

**Architecture:** Namespaced CSS variables (`--carbon-*`) prevent conflicts with 590+ existing Carbon BIM components. Landing uses `bg-[var(--carbon-primary)]` instead of `bg-primary`.

**Tech Stack:** Next.js 14+, Tailwind CSS v4, Framer Motion, next-intl, Zustand, lucide-react

**Spec Reference:** `docs/superpowers/specs/2026-03-17-carbon-landing-migration-design.md`

---

## Implementation Status (Updated 2026-03-17)

| Component | Status | Notes |
|-----------|--------|-------|
| CSS Variables | ✅ DONE | globals.css lines 967-1116 |
| Landing Components (10) | ✅ DONE | CarbonLogo, FloatingParticles, landing-page, etc. |
| landing/index.ts | ✅ DONE | Exports all components |
| Calculator Components (8) | ✅ DONE | CarbonCalculator, BOQAnalyzer, etc. |
| calculator/index.ts | ✅ DONE | Exports all components |
| Carbon Lib - types.ts | ✅ DONE | All types defined |
| Carbon Lib - calculator.ts | ✅ DONE | Calculation functions |
| Carbon Lib - emission-factors.ts | ✅ DONE | 104+ Thai materials |
| Carbon Lib - trees-certification.ts | ✅ DONE | TREES module |
| Carbon Lib - tver-templates.ts | ✅ DONE | T-VER templates |
| Carbon Lib - kkp-boq-integration.ts | ✅ DONE | BOQ integration |
| Carbon Lib - ifc-material-mapper.ts | ✅ DONE | IFC mapping |
| lib/carbon/index.ts | ❌ MISSING | **Needs creation** |
| lib/carbon/thai-materials.ts | ❌ MISSING | **Needs creation** |
| lib/carbon/analysis-pipeline.ts | ❌ MISSING | **Needs creation** |
| lib/carbon/knowledge-graph.ts | ❌ MISSING | **Needs creation** |
| lib/carbon/ifc-calculator-integration.ts | ❌ MISSING | **Needs creation** |
| lib/carbon/bank-reports.ts | ❌ MISSING | **Needs creation** |
| i18n Translations | ✅ DONE | en.json, th.json merged |
| stores/carbon-store.ts | ❌ MISSING | **Needs creation** |
| hooks/useCarbonData.ts | ❌ MISSING | **Needs creation** |

---

## File Structure Overview

```
apps/frontend/src/
├── app/globals.css                         # MODIFY: Add ~200 lines carbon variables
├── components/
│   ├── landing/
│   │   ├── index.ts                        # MODIFY: Add exports
│   │   ├── landing-page.tsx                # REPLACE: New carbon landing (~1100 lines)
│   │   ├── CarbonLogo.tsx                  # NEW: Logo component
│   │   ├── CarbonNavbar.tsx                # NEW: Navbar with logo
│   │   ├── FloatingParticles.tsx           # NEW: Background effect
│   │   ├── GradientOrb.tsx                 # NEW: Animated blob
│   │   ├── MeshGradient.tsx                # NEW: Backdrop
│   │   ├── ValueCard.tsx                   # NEW: Feature cards
│   │   ├── ComparisonRow.tsx               # NEW: Competitor comparison
│   │   ├── TestimonialCard.tsx             # NEW: Testimonials
│   │   ├── HowItWorksStep.tsx              # NEW: Workflow steps
│   │   └── StatCounter.tsx                 # NEW: Animated stats
│   ├── carbon/                             # NEW DIRECTORY
│   │   ├── index.ts
│   │   ├── CertificationCard.tsx
│   │   └── CertificationDashboard.tsx
│   └── calculator/                         # NEW DIRECTORY (8 files)
├── lib/carbon/                             # NEW DIRECTORY (12 files, ~5000 lines)
├── stores/carbon-store.ts                  # NEW
├── hooks/panel-data/useCarbonData.ts       # NEW
└── translations/
    ├── en.json                             # MODIFY: Merge landing keys
    └── th.json                             # MODIFY: Merge landing keys
```

---

## Chunk 1: CSS Foundation

### Task 1.1: Add Carbon CSS Variables to globals.css

**Files:**
- Modify: `apps/frontend/src/app/globals.css` (append after line 321)

- [ ] **Step 1: Read current end of globals.css**

```bash
tail -50 apps/frontend/src/app/globals.css
```

Verify the file ends around line 966 and identify the last CSS rule.

- [ ] **Step 2: Append carbon variables to globals.css**

Add after the last rule (before any closing braces):

```css
/* ============================================
   CARBON THEME VARIABLES (Namespaced)
   Added: 2026-03-17
   These are ADDITIVE - they don't override anything
   Reference: docs/superpowers/specs/2026-03-17-carbon-landing-migration-design.md
   ============================================ */

/* Carbon Light Mode Variables */
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

/* Carbon Dark Mode Variables */
.dark {
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

- [ ] **Step 3: Verify no syntax errors**

```bash
cd apps/frontend && pnpm build 2>&1 | head -30
```

Expected: Build starts without CSS parsing errors.

- [ ] **Step 4: Commit CSS variables**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "feat(css): add carbon-namespaced CSS variables

Add --carbon-* prefixed variables for landing page theming.
These are purely additive and don't affect existing Carbon BIM styles.
Includes light and dark mode variants.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.2: Add Carbon Utility Classes

**Files:**
- Modify: `apps/frontend/src/app/globals.css` (append after carbon variables)

- [ ] **Step 1: Append carbon utility classes**

Add after the carbon variables block:

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
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--carbon-glass-border);
}

/* Glow shadows */
.carbon-shadow-glow {
  box-shadow: var(--carbon-shadow-glow);
}

.carbon-shadow-glow-sm {
  box-shadow: var(--carbon-shadow-glow-sm);
}

/* Carbon-specific backgrounds */
.carbon-bg-primary {
  background-color: var(--carbon-primary);
}

.carbon-bg-secondary {
  background-color: var(--carbon-secondary);
}

.carbon-bg-card {
  background-color: var(--carbon-card);
}

/* Carbon-specific text colors */
.carbon-text-primary {
  color: var(--carbon-primary);
}

.carbon-text-foreground {
  color: var(--carbon-foreground);
}

.carbon-text-muted {
  color: var(--carbon-muted-foreground);
}

/* Carbon-specific borders */
.carbon-border-primary {
  border-color: var(--carbon-primary);
}

.carbon-border {
  border-color: var(--carbon-border);
}

/* Noise overlay for texture */
.carbon-noise-overlay {
  position: relative;
}

.carbon-noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

- [ ] **Step 2: Verify utility classes work**

Create a test by temporarily adding to any component:
```tsx
<div className="carbon-gradient-text">Test</div>
```

Expected: Text should show emerald-to-cyan-to-purple gradient.

- [ ] **Step 3: Commit utility classes**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "feat(css): add carbon utility classes

Add carbon-* prefixed utility classes for:
- Gradient text effects
- Glass card styling
- Glow shadows
- Background and text colors
- Noise overlay texture

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.3: Add Carbon Keyframe Animations

**Files:**
- Modify: `apps/frontend/src/app/globals.css` (append after utility classes)

- [ ] **Step 1: Append carbon animations**

Add after the utility classes:

```css
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

@keyframes carbon-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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

.carbon-animate-pop-in {
  animation: carbon-pop-in 0.4s ease-out;
}

.carbon-animate-slide-up {
  animation: carbon-slide-up 0.5s ease-out;
}

.carbon-animate-fade-in {
  animation: carbon-fade-in 0.3s ease-out;
}

.carbon-animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--carbon-primary-glow) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: carbon-shimmer 2s infinite;
}
```

- [ ] **Step 2: Verify animations compile**

```bash
cd apps/frontend && pnpm build 2>&1 | head -30
```

Expected: No errors related to @keyframes.

- [ ] **Step 3: Commit animations**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "feat(css): add carbon keyframe animations

Add carbon-* prefixed animations:
- Float, pulse-glow, bounce-in, pop-in
- Slide-up, fade-in, shimmer
- All animation utility classes

Phase 1 complete: CSS foundation ready.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.4: Verify Carbon BIM Regression (Phase 1 Gate)

**Files:** None (verification only)

- [ ] **Step 1: Start dev server**

```bash
cd apps/frontend && pnpm dev
```

- [ ] **Step 2: Verify dashboard pages unchanged**

Navigate to each and confirm NO visual changes:
- `/dashboard` - Main dashboard
- `/agents` - Agents list
- `/settings/api-keys` - Settings page

Expected: All pages look EXACTLY the same as before.

- [ ] **Step 3: Verify dark mode toggle**

Toggle dark mode on dashboard pages. Colors should remain unchanged.

- [ ] **Step 4: Check browser console**

No CSS-related errors or warnings should appear.

---

## Chunk 2: Landing Page Components

### Task 2.1: Create CarbonLogo Component

**Files:**
- Create: `apps/frontend/src/components/landing/CarbonLogo.tsx`

- [ ] **Step 1: Create the CarbonLogo component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CarbonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-sm',
  },
  md: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-xl',
  },
  lg: {
    container: 'w-14 h-14',
    icon: 'w-7 h-7',
    text: 'text-2xl',
  },
};

export function CarbonLogo({
  size = 'md',
  showText = true,
  animated = true,
  className,
}: CarbonLogoProps) {
  const config = SIZE_CONFIG[size];

  const Container = animated ? motion.div : 'div';
  const containerProps = animated
    ? {
        whileHover: { rotate: 10, scale: 1.1 },
        transition: { type: 'spring', stiffness: 400 },
      }
    : {};

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Container
        className={cn(
          config.container,
          'rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-[var(--carbon-primary)] via-[var(--carbon-accent)] to-purple-500',
          'shadow-lg shadow-[var(--carbon-primary-glow)]'
        )}
        {...containerProps}
      >
        <Leaf className={cn(config.icon, 'text-white')} />
      </Container>

      {showText && (
        <>
          <span className={cn(config.text, 'font-bold carbon-gradient-text')}>
            BIM Carbon
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--carbon-primary)]/10 text-[var(--carbon-primary)] text-xs font-medium">
            🇹🇭 Thailand
          </span>
        </>
      )}
    </div>
  );
}

export default CarbonLogo;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected: No errors related to CarbonLogo.

- [ ] **Step 3: Commit CarbonLogo**

```bash
git add apps/frontend/src/components/landing/CarbonLogo.tsx
git commit -m "feat(landing): add CarbonLogo component

Leaf icon with gradient container matching autonomous-bim-agent.vercel.app
Includes BIM Carbon text and Thailand badge
Supports sm/md/lg sizes and animation toggle

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.2: Create FloatingParticles Component

**Files:**
- Create: `apps/frontend/src/components/landing/FloatingParticles.tsx`

- [ ] **Step 1: Create FloatingParticles component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Pre-computed particle positions (deterministic for SSR hydration)
const PARTICLE_POSITIONS = [
  { x: 5, y: 10, size: 3, duration: 15, delay: 0.5 },
  { x: 15, y: 25, size: 2, duration: 18, delay: 1.2 },
  { x: 25, y: 40, size: 4, duration: 14, delay: 2.0 },
  { x: 35, y: 55, size: 2, duration: 20, delay: 0.8 },
  { x: 45, y: 70, size: 3, duration: 16, delay: 3.1 },
  { x: 55, y: 15, size: 2, duration: 19, delay: 1.7 },
  { x: 65, y: 30, size: 4, duration: 15, delay: 2.4 },
  { x: 75, y: 45, size: 2, duration: 22, delay: 0.3 },
  { x: 85, y: 60, size: 3, duration: 17, delay: 4.2 },
  { x: 95, y: 75, size: 2, duration: 14, delay: 1.5 },
  { x: 10, y: 85, size: 3, duration: 16, delay: 2.8 },
  { x: 20, y: 5, size: 2, duration: 21, delay: 0.9 },
  { x: 30, y: 20, size: 4, duration: 18, delay: 3.5 },
  { x: 40, y: 35, size: 2, duration: 15, delay: 1.1 },
  { x: 50, y: 50, size: 3, duration: 17, delay: 4.0 },
  { x: 60, y: 65, size: 2, duration: 20, delay: 2.2 },
  { x: 70, y: 80, size: 4, duration: 16, delay: 0.6 },
  { x: 80, y: 95, size: 2, duration: 14, delay: 3.3 },
  { x: 90, y: 8, size: 3, duration: 19, delay: 1.8 },
  { x: 100, y: 22, size: 2, duration: 17, delay: 2.6 },
];

export function FloatingParticles() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR placeholder - prevents hydration mismatch
  if (!isMounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_POSITIONS.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%)`,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={{
            y: [null, '-30%', '130%'],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default FloatingParticles;
```

- [ ] **Step 2: Commit FloatingParticles**

```bash
git add apps/frontend/src/components/landing/FloatingParticles.tsx
git commit -m "feat(landing): add FloatingParticles background effect

Animated particles with emerald/cyan glow
SSR-safe with deterministic positions
20 particles with varied animations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.3: Create GradientOrb Component

**Files:**
- Create: `apps/frontend/src/components/landing/GradientOrb.tsx`

- [ ] **Step 1: Create GradientOrb component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientOrbProps {
  className?: string;
  colors: string;
}

export function GradientOrb({ className, colors }: GradientOrbProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR placeholder
  if (!isMounted) {
    return (
      <div
        className={cn('absolute rounded-full blur-[100px] opacity-30', className)}
        style={{ background: colors }}
      />
    );
  }

  return (
    <motion.div
      className={cn('absolute rounded-full blur-[100px] opacity-40', className)}
      style={{ background: colors }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export default GradientOrb;
```

- [ ] **Step 2: Commit GradientOrb**

```bash
git add apps/frontend/src/components/landing/GradientOrb.tsx
git commit -m "feat(landing): add GradientOrb animated blob

Animated gradient blob with blur effect
SSR-safe rendering
Configurable colors and position

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.4: Create MeshGradient Component

**Files:**
- Create: `apps/frontend/src/components/landing/MeshGradient.tsx`

- [ ] **Step 1: Create MeshGradient component**

```tsx
'use client';

export function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background: `
            radial-gradient(at 40% 20%, hsla(160, 84%, 39%, 0.3) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(160, 84%, 39%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(270, 76%, 70%, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(160, 84%, 39%, 0.15) 0px, transparent 50%)
          `,
        }}
      />
    </div>
  );
}

export default MeshGradient;
```

- [ ] **Step 2: Commit MeshGradient**

```bash
git add apps/frontend/src/components/landing/MeshGradient.tsx
git commit -m "feat(landing): add MeshGradient backdrop component

Multi-point radial gradient background
Emerald/cyan/purple color scheme
Dark mode opacity adjustment

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.5: Create StatCounter Component

**Files:**
- Create: `apps/frontend/src/components/landing/StatCounter.tsx`

- [ ] **Step 1: Create StatCounter component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCounterProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
}

export function StatCounter({
  value,
  label,
  icon,
  delay = 0,
  className,
}: StatCounterProps) {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-2xl',
        'bg-[var(--carbon-card)] border border-[var(--carbon-border)]',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--carbon-primary)]/10 flex items-center justify-center text-[var(--carbon-primary)]">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-[var(--carbon-foreground)]">
          {value}
        </div>
        <div className="text-sm text-[var(--carbon-muted-foreground)]">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCounter;
```

- [ ] **Step 2: Commit StatCounter**

```bash
git add apps/frontend/src/components/landing/StatCounter.tsx
git commit -m "feat(landing): add StatCounter component

Animated stat display with icon
Carbon-themed styling
Hover effects and entry animations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.6: Create ValueCard Component

**Files:**
- Create: `apps/frontend/src/components/landing/ValueCard.tsx`

- [ ] **Step 1: Create ValueCard component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  delay?: number;
  index: number;
  className?: string;
}

export function ValueCard({
  icon,
  title,
  description,
  highlight,
  delay = 0,
  index,
  className,
}: ValueCardProps) {
  return (
    <motion.div
      className={cn(
        'group relative p-6 rounded-2xl',
        'bg-[var(--carbon-card)] border border-[var(--carbon-border)]',
        'hover:border-[var(--carbon-primary)]/30 transition-all duration-300',
        'hover:shadow-lg hover:shadow-[var(--carbon-primary-glow)]',
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay + index * 0.1, duration: 0.5 }}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--carbon-primary)]/10 via-transparent to-[var(--carbon-accent)]/10" />
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-[var(--carbon-primary)] to-[var(--carbon-accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--carbon-primary-glow)]">
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 text-[var(--carbon-foreground)]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--carbon-muted-foreground)] leading-relaxed">
          {description}
        </p>

        {/* Highlight badge */}
        {highlight && (
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-[var(--carbon-primary)]/10 text-[var(--carbon-primary)] text-xs font-medium">
            {highlight}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ValueCard;
```

- [ ] **Step 2: Commit ValueCard**

```bash
git add apps/frontend/src/components/landing/ValueCard.tsx
git commit -m "feat(landing): add ValueCard feature card component

Feature card with icon, title, description
Gradient hover effects and glow
Staggered animation on scroll

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.7: Create HowItWorksStep Component

**Files:**
- Create: `apps/frontend/src/components/landing/HowItWorksStep.tsx`

- [ ] **Step 1: Create HowItWorksStep component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HowItWorksStepProps {
  step: number;
  title: string;
  description: string;
  isLast?: boolean;
  className?: string;
}

export function HowItWorksStep({
  step,
  title,
  description,
  isLast = false,
  className,
}: HowItWorksStepProps) {
  return (
    <motion.div
      className={cn('relative flex gap-4', className)}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step * 0.2, duration: 0.5 }}
    >
      {/* Step number and line */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--carbon-primary)] to-[var(--carbon-accent)] flex items-center justify-center text-white font-bold shadow-lg shadow-[var(--carbon-primary-glow)]">
          {step}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-[var(--carbon-primary)] to-transparent mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <h3 className="text-lg font-semibold mb-2 text-[var(--carbon-foreground)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--carbon-muted-foreground)] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default HowItWorksStep;
```

- [ ] **Step 2: Commit HowItWorksStep**

```bash
git add apps/frontend/src/components/landing/HowItWorksStep.tsx
git commit -m "feat(landing): add HowItWorksStep workflow component

Step indicator with connecting line
Carbon gradient styling
Scroll-triggered animations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.8: Create TestimonialCard Component

**Files:**
- Create: `apps/frontend/src/components/landing/TestimonialCard.tsx`

- [ ] **Step 1: Create TestimonialCard component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
  delay?: number;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  rating = 5,
  delay = 0,
  className,
}: TestimonialCardProps) {
  return (
    <motion.div
      className={cn(
        'p-6 rounded-2xl carbon-glass-card',
        'border border-[var(--carbon-border)]',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      {/* Rating stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-[var(--carbon-primary)] text-[var(--carbon-primary)]"
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-[var(--carbon-foreground)] mb-4 leading-relaxed">
        &quot;{quote}&quot;
      </blockquote>

      {/* Author info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--carbon-primary)] to-[var(--carbon-accent)] flex items-center justify-center text-white font-bold text-sm">
          {author.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-[var(--carbon-foreground)]">
            {author}
          </div>
          <div className="text-sm text-[var(--carbon-muted-foreground)]">
            {role}, {company}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TestimonialCard;
```

- [ ] **Step 2: Commit TestimonialCard**

```bash
git add apps/frontend/src/components/landing/TestimonialCard.tsx
git commit -m "feat(landing): add TestimonialCard component

Glass-effect testimonial card
Star rating display
Avatar with gradient background

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.9: Create ComparisonRow Component

**Files:**
- Create: `apps/frontend/src/components/landing/ComparisonRow.tsx`

- [ ] **Step 1: Create ComparisonRow component**

```tsx
'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonRowProps {
  feature: string;
  carbonBIM: boolean | string;
  competitors: boolean | string;
  delay?: number;
  className?: string;
}

export function ComparisonRow({
  feature,
  carbonBIM,
  competitors,
  delay = 0,
  className,
}: ComparisonRowProps) {
  const renderValue = (value: boolean | string, isCarbon: boolean) => {
    if (typeof value === 'string') {
      return (
        <span className={cn(isCarbon ? 'text-[var(--carbon-primary)] font-medium' : 'text-[var(--carbon-muted-foreground)]')}>
          {value}
        </span>
      );
    }
    return value ? (
      <Check className={cn('w-5 h-5', isCarbon ? 'text-[var(--carbon-primary)]' : 'text-[var(--carbon-muted-foreground)]')} />
    ) : (
      <X className="w-5 h-5 text-red-400" />
    );
  };

  return (
    <motion.div
      className={cn(
        'grid grid-cols-3 gap-4 py-4 border-b border-[var(--carbon-border)] last:border-0',
        className
      )}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-[var(--carbon-foreground)]">{feature}</div>
      <div className="flex justify-center">{renderValue(carbonBIM, true)}</div>
      <div className="flex justify-center">{renderValue(competitors, false)}</div>
    </motion.div>
  );
}

export default ComparisonRow;
```

- [ ] **Step 2: Commit ComparisonRow**

```bash
git add apps/frontend/src/components/landing/ComparisonRow.tsx
git commit -m "feat(landing): add ComparisonRow component

Feature comparison table row
Check/X icons for boolean values
Text values with carbon styling

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.10: Update Landing Components Index

**Files:**
- Modify: `apps/frontend/src/components/landing/index.ts`

- [ ] **Step 1: Read current index.ts**

```bash
cat apps/frontend/src/components/landing/index.ts
```

- [ ] **Step 2: Update index.ts with new exports**

```tsx
// Landing page components
export { LandingPage } from './landing-page';
export type { LandingPageProps } from './landing-page';

// Carbon-themed components
export { CarbonLogo } from './CarbonLogo';
export type { CarbonLogoProps } from './CarbonLogo';

export { FloatingParticles } from './FloatingParticles';
export { GradientOrb } from './GradientOrb';
export { MeshGradient } from './MeshGradient';
export { StatCounter } from './StatCounter';
export { ValueCard } from './ValueCard';
export { HowItWorksStep } from './HowItWorksStep';
export { TestimonialCard } from './TestimonialCard';
export { ComparisonRow } from './ComparisonRow';
```

- [ ] **Step 3: Commit index update**

```bash
git add apps/frontend/src/components/landing/index.ts
git commit -m "feat(landing): export all new carbon components

Add exports for:
- CarbonLogo, FloatingParticles, GradientOrb
- MeshGradient, StatCounter, ValueCard
- HowItWorksStep, TestimonialCard, ComparisonRow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Landing Page Implementation

### Task 3.1: Replace Landing Page with Carbon Version

**Files:**
- Replace: `apps/frontend/src/components/landing/landing-page.tsx`
- Source: `/tmp/src_extract/src/components/landing/LandingPage.tsx`

- [ ] **Step 1: Backup existing landing page**

```bash
cp apps/frontend/src/components/landing/landing-page.tsx apps/frontend/src/components/landing/landing-page.backup.tsx
```

- [ ] **Step 2: Copy and adapt source landing page**

The source file is 1161 lines. Key adaptations required:
1. Change `import { useTranslation } from '@/i18n/provider'` → `import { useTranslations } from 'next-intl'`
2. Change `const { t } = useTranslation()` → `const t = useTranslations()`
3. Change `import { LanguageSwitcher }` → `import { LocaleSwitcher } from '@/components/home/locale-switcher'`
4. Replace `bg-primary` → `bg-[var(--carbon-primary)]`
5. Replace `text-primary` → `text-[var(--carbon-primary)]`
6. Replace `from-primary to-accent` → `from-[var(--carbon-primary)] to-[var(--carbon-accent)]`
7. Replace `gradient-text` → `carbon-gradient-text`

**Note:** Due to the file size (~1100 lines), this step requires careful line-by-line adaptation. See spec for full CSS class mapping.

- [ ] **Step 3: Verify build succeeds**

```bash
cd apps/frontend && pnpm build 2>&1 | head -50
```

Expected: Build completes without errors.

- [ ] **Step 4: Commit landing page**

```bash
git add apps/frontend/src/components/landing/landing-page.tsx
git commit -m "feat(landing): replace landing page with carbon version

Complete carbon-themed landing page from autonomous-bim-agent
All CSS classes adapted to use --carbon-* variables
i18n updated to use next-intl
~1100 lines migrated

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3.2: Verify Landing Page Visual Match

**Files:** None (verification only)

- [ ] **Step 1: Start dev server**

```bash
cd apps/frontend && pnpm dev
```

- [ ] **Step 2: Open landing page**

Navigate to `http://localhost:3000/`

- [ ] **Step 3: Compare with reference**

Open `https://autonomous-bim-agent.vercel.app/` in another tab and compare:
- [ ] Header/navbar matches
- [ ] Hero section matches
- [ ] Color scheme (emerald/cyan) matches
- [ ] Animations working
- [ ] Dark mode toggle works

- [ ] **Step 4: Document any differences**

If differences found, note them for Task 3.3.

---

## Chunk 4: Carbon Library Migration

### Task 4.1: Create lib/carbon Directory Structure

**Files:**
- Create: `apps/frontend/src/lib/carbon/` (directory)

- [ ] **Step 1: Create carbon lib directory**

```bash
mkdir -p apps/frontend/src/lib/carbon
```

- [ ] **Step 2: Copy carbon lib files from source**

```bash
cp /tmp/src_extract/src/lib/carbon/*.ts apps/frontend/src/lib/carbon/
```

- [ ] **Step 3: Verify files copied**

```bash
ls -la apps/frontend/src/lib/carbon/
```

Expected: 12 files (types.ts, calculator.ts, emission-factors.ts, etc.)

---

### Task 4.2: Verify TypeScript Compilation

**Files:**
- All files in `apps/frontend/src/lib/carbon/`

- [ ] **Step 1: Check for TypeScript errors**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep -E "(error|carbon)" | head -20
```

- [ ] **Step 2: Fix any import path issues**

Common issues:
- `@/types/database` may not exist - check and adapt
- Relative imports may need adjustment

- [ ] **Step 3: Commit carbon library**

```bash
git add apps/frontend/src/lib/carbon/
git commit -m "feat(lib): add carbon calculation library

12 files migrated from source:
- types.ts: TypeScript interfaces
- calculator.ts: Core calculation logic
- emission-factors.ts: CO2 factors database
- thai-materials.ts: Thai material database (~2200 lines)
- analysis-pipeline.ts, knowledge-graph.ts
- ifc-*, kkp-*, trees-*, tver-*, bank-*

~5000 lines of carbon calculation logic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: Additional Components

### Task 5.1: Create Calculator Components Directory

**Files:**
- Create: `apps/frontend/src/components/calculator/` (directory + 8 files)

- [ ] **Step 1: Create calculator directory**

```bash
mkdir -p apps/frontend/src/components/calculator
```

- [ ] **Step 2: Copy calculator components**

```bash
cp /tmp/src_extract/src/components/calculator/*.tsx apps/frontend/src/components/calculator/
```

- [ ] **Step 3: Adapt imports in each file**

For each file, update:
- `@/lib/utils` - keep same
- `@/lib/carbon/*` - keep same (we just added it)
- `@/components/ui/*` - verify exists
- CSS classes: Replace `bg-primary` → `bg-[var(--carbon-primary)]` etc.

- [ ] **Step 4: Commit calculator components**

```bash
git add apps/frontend/src/components/calculator/
git commit -m "feat(components): add calculator components

8 components migrated:
- CarbonCalculator.tsx (main calculator)
- CarbonAnalyticsDashboard.tsx
- BOQAnalyzer.tsx, MaterialBrowser.tsx
- MaterialSelector.tsx, EmissionsChart.tsx
- RecommendationsPanel.tsx, ReportExportButtons.tsx

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5.2: Create Carbon Components Directory

**Files:**
- Create: `apps/frontend/src/components/carbon/` (3 files)

- [ ] **Step 1: Create carbon directory and components**

```bash
mkdir -p apps/frontend/src/components/carbon
```

- [ ] **Step 2: Create CertificationCard and CertificationDashboard**

These components exist in source - copy and adapt similarly.

- [ ] **Step 3: Commit carbon components**

```bash
git add apps/frontend/src/components/carbon/
git commit -m "feat(components): add carbon certification components

- CertificationCard.tsx
- CertificationDashboard.tsx
- index.ts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 6: Final Integration

### Task 6.1: Merge i18n Translations

**Files:**
- Modify: `apps/frontend/translations/en.json`
- Modify: `apps/frontend/translations/th.json`

- [ ] **Step 1: Extract landing translations from source**

The source LandingPage uses keys like:
- `landing.hero.badge`
- `landing.hero.title`
- `landing.whyChooseUs.*`
- `landing.ctaSection.*`
- `nav.calculator`
- `footer.*`

- [ ] **Step 2: Merge into en.json**

Add the `landing` and related keys to the existing translation file.

- [ ] **Step 3: Merge into th.json**

Add Thai translations for the same keys.

- [ ] **Step 4: Commit translations**

```bash
git add apps/frontend/translations/en.json apps/frontend/translations/th.json
git commit -m "feat(i18n): merge carbon landing translations

Add landing page translation keys to existing files:
- landing.hero.*, landing.whyChooseUs.*
- landing.ctaSection.*, landing.stats.*
- nav.calculator, footer.*
- Thai translations included

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6.2: Final Regression Testing

**Files:** None (verification only)

- [ ] **Step 1: Verify ALL dashboard routes**

Navigate to each and confirm NO visual changes:
- [ ] `/dashboard` - Main dashboard
- [ ] `/agents` - Agents list
- [ ] `/agents/[threadId]` - Thread detail
- [ ] `/settings/api-keys` - API keys
- [ ] `/settings/credentials` - Credentials
- [ ] `/billing` - Billing
- [ ] `/knowledge` - Knowledge base
- [ ] `/files` - Files
- [ ] `/triggers` - Triggers

- [ ] **Step 2: Verify auth routes**

- [ ] `/auth` - Login page
- [ ] `/auth/password` - Password page
- [ ] `/auth/reset-password` - Reset page

- [ ] **Step 3: Verify UI components unchanged**

- [ ] Sidebar navigation - correct colors
- [ ] Buttons - correct primary/secondary styling
- [ ] Cards - correct background/border
- [ ] Modals/Dialogs - correct backdrop
- [ ] Toasts - correct styling
- [ ] Dark mode toggle - works everywhere

- [ ] **Step 4: Verify landing page matches reference**

- [ ] Visually matches `autonomous-bim-agent.vercel.app`
- [ ] Emerald/Teal color scheme
- [ ] All animations working
- [ ] Dark/light mode works
- [ ] Responsive design works

- [ ] **Step 5: Check for errors**

```bash
cd apps/frontend && pnpm build 2>&1 | grep -i error
```

Expected: No errors.

---

### Task 6.3: Final Commit and Tag

**Files:** None

- [ ] **Step 1: Final commit**

```bash
git add -A
git commit -m "feat: complete carbon landing page migration

Migration Summary:
- ~37 new files added
- 3 files modified (additive only)
- All existing Carbon BIM features preserved
- Landing page matches autonomous-bim-agent.vercel.app

Testing completed:
- All dashboard routes verified unchanged
- All auth routes working
- Dark/light mode working
- No build errors

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 2: Tag the release**

```bash
git tag -a v-carbon-landing-migration -m "Carbon landing page migration complete"
```

---

## Rollback Instructions

If issues are discovered after migration:

```bash
# Option 1: Revert to pre-migration state
git checkout main

# Option 2: Revert specific phase
git revert <commit-hash>

# Option 3: Cherry-pick fixes from the branch
git checkout main
git cherry-pick <fix-commit-hash>
```

---

## Success Criteria Checklist

- [ ] Landing page visually matches `autonomous-bim-agent.vercel.app`
- [ ] All existing Carbon BIM pages work WITHOUT any visual changes
- [ ] Dark/light mode works on BOTH themes
- [ ] No TypeScript/ESLint errors
- [ ] No console errors
- [ ] Build completes successfully
- [ ] All regression tests pass

---

## REMAINING WORK (Updated 2026-03-17)

The following tasks remain to be completed. Most components have been migrated successfully.

---

## Chunk 7: Complete Carbon Library

### Task 7.1: Create lib/carbon/index.ts barrel export

**Files:**
- Create: `apps/frontend/src/lib/carbon/index.ts`

- [ ] **Step 1: Create the barrel export file**

```typescript
// Carbon Library - Main Entry Point
// Re-exports all carbon calculation utilities and types

// Types
export * from './types';

// Emission factors database
export {
  THAI_EMISSION_FACTORS,
  getEmissionFactor,
  searchMaterials,
  getEmissionFactorsByCategory,
} from './emission-factors';

// Calculator functions
export {
  calculateMaterialCarbon,
  calculateBOQCarbon,
  calculateTransportEmissions,
  generateCarbonReport,
} from './calculator';

// TREES certification
export {
  TREES_THRESHOLDS,
  calculateMRCredits,
  determineTREESLevel,
  pointsToNextLevel,
  assessTREESCertification,
} from './trees-certification';

// T-VER templates
export {
  TVER_TEMPLATES,
  generateTVERReport,
  getTVERTemplate,
} from './tver-templates';

// KKP BOQ integration
export {
  KKP_BOQ_CODES,
  parseKKPBOQ,
  mapKKPToCarbon,
} from './kkp-boq-integration';

// IFC material mapper
export {
  IFC_MATERIAL_MAPPINGS,
  mapIFCMaterial,
  extractMaterialsFromIFC,
} from './ifc-material-mapper';
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /teamspace/studios/this_studio/suna-bim-agent && npx tsc --noEmit --project apps/frontend/tsconfig.json 2>&1 | head -50`
Expected: No errors related to carbon lib imports

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/lib/carbon/index.ts
git commit -m "feat(carbon): add barrel export for carbon library"
```

---

### Task 7.2: Create thai-materials.ts (extended materials database)

**Files:**
- Create: `apps/frontend/src/lib/carbon/thai-materials.ts`

- [ ] **Step 1: Create the Thai materials database**

```typescript
/**
 * Thai Materials Database
 * Extended material definitions with BOQ codes and alternatives
 */

import type { ThaiMaterial } from './types';

/**
 * Thai construction materials with carbon data
 * References: TGO CFP, MTEC Thai LCI, SCG EPD
 */
export const THAI_MATERIALS: ThaiMaterial[] = [
  // Concrete Materials
  {
    id: 'concrete-ready-mix-c20',
    name: 'Ready-mix Concrete C20/25',
    nameTh: 'คอนกรีตผสมเสร็จ C20/25',
    category: 'concrete',
    subcategory: 'ready-mix',
    boqCode: 'C01-001',
    emissionFactorId: 'concrete-normal-c20',
    emissionFactor: 265,
    unit: 'kgCO2e/m3',
    isLocallyProduced: true,
    productionRegion: 'Central Thailand',
    manufacturers: ['CPAC', 'TPI', 'INSEE'],
    alternatives: [
      {
        materialId: 'concrete-low-carbon-c20',
        name: 'Low-Carbon Concrete C20/25',
        nameTh: 'คอนกรีตคาร์บอนต่ำ C20/25',
        emissionFactor: 185,
        unit: 'kgCO2e/m3',
        carbonReduction: 30,
        costImpact: 'higher',
        availabilityInThailand: 'available',
      },
    ],
  },
  // Steel Materials
  {
    id: 'steel-rebar-sd40',
    name: 'Reinforcement Steel SD40',
    nameTh: 'เหล็กเส้น SD40',
    category: 'steel',
    subcategory: 'reinforcement',
    boqCode: 'S01-001',
    emissionFactorId: 'steel-rebar',
    emissionFactor: 1.99,
    unit: 'kgCO2e/kg',
    isLocallyProduced: true,
    productionRegion: 'Eastern Thailand',
    manufacturers: ['SSI', 'TATA Steel', 'Millcon'],
    recycledContentPercent: 25,
    alternatives: [
      {
        materialId: 'steel-rebar-recycled',
        name: 'Recycled Steel Rebar',
        nameTh: 'เหล็กเส้นรีไซเคิล',
        emissionFactor: 0.42,
        unit: 'kgCO2e/kg',
        carbonReduction: 79,
        costImpact: 'same',
        availabilityInThailand: 'available',
      },
    ],
  },
];

/**
 * Search materials by name, category, or BOQ code
 */
export function searchThaiMaterials(query: string): ThaiMaterial[] {
  const normalizedQuery = query.toLowerCase();
  return THAI_MATERIALS.filter(
    (m) =>
      m.name.toLowerCase().includes(normalizedQuery) ||
      m.nameTh.includes(query) ||
      m.category.includes(normalizedQuery) ||
      m.boqCode?.includes(query.toUpperCase())
  );
}

/**
 * Get material by ID
 */
export function getThaiMaterial(id: string): ThaiMaterial | undefined {
  return THAI_MATERIALS.find((m) => m.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/carbon/thai-materials.ts
git commit -m "feat(carbon): add Thai materials database with BOQ codes"
```

---

### Task 7.3: Create analysis-pipeline.ts

**Files:**
- Create: `apps/frontend/src/lib/carbon/analysis-pipeline.ts`

- [ ] **Step 1: Create the analysis pipeline**

```typescript
/**
 * Carbon Analysis Pipeline
 * Full workflow for analyzing BIM/BOQ data and generating reports
 */

import type {
  BOQCarbonAnalysis,
  BOQCarbonItem,
  MaterialCategory,
  EdgeCalculation,
  CarbonRecommendation,
} from './types';
import { getEmissionFactor } from './emission-factors';

/**
 * Analyze a BOQ and generate carbon analysis
 */
export async function analyzeBOQ(
  projectId: string,
  projectName: string,
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    materialCode?: string;
  }>,
  grossFloorArea: number
): Promise<BOQCarbonAnalysis> {
  const carbonItems: BOQCarbonItem[] = [];
  let totalCarbon = 0;

  for (const item of items) {
    const ef = item.materialCode ? getEmissionFactor(item.materialCode) : null;
    if (!ef) continue;

    const embodiedCarbon = item.quantity * ef.emissionFactor;
    totalCarbon += embodiedCarbon;

    carbonItems.push({
      id: `carbon-${item.id}`,
      boqItemId: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: 0,
      materialCode: item.materialCode,
      emissionFactorId: ef.id,
      embodiedCarbon,
      carbonIntensity: ef.emissionFactor,
      scope1Emissions: 0,
      scope2Emissions: 0,
      scope3Emissions: embodiedCarbon,
    });
  }

  return {
    projectId,
    projectName,
    totalEmbodiedCarbon: totalCarbon,
    carbonPerSquareMeter: grossFloorArea > 0 ? totalCarbon / grossFloorArea : 0,
    grossFloorArea,
    categoryBreakdown: [],
    scopeBreakdown: { scope1: 0, scope2: 0, scope3: totalCarbon },
    hotspots: carbonItems.slice(0, 5).map(item => ({
      itemId: item.boqItemId,
      description: item.description,
      carbon: item.embodiedCarbon,
      percentage: totalCarbon > 0 ? (item.embodiedCarbon / totalCarbon) * 100 : 0,
    })),
    items: carbonItems,
    calculatedAt: new Date(),
    methodology: 'tgo_cfp',
  };
}

/**
 * Generate EDGE calculation from carbon analysis
 */
export function calculateEdgeCertification(
  analysis: BOQCarbonAnalysis,
  baselineIntensity: number = 500
): EdgeCalculation {
  const baselineCarbon = baselineIntensity * analysis.grossFloorArea;
  const carbonReduction = baselineCarbon > 0
    ? ((baselineCarbon - analysis.totalEmbodiedCarbon) / baselineCarbon) * 100
    : 0;

  return {
    projectId: analysis.projectId,
    baselineCarbon,
    optimizedCarbon: analysis.totalEmbodiedCarbon,
    carbonReduction,
    certificationLevel: carbonReduction >= 40 ? 'edge_advanced' : carbonReduction >= 20 ? 'edge_certified' : undefined,
    meetsEdgeThreshold: carbonReduction >= 20,
    improvements: [],
    materialBreakdown: [],
  };
}

/**
 * Generate carbon reduction recommendations
 */
export function generateRecommendations(
  analysis: BOQCarbonAnalysis
): CarbonRecommendation[] {
  return analysis.hotspots.slice(0, 3).map((hotspot) => ({
    id: `rec-${hotspot.itemId}`,
    type: 'material_swap' as const,
    priority: 'high' as const,
    title: `Replace ${hotspot.description.substring(0, 30)}...`,
    description: `Consider using a low-carbon alternative. Potential savings: ${(hotspot.carbon * 0.3).toFixed(0)} kgCO2e`,
    currentCarbon: hotspot.carbon,
    potentialCarbon: hotspot.carbon * 0.7,
    savingsPercent: 30,
    affectedElements: [hotspot.itemId],
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/carbon/analysis-pipeline.ts
git commit -m "feat(carbon): add BOQ analysis pipeline and EDGE calculation"
```

---

### Task 7.4: Create knowledge-graph.ts

**Files:**
- Create: `apps/frontend/src/lib/carbon/knowledge-graph.ts`

- [ ] **Step 1: Create the knowledge graph module**

```typescript
/**
 * Standards Knowledge Graph
 * Relationships between Thai and international standards
 */

import type { StandardNode, StandardRelationship, StandardsKnowledgeGraph } from './types';

export const STANDARD_NODES: StandardNode[] = [
  {
    id: 'tgo-cfp',
    name: 'TGO Carbon Footprint for Products',
    nameTh: 'โครงการคาร์บอนฟุตพริ้นท์ของผลิตภัณฑ์',
    type: 'thai',
    organization: 'Thailand Greenhouse Gas Management Organization',
    relatedStandards: ['iso-14067', 'tver'],
    dataRequirements: ['product-life-cycle', 'emission-factors'],
    outputDocuments: ['cfp-label', 'cfp-certificate'],
  },
  {
    id: 'trees',
    name: 'TREES Certification',
    nameTh: 'มาตรฐานอาคารเขียวไทย',
    type: 'thai',
    organization: 'Thai Green Building Institute',
    relatedStandards: ['leed', 'edge'],
    dataRequirements: ['building-materials', 'energy-consumption'],
    outputDocuments: ['trees-certificate'],
  },
  {
    id: 'edge',
    name: 'EDGE Certification',
    nameTh: 'มาตรฐาน EDGE',
    type: 'international',
    organization: 'IFC World Bank',
    relatedStandards: ['trees', 'iso-14064'],
    dataRequirements: ['baseline-comparison', 'material-carbon'],
    outputDocuments: ['edge-certificate'],
  },
];

export const STANDARD_RELATIONSHIPS: StandardRelationship[] = [
  {
    fromId: 'tgo-cfp',
    toId: 'iso-14067',
    relationshipType: 'extends',
    description: 'TGO CFP follows ISO 14067 methodology with Thai-specific factors',
  },
  {
    fromId: 'trees',
    toId: 'leed',
    relationshipType: 'alternative',
    description: 'TREES is Thai alternative to LEED with local adaptations',
  },
];

export function createKnowledgeGraph(): StandardsKnowledgeGraph {
  return {
    nodes: STANDARD_NODES,
    relationships: STANDARD_RELATIONSHIPS,
    getRelatedStandards: (id: string) => {
      const node = STANDARD_NODES.find(n => n.id === id);
      if (!node) return [];
      return STANDARD_NODES.filter(n => node.relatedStandards.includes(n.id));
    },
    getDataRequirements: (id: string) => {
      const node = STANDARD_NODES.find(n => n.id === id);
      return node?.dataRequirements || [];
    },
    getPath: (fromId: string, toId: string) => {
      // Simple BFS implementation
      const visited = new Set<string>();
      const queue: StandardNode[][] = [[STANDARD_NODES.find(n => n.id === fromId)!]];
      
      while (queue.length > 0) {
        const path = queue.shift()!;
        const current = path[path.length - 1];
        
        if (current.id === toId) return path;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        const related = STANDARD_NODES.filter(n => current.relatedStandards.includes(n.id));
        for (const node of related) {
          queue.push([...path, node]);
        }
      }
      return [];
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/carbon/knowledge-graph.ts
git commit -m "feat(carbon): add standards knowledge graph"
```

---

### Task 7.5: Create bank-reports.ts

**Files:**
- Create: `apps/frontend/src/lib/carbon/bank-reports.ts`

- [ ] **Step 1: Create the bank reports module**

```typescript
/**
 * Green Loan Bank Reports Module
 * Generate documentation for Thai green loan applications
 */

import type { GreenLoanDocument, BOQCarbonAnalysis, EdgeCalculation } from './types';

/**
 * Generate green loan documentation
 */
export function generateGreenLoanDocument(
  analysis: BOQCarbonAnalysis,
  edge: EdgeCalculation | null,
  targetBank: GreenLoanDocument['targetBank'] = 'ghbank'
): GreenLoanDocument {
  const carbonReductionPercent = edge?.carbonReduction || 0;

  return {
    projectId: analysis.projectId,
    projectName: analysis.projectName,
    targetBank,
    totalEmbodiedCarbon: analysis.totalEmbodiedCarbon,
    carbonReductionPercent,
    baselineComparison: edge?.baselineCarbon || 0,
    edgeCertification: edge?.certificationLevel,
    sections: {
      executiveSummary: `Project ${analysis.projectName} demonstrates ${carbonReductionPercent.toFixed(1)}% carbon reduction compared to baseline construction methods.`,
      projectOverview: `Total GFA: ${analysis.grossFloorArea.toLocaleString()} m². Carbon intensity: ${analysis.carbonPerSquareMeter.toFixed(1)} kgCO2e/m².`,
      carbonAnalysis: `Total embodied carbon: ${analysis.totalEmbodiedCarbon.toLocaleString()} kgCO2e. Analysis methodology: ${analysis.methodology.toUpperCase()}.`,
      certificationStatus: edge?.meetsEdgeThreshold 
        ? `Eligible for ${edge.certificationLevel?.replace('_', ' ').toUpperCase()} certification.`
        : 'Working towards EDGE certification threshold.',
      sustainabilityMetrics: `Top 5 material hotspots identified. ${analysis.hotspots.length} optimization opportunities available.`,
    },
    generatedAt: new Date(),
  };
}

/**
 * Get bank-specific requirements
 */
export function getBankRequirements(bank: GreenLoanDocument['targetBank']): string[] {
  const requirements: Record<string, string[]> = {
    ghbank: ['EDGE certification or equivalent', 'Environmental impact assessment', 'Carbon reduction documentation'],
    krungsri: ['Green building certification', 'Energy efficiency report', 'Sustainability plan'],
    sme_dbank: ['Environmental compliance', 'Resource efficiency measures'],
    exim: ['International environmental standards', 'Export sustainability requirements'],
    other: ['Environmental documentation'],
  };
  return requirements[bank] || requirements.other;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/carbon/bank-reports.ts
git commit -m "feat(carbon): add green loan bank reports module"
```

---

### Task 7.6: Create ifc-calculator-integration.ts

**Files:**
- Create: `apps/frontend/src/lib/carbon/ifc-calculator-integration.ts`

- [ ] **Step 1: Create the IFC calculator integration**

```typescript
/**
 * IFC Calculator Integration
 * Bridge between IFC data extraction and carbon calculations
 */

import type { BIMModel, BIMElement, BOQCarbonAnalysis } from './types';
import { mapIFCMaterial } from './ifc-material-mapper';
import { analyzeBOQ } from './analysis-pipeline';

/**
 * Convert BIM elements to BOQ items for carbon analysis
 */
export function convertBIMToBOQ(
  model: BIMModel
): Array<{
  id: string;
  description: string;
  quantity: number;
  unit: string;
  materialCode?: string;
}> {
  return model.elements
    .filter(elem => elem.material)
    .map(elem => {
      const mapping = mapIFCMaterial(elem.material || '');
      const volume = calculateElementVolume(elem);
      
      return {
        id: elem.id,
        description: `${elem.type}: ${elem.name || elem.material}`,
        quantity: volume,
        unit: 'm3',
        materialCode: mapping?.emissionFactorId,
      };
    });
}

/**
 * Calculate element volume from geometry
 */
function calculateElementVolume(element: BIMElement): number {
  if (!element.geometry?.boundingBox) return 1;
  
  const { min, max } = element.geometry.boundingBox;
  return Math.abs((max.x - min.x) * (max.y - min.y) * (max.z - min.z));
}

/**
 * Run full BIM carbon analysis
 */
export async function analyzeBIMModel(
  model: BIMModel,
  projectName: string
): Promise<BOQCarbonAnalysis> {
  const boqItems = convertBIMToBOQ(model);
  const gfa = model.metadata?.totalArea || 1000;
  
  return analyzeBOQ(model.id, projectName, boqItems, gfa);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/carbon/ifc-calculator-integration.ts
git commit -m "feat(carbon): add IFC calculator integration"
```

---

## Chunk 8: State Management & Hooks

### Task 8.1: Create carbon-store.ts (Zustand store)

**Files:**
- Create: `apps/frontend/src/stores/carbon-store.ts`

- [ ] **Step 1: Create the Zustand store**

```typescript
/**
 * Carbon Analysis State Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BOQCarbonAnalysis,
  EdgeCalculation,
  TREESCertification,
  CarbonRecommendation,
} from '@/lib/carbon/types';

interface CarbonState {
  currentAnalysis: BOQCarbonAnalysis | null;
  edgeCalculation: EdgeCalculation | null;
  treesAssessment: TREESCertification | null;
  recommendations: CarbonRecommendation[];
  isAnalyzing: boolean;
  analysisProgress: number;
  error: string | null;

  setAnalysis: (analysis: BOQCarbonAnalysis) => void;
  setEdgeCalculation: (calc: EdgeCalculation) => void;
  setTREESAssessment: (assessment: TREESCertification) => void;
  setRecommendations: (recs: CarbonRecommendation[]) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCarbonStore = create<CarbonState>()(
  persist(
    (set) => ({
      currentAnalysis: null,
      edgeCalculation: null,
      treesAssessment: null,
      recommendations: [],
      isAnalyzing: false,
      analysisProgress: 0,
      error: null,

      setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setEdgeCalculation: (calc) => set({ edgeCalculation: calc }),
      setTREESAssessment: (assessment) => set({ treesAssessment: assessment }),
      setRecommendations: (recs) => set({ recommendations: recs }),
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setProgress: (progress) => set({ analysisProgress: progress }),
      setError: (error) => set({ error }),
      reset: () => set({
        currentAnalysis: null,
        edgeCalculation: null,
        treesAssessment: null,
        recommendations: [],
        isAnalyzing: false,
        analysisProgress: 0,
        error: null,
      }),
    }),
    {
      name: 'carbon-analysis-store',
      partialize: (state) => ({
        currentAnalysis: state.currentAnalysis,
        recommendations: state.recommendations,
      }),
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/stores/carbon-store.ts
git commit -m "feat(carbon): add Zustand store for carbon analysis state"
```

---

### Task 8.2: Create useCarbonData hook

**Files:**
- Create: `apps/frontend/src/hooks/panel-data/useCarbonData.ts`

- [ ] **Step 1: Create the data hook**

```typescript
/**
 * Carbon Data Hook
 */

import { useCallback } from 'react';
import { useCarbonStore } from '@/stores/carbon-store';
import {
  analyzeBOQ,
  calculateEdgeCertification,
  generateRecommendations,
} from '@/lib/carbon/analysis-pipeline';

export function useCarbonData() {
  const {
    currentAnalysis,
    edgeCalculation,
    recommendations,
    isAnalyzing,
    analysisProgress,
    error,
    setAnalysis,
    setEdgeCalculation,
    setRecommendations,
    setAnalyzing,
    setProgress,
    setError,
  } = useCarbonStore();

  const runAnalysis = useCallback(
    async (
      projectId: string,
      projectName: string,
      boqItems: Parameters<typeof analyzeBOQ>[2],
      grossFloorArea: number
    ) => {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(25);
        const analysis = await analyzeBOQ(projectId, projectName, boqItems, grossFloorArea);
        setAnalysis(analysis);

        setProgress(50);
        const edge = calculateEdgeCertification(analysis);
        setEdgeCalculation(edge);

        setProgress(75);
        const recs = generateRecommendations(analysis);
        setRecommendations(recs);

        setProgress(100);
        return analysis;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        throw err;
      } finally {
        setAnalyzing(false);
      }
    },
    [setAnalysis, setEdgeCalculation, setRecommendations, setAnalyzing, setProgress, setError]
  );

  return {
    analysis: currentAnalysis,
    edgeCalculation,
    recommendations,
    isAnalyzing,
    progress: analysisProgress,
    error,
    runAnalysis,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/hooks/panel-data/useCarbonData.ts
git commit -m "feat(carbon): add useCarbonData hook for analysis workflow"
```

---

## Chunk 9: Final Verification

### Task 9.1: Update lib/carbon/index.ts with all exports

**Files:**
- Update: `apps/frontend/src/lib/carbon/index.ts`

- [ ] **Step 1: Update barrel export with all modules**

After all files are created, update index.ts to export everything.

- [ ] **Step 2: Run TypeScript check**

```bash
cd /teamspace/studios/this_studio/suna-bim-agent && npx tsc --noEmit --project apps/frontend/tsconfig.json
```

- [ ] **Step 3: Run build**

```bash
cd /teamspace/studios/this_studio/suna-bim-agent && npm run build --prefix apps/frontend
```

---

### Task 9.2: Final Regression Testing

- [ ] **Dashboard Routes** (must be visually UNCHANGED)
  - [ ] `/dashboard` - Main dashboard loads correctly
  - [ ] `/agents` - Agents page renders with correct styling
  - [ ] `/settings/api-keys` - API keys page functional

- [ ] **Landing Page** (new - must match reference)
  - [ ] Visually matches `autonomous-bim-agent.vercel.app`
  - [ ] Emerald/Teal color scheme
  - [ ] Animations working
  - [ ] Dark/light mode works

---

## Summary of Remaining Work

| Task | Files | Est. Time |
|------|-------|-----------|
| 7.1 index.ts | 1 file | 3 min |
| 7.2 thai-materials.ts | 1 file | 5 min |
| 7.3 analysis-pipeline.ts | 1 file | 5 min |
| 7.4 knowledge-graph.ts | 1 file | 5 min |
| 7.5 bank-reports.ts | 1 file | 5 min |
| 7.6 ifc-calculator-integration.ts | 1 file | 5 min |
| 8.1 carbon-store.ts | 1 file | 5 min |
| 8.2 useCarbonData.ts | 1 file | 5 min |
| 9.1 Final verification | - | 10 min |
| **Total** | **8 files** | **~48 min** |

