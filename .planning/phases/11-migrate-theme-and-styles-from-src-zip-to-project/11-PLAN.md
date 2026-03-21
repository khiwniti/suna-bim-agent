---
phase: "11"
name: "Migrate theme and styles from src.zip to project"
created: 2026-03-20
---

# Phase 11: Migrate theme and styles from src.zip to project — Plan

## Wave 1: Extraction
- [ ] Unzip `src.zip` and locate theme assets.
- [ ] Identify Tailwind token definitions.

## Wave 2: Integration
- [ ] Add tokens to `apps/frontend/tailwind.config.js`.
- [ ] Move component CSS to `apps/frontend/src/components`.
- [ ] Update imports throughout codebase.

## Wave 3: Validation
- [ ] Run visual regression tests.
- [ ] Ensure dark mode still works.
- [ ] Clean up unused styles.
