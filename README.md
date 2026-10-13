# Bellarej · بلّارج

A free browser game set in Morocco. Tap to fly a little bird in a fez through Marrakech, Fès,
Chefchaouen, the desert, the coast and the night. Collect coins, use the shield and the glass of
mint tea, and unlock six outfits. Menus in English and Arabic.

**Play:** https://youness45x.github.io/bellarej/

## Install it like an app
- **Android (Chrome):** tap **Install app** on the title screen, or use the browser menu → *Install app*.
- **iPhone / iPad (Safari):** tap **Share**, then **Add to Home Screen**.

Once installed it opens full screen from its own icon and plays offline.

## What's in here
| File | What it is |
|---|---|
| `index.html` | The whole game (rules, drawing, sound, menus) in one file. |
| `sw.js` | Offline helper: keeps a copy of the game on the device. Change `VERSION` on every release. |
| `manifest.webmanifest` | App name, icons and colours for installing. |
| `icons/` | App icons, drawn from the game's own bird by `tools/make-icons.js`. |
| `fonts/` | Baloo Bhaijaan 2, trimmed to the letters the game uses (SIL Open Font License, see `fonts/OFL.txt`). |
| `tests/` | Automated checks: `node tests/logic.test.js` and `node tests/browser.test.js`. |
| `tools/build-preview.py` | Builds the private Claude preview copy (`build/preview.html`). |
| `SPEC.md` | The project plan: goals, phases, decisions. |
| `CLAUDE.md` | Working rules for building this project with Claude. |

No accounts, no ads, nothing sent anywhere: progress is saved only on the player's device.
