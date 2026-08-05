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

## 2026-08-05 — World + movement

Full world rewrite of game.js: tiled mossy ground plane + dirt clearing (CircleGeometry),
retro rocket ship built from primitives with the gpt-image-2 hull texture, procedural
tree field on a 6-unit hash grid (deterministic — same world every visit, seed 1337).
Trees stream in/out within 44 units of the player; ~74% cell occupancy outside the
11-unit clearing. Five distance tiers defined (Mosslight Belt → The Hush) controlling
canopy tint, fruit color/value, and later tree HP.

Player: little astronaut from primitives (suit, helmet, glowing visor, backpack basket,
saw arm with idle-spinning blade). Virtual joystick (pointer events, capture, 44px throw)
+ WASD/arrows. Circle collision vs trees and ship hull. Camera: smooth-lerp follow at
(0, 27, 14.5) — roughly 6 trees visible in each direction. Ambient spores drift and wrap
in a box around the player. Verified in headless Chromium: no console errors,
movement + tree streaming confirmed by screenshot at phone + desktop sizes.

## 2026-08-05 — Core harvest loop

Sawing: nearest standing tree within 2.7u becomes the target; SAW button (touch) or
Space engages. Damage accrues (persists per tree), orange progress ring floats over the
canopy (billboarded RingGeometry, rebuilt on >2% change), sparks fly, the tree shakes,
blade spins up. At full damage the tree topples away from the player (axis-angle),
shrink-pops, leaves a stump. Stumps regrow into trees after 120s (felled map keyed by
cell, deterministic with world streaming).

Fruit detaches on the fell and arcs into the backpack basket (lerp + sine hop, ~0.7s).
Basket capacity 10; overflow fruit is lost with a message. At the ship (r<7): basket
auto-sells on arrival (fruit value by tier), battery recharges 20%/s. Battery drains
0.1/s idle, 0.45/s walking, 2.8/s sawing; at 0 an emergency tow fades the screen,
returns you to the ship, taxes 35% of the basket, restores 30% charge.

Balance pass after headless playtest: saw range 2.1→2.7 (kept losing target after a
fell), fruitless trees 40%→25% (first felled tree having no fruit felt bad), ship
service zone 5.5→7 (clearing-edge trees made the sale zone annoying to enter).
Verified full loop headless: saw → 3 fruit → walk back (with steering around trees;
head-on tree collision is a hard stop by design) → auto-sale ₡12 → recharge to 100%.

## 2026-08-05 — Ship terminal (upgrades)

Six upgrade tracks as a bottom-sheet terminal at the ship: Battery Cells (100→500),
Basket Rig (10→50), Plasma Saw (1×→6.5× cut), Suit Armor (0→80% damage block),
Sonic Pulser (L1 installs the weapon — dangers land next), Environmental Unit
(L1 = Ember Reach, L2 = The Hush; zones enforced next stage). Escalating costs,
level pips, contextual next-level preview. Action button is contextual now: SAW near
a tree, SHOP in the ship zone; E/Esc on keyboard. Money + levels persist in
localStorage (alienfruit-save-v1); battery refills each session. Verified headless:
buy → effect applied → survives reload.

## 2026-08-05 — Treasures, dangers, pulser, extreme zones

**Dangers.** Spore mines: purple pulsing blobs in treeless cells (density 5%→14% with
tier), proximity-triggered, radial damage with falloff. Stalkers: hopping spiky critters
beyond r=38, chase within 13u, bite (14+7/tier), then back off 3.2s; they refuse to
enter the clearing. All damage hits the battery (the suit IS the health bar), reduced by
armor; red vignette + camera shake feedback.

**Sonic Pulser.** Tap PULSE / F: expanding ground ring, 8 charge, 2.4s cooldown.
Detonates mines harmlessly at range, knocks stalkers back + stuns; at L3+ close-range
stalkers dissolve into credits. Not installed until bought — the button only exists
once the upgrade does.

**Treasures on felling** (deterministic per tree): 7% battery cell (+30% charge),
5% relic (₡15→400 by tier), 2% mystery egg → a glowbug pet hatches, follows you, and
sometimes shakes a bonus fruit loose. One glowbug at a time.

**Zones.** Fog/background color lerps by tier (Ember Reach burns dark red, The Hush is
a pale whiteout with fog closing to 14/38). Entering t3 without Env Unit L1 (or t4
without L2) vents 5.5 charge/s with repeating warnings — a soft gate that punishes
greed but allows smash-and-grab raids.

Fixed a TDZ crash (camShake used by the boot updateCamera call before its let ran) —
moved declaration up. Verified headless: zone warning + venting drain (90→73 in 3s),
pulse fires and costs 8, mines/stalkers stream with the world, no console errors.

## 2026-08-05 — Audio, surprises, mobile QA, README

**Audio** — fully synthesized WebAudio, zero assets: ambient pad (detuned triangles
through an LFO-wobbled lowpass), gated sawtooth+square saw loop, and one-shot envelopes
for fruit catch (pitch rises with tier), tree fall, coin arpeggio on sale, damage noise
burst, pulser sweep, upgrade/treasure chimes. Mute toggle in the HUD. AudioContext
starts on the BEGIN HARVEST tap (mobile autoplay rules).

**Surprises** — Singing trees (1.5% of trees): pulsing halo, four-note hum as you
approach, double fruit when felled. Meteor showers every ~100-180s: cosmetic streak
sprites overhead plus a message. Both discovered, never explained upfront.

**QA** — regression of the full loop still green after audio hooks (saw → 3 fruit →
sell ₡12 → recharge). Verified at 320×568, 390×844, 1280×800: HUD wraps, controls fit,
no console errors anywhere. Added README with play link and architecture notes.
