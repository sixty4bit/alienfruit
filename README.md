# ALIEN FRUIT

A single-file 3D browser game. You've landed on an alien planet and XenoHarvest
Corp. expects fruit. Saw down bioluminescent trees, catch the fruit in your suit's
basket, and haul it back to the ship before your battery dies — the deeper you go,
the tougher the trees, the richer the fruit, and the worse the neighbors.

**Play it: https://sixty4bit.github.io/alienfruit/**

Works on phones and tablets (virtual joystick + hold-to-saw button) and on desktop
(WASD/arrows, Space to saw, F for the pulser, E for the ship terminal).

- Sell fruit and recharge at the ship; buy upgrades at the SHIP TERMINAL
- Six upgrade tracks: battery, basket, plasma saw, armor, sonic pulser, environmental unit
- Spore mines and stalkers want your battery; the pulser disagrees
- Hidden battery cells, relics, a hatchable glowbug, singing trees, meteor showers
- Ember Reach and The Hush are lethal without environmental upgrades
- Progress (credits + upgrades) persists in localStorage

## Tech

- Everything inlined into one `index.html` (~1.6MB): Three.js r160, game code, CSS,
  and all textures as data URIs — no network requests after load
- Textures generated with OpenAI `gpt-image-2` (title key art, ground moss, foliage,
  bark, hull, clearing dirt), compressed to 512px JPEGs
- All audio synthesized live with WebAudio — no sound assets
- Deterministic procedural world from a hash grid (seed 1337): trees, mines, and
  stalkers stream in around the player

## Development

Source lives in `src/` + `vendor/` + `assets/tex/`; `build.py` assembles `index.html`:

```
python3 build.py
```

`notes.md` is the running build log.
