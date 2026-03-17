# Carbon Landing Page Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the complete carbon landing page and components from src.zip to Kortix, matching `autonomous-bim-agent.vercel.app` while preserving all existing Kortix features.

**Architecture:** CSS-only theme injection using `--carbon-*` namespaced variables. All 37+ new files are ADDITIVE - no existing Kortix files are modified except globals.css (additive) and translation files (merge keys only). Landing page uses carbon theme; dashboard keeps existing Kortix theme.

**Tech Stack:** Next.js 14+, Tailwind CSS v4, Framer Motion, next-intl, Zustand, lucide-react

**Spec Reference:** `docs/superpowers/specs/2026-03-17-carbon-landing-migration-design.md`

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
These are purely additive and don't affect existing Kortix styles.
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

### Task 1.4: Verify Kortix Regression (Phase 1 Gate)

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
- All existing Kortix features preserved
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
- [ ] All existing Kortix pages work WITHOUT any visual changes
- [ ] Dark/light mode works on BOTH themes
- [ ] No TypeScript/ESLint errors
- [ ] No console errors
- [ ] Build completes successfully
- [ ] All regression tests pass
