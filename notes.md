# ALIEN FRUIT — build notes

Working log for the game build. Newest entries at the bottom.

## 2026-08-05 — Project setup + title screen

**Architecture.** Requirement: everything playable from a single `index.html` on GitHub Pages.
Source lives in `src/` (template.html, style.css, game.js), Three.js r160 in `vendor/`,
gpt-image-2 textures in `assets/tex/`. `build.py` inlines all of it (textures as base64
data URIs) into `index.html`. Edit source, run `python3 build.py`, commit both.

**Textures.** Generated 6 images with gpt-image-2 (`/v1/images/generations`):
title key art (1536×1024, high), plus seamless tiles for ground moss, tree foliage,
bark, ship hull, and landing-clearing dirt (1024², medium). Compressed via `sips` to
512px JPEGs (~80–100KB each), title at 1024w. Total texture payload ~670KB base64.

**Title screen.** DOM/CSS overlay on the Three.js canvas: gpt-image-2 key art background,
gradient falloff to game palette (#07030f), ALIEN/FRUIT two-tone wordmark (teal/magenta),
XenoHarvest Corp. framing for tone, pulsing BEGIN HARVEST button, drifting spore
particles (THREE.Points) behind everything. Mobile-first: clamp() type sizes,
safe-area insets, touch-action none.

**Game design decisions locked in** (playing it fast, no design-by-committee):
- Top-down tilted camera (~35° off vertical) so trees read as 3D, ~6 trees visible each direction.
- Ship at origin, cleared circle around it; trees spawn on distance-scaled procedural rings.
- Hold-to-saw near a tree → progress ring → tree topples → fruit arcs into basket.
- Battery drains walking/sawing; recharge + auto-sell basket at ship. Battery death = drone tow + basket tax, not game over.
- Tiers by distance: tree HP up, fruit value up. Extreme zones (heat/spore) gated by Environmental Unit upgrade.
- Dangers: spore mines, stalker critters. Weapon: Sonic Pulser (repels/stuns — not a shooter).
- Treasures: rare relics/battery cells inside trees; occasional mystery egg (surprise hook).
- Upgrades at ship: Battery, Basket, Saw, Armor, Pulser, Env Unit. localStorage persistence.
