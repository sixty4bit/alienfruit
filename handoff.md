# ALIEN FRUIT — session handoff

**Status: shipped and playable.** https://sixty4bit.github.io/alienfruit/ — GitHub Pages
off `main`, auto-deploys on push (~1 min). Last verified live on a simulated phone:
world spawns, no console errors.

## Where things stand

The full game described in the original brief is implemented and live:

- Title screen with gpt-image-2 key art → top-down 3D harvest game
- Saw trees → fruit arcs into basket → sell + recharge at the ship
- Battery is the health bar; 0% = tow back to ship + 35% basket tax
- Five distance tiers (Mosslight Belt → The Hush): tree HP, fruit value, and danger
  density all scale with radius; trees regrow 120s after felling
- Ship terminal: Battery / Basket / Plasma Saw / Armor / Sonic Pulser / Env Unit,
  escalating costs, saved with money in localStorage (`alienfruit-save-v1`)
- Dangers: spore mines, stalkers (clearing is a safe zone); pulser repels/stuns,
  L3+ dissolves stalkers into credits
- Treasures on felling: battery cells (7%), relics (5%), glowbug pet egg (2%, follows
  you, shakes bonus fruit loose)
- Surprises: singing trees (1.5%, halo + hum + double fruit), meteor showers (~2 min)
- Ember Reach (r>100) needs Env Unit L1, The Hush (r>145) needs L2 — otherwise the
  suit vents 5.5 charge/s (raids are possible, just expensive)
- Synthesized WebAudio throughout, mute toggle in HUD
- Mobile: virtual joystick, contextual SAW/SHOP button, PULSE button, safe-area
  insets; QA'd at 320/390/1280 widths

## How to work on it

- **Never edit `index.html` directly** — it's generated. Edit `src/game.js`,
  `src/style.css`, `src/template.html`, then `python3 build.py` (inlines Three.js
  from `vendor/`, textures from `assets/tex/` as data URIs, prints final size).
- Textures: regenerate with gpt-image-2 (`OPENAI_API_KEY` in env, POST
  /v1/images/generations, see notes.md 1st entry), compress with
  `sips -Z 512 -s format jpeg -s formatOptions 62`.
- Testing: `python3 -m http.server 8642` + Playwright headless (Chromium already in
  `~/Library/Caches/ms-playwright`). Debug handles on `window`: `GAME` (state),
  `GAME_POS()`, `TELEPORT(x,z)`, `APPLY()` (re-apply upgrade levels), `DIAG2()`
  (entity counts). Test scripts from this session are in the scratchpad (gone after
  session) but trivial to rewrite — click `#btn-start`, drive with keyboard, read
  `window.GAME`.
- `notes.md` is the running build log — append per stage, commit with the work.

## Known rough edges (none blocking)

- Head-on tree collision is a dead stop (radial pushout, no slide). Feels fine with
  a joystick; a tangential slide would feel nicer.
- The ship ramp reads as a plain grey slab from top-down.
- Draw calls: ~120 trees × 2-3 meshes each. Fine on modern phones; instancing is the
  lever if older devices chug.
- Balance beyond tier 1 is calculated, not playtested — economy pacing to The Hush
  (₡100/fruit) may need tuning against upgrade costs.
- `felled`/`minesSeen`/`stalkersSeen` grow unbounded within a session (harmless at
  play scale).

## Ideas if a next session continues

- Per-zone canopy/ground textures (gpt-image-2 variants) instead of tint-only zones
- PWA manifest + icon so it installs to home screens
- Daily-seed mode + shareable score; quota contracts from the Corp for structure
- Gamepad support (trivial: map to `input.x/z/action`)

Personal project — keep out of Seerist context. Progress saves live in players'
localStorage, so avoid renaming `alienfruit-save-v1` casually.
