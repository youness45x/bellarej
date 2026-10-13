# Bellarej (working title)

## Goal
A free, original browser game in the "tap to fly through gaps" genre, set in a Moroccan world. The player guides a little round bird in a fez through six Moroccan places, past riad walls hung with carpets and lanterns. (The name *bellarej*, stork in Darija, is kept as the game's title.)

- **For whom:** friends, family and anyone the owner shares the link with.
- **Success criterion (3 months):** people play it more than once and come back on their own.

## Users and roles
| Role | What they can do |
|---|---|
| Player | Play, collect coins, unlock and pick characters, change language and sound. No account needed. |
| Owner | Shares the link, playtests, decides on changes. |

## Main user journey
1. Open the link on a phone or computer, or the installed app from its home-screen icon (works offline).
2. Start menu: Play, Shop, language (EN/AR), sound on/off.
3. Tap (or press Space) to flap; fly through gaps between obstacles.
4. Collect coins and power-ups; the place changes every 20 points (Marrakech → Fès → Chefchaouen → Desert → Coast → Night, then again).
5. Crash → game-over screen with score, best score and coins earned.
6. Restart, or spend coins in the shop on a new outfit.

## Scope
- **First version:**
  - Core gameplay: flap, gravity, obstacles, score, game over, restart.
  - Moroccan flat-vector scenery drawn in code, animated hero, sound effects. Look follows the owner's design sheet (Phase 6).
  - English and Arabic menus (Arabic right-to-left).
  - Coins, plus two power-ups: shield and slow motion.
  - Changing places every 20 points: Marrakech, Fès, Chefchaouen, Desert (sunset), Coast, Night.
  - Shop with six outfits unlocked with coins.
  - Progress saved on the player's device.
  - Installable as an app from the browser (home-screen icon, full screen, offline) — Phase 7.
- **Later:**
  - Online leaderboard.
  - Background music.
  - French menus.
  - Ads.
  - More power-ups and worlds.
- **Out of scope:**
  - Accounts and login.
  - Real-money purchases.
  - App-store versions (Google Play, Apple App Store) for now. Possible later step: Google Play ($25 once, 12 testers for 14 days first); Apple is $99/year with a real risk of rejection.
  - Any name, art or sound from Flappy Bird.

## Data
- **What is stored**, in the player's browser only (localStorage):
  - best score
  - coin total
  - unlocked characters
  - selected character
  - language
  - sound on/off
- **Sensitivity:** none. No personal data is collected and nothing is sent to any server.
- **Who sees what:** each player sees only their own progress.
- **Backups:** none. Progress is lost if the player clears browser data, which is acceptable for this game.
- **If storage is blocked** (e.g. some private-browsing modes): the game still plays, it just doesn't remember progress.

## External connections
| Service | Used for |
|---|---|
| GitHub Pages | Free public hosting of the game and app (since Phase 7). |
| Google Fonts (Baloo Bhaijaan 2) | Only in the private Claude preview copy. The public game ships its own trimmed copy of the font, so it makes no outside requests. |

## Technical decisions
| Decision | Choice | Plain reason |
|---|---|---|
| Type | Single web page (HTML5) | Works on phone and computer from one link; nothing to install. |
| Game code | Plain JavaScript on a `<canvas>` (a drawing area in the page), no game engine | A game this size doesn't need an engine; one simple file is easier to maintain. |
| Graphics | Flat vector shapes drawn in code, styled after the owner's design sheet | Sharp on every screen, no image files, no licensing. Code can match the sheet's colours, shapes and objects, not its painted lighting. |
| Sound | Short effects generated in code (Web Audio) | No audio files to license; tiny download. |
| Saving | Browser localStorage, wrapped so the game survives if it's blocked | Free, no server, no accounts. |
| Languages | English + Arabic text table; menus flip right-to-left in Arabic | Few words in the game, so RTL costs little. |
| Hosting | GitHub Pages, repository `youness45x/bellarej` (public) | Free, gives a public address, keeps every version of the code; supports a custom domain later. |
| Preview | Private Claude link, built from the same code by `tools/build-preview.py` | Quick look and playtest without publishing. |
| Installable app | Web app manifest + offline helper (`sw.js`) | Home-screen icon, full screen and offline play on Android and iPhone, with no store and no fees. |
| Font | Baloo Bhaijaan 2 bundled in the game (trimmed, 70 KB, open licence) | Works offline; no request to Google from the public game. |

## Launch and operations
- **Where it runs:** https://youness45x.github.io/bellarej/ (public, from Phase 7), installable as an app.
- **Code:** GitHub repository `youness45x/bellarej`. Every change is a commit, so any earlier version can be restored.
- **Private preview link:** https://claude.ai/artifact/F6sfUQ5hGogAx5jFvo2XdC (same game, without install/offline). Future sessions keep updating this same link.
- **Releasing a new version:** change `VERSION` in `sw.js`, push to GitHub; installed apps pick it up the next time they open with internet.
- **When it breaks:** the owner reports it at the start of the next session; it is fixed using the bug rules below.
- **Acceptable data loss:** a player's local progress if they clear their browser or uninstall the app. No server data exists. Progress made on the Claude preview link does not carry over to the public address (different website).

## Constraints
- **Budget:** 0 MAD/month. GitHub Pages' free tier is far above this game's needs (estimate, checked 2026-10-13). A custom domain, if wanted later, is the only possible cost.
- **Deadline:** none.
- **Maintenance:** the owner, working with Claude, one phase per session.

## Risks
| Risk | How we handle it |
|---|---|
| Looking like a copy of Flappy Bird | Original name, world, art and sounds; no Flappy Bird branding anywhere. Since Phase 6 the hero is a small round bird, which is closer to that game's look, so it always wears an outfit (fez, scarf, turban…), walls are Moroccan buildings, never pipes. |
| Too hard or too easy | Playtest on the owner's phone at the end of every phase; difficulty values kept in one place to tune quickly. |
| Scope creep | Each twist has its own phase; new ideas go to "Later". |
| Code is public | The repository must be public for free hosting. It holds no passwords or personal data; anyone could copy the game, which is acceptable for a free game. |
| An installed app keeps an old version | The game page always checks the internet first; a new `sw.js` VERSION clears old saved copies (checked automatically). |
| Choppy on older phones | Simple shapes, a capped number of moving objects, each sky painted once and reused, place changes faded at half resolution; testing on a real phone each phase. |
| Saves lost or storage blocked | Game never crashes because of storage; progress loss is accepted. |
| Arabic text displays wrong | Test every menu in Arabic each phase; use a font that supports Arabic; never letter-space Arabic text. |
| No sound on iPhone | The iPhone's silent switch also silences web-game sounds. Not a bug; tell testers to flip it if they hear nothing. |

## Phases
| Phase | Includes | Acceptance checks | Status |
|---|---|---|---|
| 1. Playable core | Stork as a simple shape, gravity, flap, scrolling obstacles with gaps, score, game over, restart | 1) Tap, click or Space makes the stork flap; it falls when I stop. 2) Hitting an obstacle or the ground ends the run; the stork can't escape off the top. 3) Score goes up by 1 per gap passed. 4) Restart starts a fresh run. 5) Hard cases: rapid multi-taps, rotating the phone, and switching tabs and back don't break the game. 6) Smooth on my phone. | **Done 2026-10-13.** Automated checks pass; owner confirmed on a real phone. |
| 2. Look and feel | Moroccan sky, layered rooftops and minarets moving at different speeds, minaret/riad-wall obstacles, animated stork, sound effects, start menu, EN/AR toggle, mute button | 1) The scenery looks Moroccan and moves with depth. 2) The stork flaps its wings and tilts up and down. 3) Flap, score and crash sounds play; mute silences them. 4) In Arabic, menus read right-to-left with correct letters. 5) Hard case: language and mute choices survive a page reload. | **Done 2026-10-13.** Automated checks pass; owner confirmed on a real phone. |
| 3. Coins and power-ups | Coins in gaps, shield (absorbs one hit), slow motion (~5 s), coin total, best score, saving | 1) Collecting a coin adds to the total. 2) Shield visibly absorbs exactly one hit. 3) Slow motion shows a timer and ends on time. 4) Best score and coins survive closing the browser. 5) Hard case: with storage blocked (private window), the game still plays. | **Done 2026-10-13.** Owner confirmed on a real phone. Automated: all 5 checks pass automatically (slow motion measured at 5.0 s ± 0.25 in a real browser; "closing the browser" tested by fully closing and reopening a browser profile). |
| 4. Changing worlds | Day → sunset → night every 20 points, looping; slight difficulty increase per world | 1) The world changes smoothly at 20 and 40 points. 2) After night, it loops back to day. 3) Later worlds are harder but still passable. 4) Hard case: a world change during an active power-up breaks nothing. | **Done 2026-10-13.** Owner confirmed on a real phone. Automated: all 4 checks pass automatically (colours blend over 2.5 s; an autopilot reaches 110 points on 5 different random courses). |
| 5. Character shop | Shop screen with 3–4 characters, prices, buy, select, saved choice | 1) The shop shows characters and prices. 2) Buying deducts coins and unlocks the character. 3) The selected character is used in the game and remembered. 4) Not enough coins: buy is disabled with a clear message. 5) Hard case: double-tapping Buy charges only once. | **Done 2026-10-13.** Owner confirmed on a real phone. Automated: all 5 checks pass automatically (phone portrait and landscape, English and Arabic, storage blocked). |
| 6. Redesign from the design sheet | Round fez-wearing hero with 6 outfits (Classic, Riad, Chefchaouen, Desert, Night, Royal); 6 places (Marrakech, Fès, Chefchaouen, Desert, Coast, Night); walls decorated with carpets, lanterns, cedar windows, flower pots, shutters; cats and pigeons on the street walls; golden logo with fez, "Fly through Morocco" ribbon, "Tap to play"; pause button, crown best score; cream panels; old saves carried over | 1) Title screen looks like the sheet: golden logo with fez, ribbon, big hero, "Tap to play". 2) Each place is recognisable and changes every 20 points, looping after Night. 3) All six outfits show in the shop and in the game. 4) Pause button pauses without a flap; crown shows the best score. 5) Hard cases: an old save keeps its birds as outfits; Arabic and phone-sideways layouts don't overlap; still smooth on my phone. | **Done 2026-10-13.** Owner confirmed on a real phone. Automated: all 5 checks pass automatically (86 logic + 116 browser checks). Smooth: 55–60 fps at phone size with a 4× slower CPU; a place change dips to ~43 fps for 1.5 s on that slowed CPU. |
| 7. Installable app | Public address on GitHub Pages; app manifest and icons; offline helper; bundled font; Install button (Android/computer) and Share → Add to Home Screen explanation (iPhone), EN + AR | 1) The game opens at its public address on my phone and computer. 2) I can install it: Bellarej icon on the home screen, opens full screen. 3) After one visit it opens and plays in airplane mode. 4) A new version arrives the next time I open it with internet. 5) Hard cases: progress kept between launches and after an update; no Install button inside the installed app; earlier checks all still pass. | **Done 2026-10-13.** Owner confirmed on a real phone ("looks good"). Live at https://youness45x.github.io/bellarej/: all 5 checks pass automatically on a local web address (86 logic + 149 browser checks); the live page, manifest, offline helper and font folder were confirmed online. |

**Check totals after Phase 7 and the difficulty tuning (2026-10-13):** 92 logic checks + 149 browser checks, all passing, covering every phase. Since Phase 7 the browser checks run on a local web address instead of a file.


## Assumptions
These were decided without explicit confirmation; review any time.
- Working title "Bellarej".
- No deadline.
- Sound effects only in the first version; music comes later.
- ~~Shop characters: stork (free), hoopoe, Essaouira seagull, falcon.~~ Since Phase 6: six outfits on one hero.
- A world change every 20 points.
- Font: Baloo Bhaijaan 2 from Google Fonts.
- After a crash, taps are ignored for 0.45 s, then a tap returns to the title screen (not straight into a new run).
- Leaving the game (tab or app switch) pauses it; the next tap resumes without a flap.
- Difficulty starting values: gap 180 (was 170), obstacle spacing 240, scroll speed 150, gravity 1420 (was 1500), flap speed 457 (was 470) — all in one tuning list in the code.
- Arabic title "بلّارج"; Arabic menu words: العب، استراحة، انتهت الجولة، النتيجة، العب مجدداً. Score digits stay 0–9 in both languages.
- Language is changed on the title screen only; the sound button is always visible (and the M key toggles it on a computer).
- ~~No Shop button on the menu until Phase 5~~ — the Shop button arrived with Phase 5.
- Coins sit in about 70% of gaps; a power-up appears in about 12% of gaps, never in the first 4 of a run, never two of the same on screen, never one that's already running.
- Shield: shown as a blue shield in a bubble. Absorbs one hit from an obstacle **or the ground** (it bounces the stork up). After it breaks, obstacles can't hurt for 1 s so the player can fly clear; the stork blinks during that time.
- Slow motion: shown as a glass of mint tea. The world runs at 60% speed for 5 real seconds, easing in and out; a countdown ring shows the seconds left. Picking up another one while it's running isn't possible (never offered).
- Coins are saved the moment they're collected; the best score is saved at the end of a run and when the player leaves the game.
- The coin counter during a run shows the total saved coins; the game-over panel shows "+N" earned this run, the best score and a "New best!" badge.
- Difficulty per world: the opening shrinks by 6 and speed rises by 8, capped after 4 changes (opening 180 → 156, speed 150 → 182). Speed changes gently over about 1.5 s. Obstacles already on screen keep their opening size when the world changes.
- Place change: the new scene fades in over 1.5 s (was 2.5 s, shortened for older phones), the place name shows for ~1.8 s, with a soft three-note chime. After a crash, the title screen fades back to Marrakech in 1 s.
- Night: moon, twinkling stars, glowing lanterns and lit windows. Walls stay light-coloured with dark outlines in every place so they're always easy to see.
- Places, in order: Marrakech (Koutoubia, pink Atlas), Fès (green-tiled roofs), Chefchaouen (blue and white town, Rif mountains), Desert (sunset, dunes, kasbahs), Coast (sea, white town, lighthouse, blue boats), Night (Marrakech by moonlight).
- Each wall keeps the style of the place where it appeared, so walls never change look while on screen.
- Carpets, lanterns, windows, pots and laundry sit on the wall face, inside what you can hit. Cats and pigeons sit only on the background walls, never on obstacles.
- Outfits are looks only: all six fly exactly the same (same size, same hitbox), so buying never makes the game easier.
- Prices: Classic free, Riad 40, Chefchaouen 80, Desert 140, Night 220, Royal 350 coins (one list in the code).
- Old saves: stork → Classic, hoopoe → Riad, Essaouira gull → Chefchaouen, falcon → Desert; best score, coins and the chosen bird carry over.
- Buying a bird also chooses it. The shop opens from the title screen only; Back or Escape closes it.
- Phase 6 Arabic words: حلّق عبر المغرب (fly through Morocco), انقر للعب (tap to play), إيقاف مؤقت (pause), مراكش / فاس / شفشاون / الصحراء / الساحل / الليل (places), كلاسيكي / رياض / شفشاون / صحراوي / ليلي / ملكي (outfits).
- In a run the top corners show Pause and the crown best score; the sound button appears on the title, pause and game-over screens (M key works any time; P or Escape pauses on a computer).
- The hero is drawn bigger on the title screen and shrinks smoothly to play size when the run starts.
- Arabic words added (Phase 5): أفضل نتيجة (best), العملات (coins), رقم قياسي جديد! (new best), درع (shield), النهار / الغروب / الليل (day / sunset / night), المتجر (shop), رجوع (back), اختر (choose), مختار (chosen), اشترِ (buy), "ينقصك من العملات: N" (need N more coins), بلّارج / الهدهد / نورس الصويرة / الصقر (stork / hoopoe / Essaouira gull / falcon).
- Phase 7: the app opens full screen (`display: fullscreen`, falls back to standalone), any orientation, blue (#2f86d6) splash. The icon is the Classic bird over a blue sky and rooftops.
- Phase 7: the game page always asks the internet first and falls back to the saved copy when offline or after 3.5 s on a slow network; font and icons come from the saved copy.
- Phase 7 Arabic words: ثبّت التطبيق (install app), «على الآيفون أو الآيباد: اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».» (iPhone instructions).
- On a phone held sideways, the title menu sits in one row (best, coins, Tap to play, Shop) and the shop shows all six outfits in one row.

## Decision log
| Date | Decision | Reason |
|---|---|---|
| 2026-10-12 | Browser game, not app stores | Free, no review, easy to share. |
| 2026-10-12 | Stork over Moroccan rooftops, flat-vector graphics | Original, recognizable, drawn in code. |
| 2026-10-12 | Twists: coins and power-ups, changing worlds, character unlocks | Owner's choice. |
| 2026-10-12 | Saves on the player's device only; menus in EN + AR | No accounts or personal data; fits the audience. |
| 2026-10-12 | Goal is fun and sharing, no ads | Keeps the first version simple and free of ad-policy work. |
| 2026-10-12 | Claude decides technical choices and explains them | Owner's preference. |
| 2026-10-13 | Plain JavaScript and canvas, no engine; GitHub Pages as optional host | Simplest to maintain; free. |
| 2026-10-13 | Game rules kept separate from drawing, with automated checks | Lets every phase re-run all earlier checks in seconds, so new features can't silently break old ones. |
| 2026-10-13 | Short pause after a crash before a restart is possible | So frantic taps at the moment of a crash can't skip the score screen. |
| 2026-10-13 | Phase 1 accepted by the owner | Tested on a real phone. |
| 2026-10-13 | Obstacles alternate between minarets and red-brick riad walls; decorations stay inside the collision box | Variety, and what you see is exactly what you hit. |
| 2026-10-13 | Scenery has no outlines; obstacles and the stork have dark outlines | The player instantly sees what matters. |
| 2026-10-13 | Scenery colours kept in one palette list | Phase 4 (sunset, night) only swaps colours. |
| 2026-10-13 | Sound unlocks on finger release as well as press (bug found in testing) | Phones only allow sound after a finger release; otherwise the first sounds could be silent. |
| 2026-10-13 | Phase 2 accepted by the owner | Tested on a real phone. |
| 2026-10-13 | Phases 3, 4 and 5 built in one session, each fully checked and published before the next | Owner's request ("go for the rest"). Trade-off: one combined phone playtest for three phases instead of one per phase. |
| 2026-10-13 | Characters change looks only, never how the bird flies | Fair: coins buy style, not an easier game. |
| 2026-10-13 | Difficulty ramp kept gentle (−6 opening, +8 speed per world, capped) | The brief says "slight"; first draft (−7 / +10) made the hardest world 16% tighter and 27% faster. |
| 2026-10-13 | Each obstacle keeps its opening size when the world changes | A world change never resizes a gap the player is already flying towards. |
| 2026-10-13 | Slow motion counts real seconds; the world slows to 60% | "Ends on time" means 5 seconds on the player's clock. |
| 2026-10-13 | Coins saved the instant they're collected | Closing the browser mid-run loses nothing. |
| 2026-10-13 | Automated checks stored on the game link next to the game (`tests/logic.test.js`, `tests/browser.test.js`) | Earlier checks lived only in a session's workspace and were lost; now they're in the link's version history with the code. |
| 2026-10-13 | Phase 6: redesign the whole look from the owner's design sheet | Owner's request ("redesign using the sheet"). |
| 2026-10-13 | Hero becomes the sheet's round bird in a fez (the stork is replaced; the title Bellarej stays) | Owner's choice, over Claude's suggestion to keep a stork. Risk noted: closer to Flappy Bird's round bird, handled by outfits and Moroccan walls. |
| 2026-10-13 | Six outfits replace the four birds; old purchases carried over to the outfit in the same shop place | Owner's choice; nobody loses what they paid for. |
| 2026-10-13 | Six places in a loop replace day / sunset / night | Owner's choice; follows the sheet's "Environments" panel. Difficulty ramp unchanged (still capped after 4 changes). |
| 2026-10-13 | Sheet objects (carpets, lanterns, pots, laundry) drawn inside the walls, never sticking into the gap | Owner's choice; what you see is still exactly what you hit. |
| 2026-10-13 | Pause button and crown best score in a run; the sound button moves to the menus and pause screen | Matches the sheet's game screens; a tap on Pause never flaps. |
| 2026-10-13 | Each sky painted once and reused; place-change fade drawn at half resolution and shortened to 1.5 s | The richer scenery measured 48 fps on a 4× slower CPU; after these changes 55–60 fps (previous version: 52–58). |
| 2026-10-13 | Browser checks ignore the game's own random coins while holding the bird still, and wait for the fade's midpoint instead of a fixed delay | Two checks failed intermittently on slower runs (bug rule: reproduced twice, root cause in the checks, not the game). |
| 2026-10-13 | Phases 3, 4, 5 and 6 accepted by the owner | Tested on a real phone in one combined playtest. All phases of the first version are now done. |
| 2026-10-13 | Phase 7: make Bellarej installable (home-screen app, offline) and host it on GitHub Pages | Owner's choice ("step 1"); free, works on Android and iPhone, no store review. App stores stay out of scope for now. |
| 2026-10-13 | The GitHub repository becomes the home of the code; the Claude link stays as a private preview built from the same file | One source of truth with full history; no two diverging copies. |
| 2026-10-13 | Font bundled with the game (trimmed to the letters used) instead of Google Fonts | Needed for offline play; also means the public game contacts no other website. |
| 2026-10-13 | Logo height capped and the big title bird drawn a little lower | With the real font the logo was taller and covered the bird's fez (worst in Arabic); a new check measures it. |
| 2026-10-13 | Browser checks run on a local web address | Offline mode and installing only work on a real address; it is also closer to the live site. |
| 2026-10-13 | Phase 7 accepted by the owner | Tested on a real phone ("looks good"). |
| 2026-10-13 | Difficulty made a little easier: opening 170 → 180 (hardest 156), slightly softer fall (gravity 1500 → 1420, flap 470 → 457, so one tap lifts the bird the same ~74 units) | Owner's playtest: "a bit hard", gaps felt narrow; owner chose "a little easier". Speed and spacing unchanged. Released as offline version bellarej-7.1.0. |

## Working rules
These rules also live in `CLAUDE.md` in the repository.

- Read SPEC.md at the start of every session. It is the reference.
- The GitHub repository `youness45x/bellarej` holds the complete, current code (`index.html`), the automated checks, SPEC.md and CLAUDE.md. Start each session by attaching it; earlier versions are in its history.
- Run both check scripts before and after every change: `node tests/logic.test.js` and `node tests/browser.test.js` (headless Chromium via Playwright, on a local web address). Add new checks for each phase or bug.
- On every release: change `VERSION` in `sw.js`, rebuild the preview (`python3 tools/build-preview.py`), commit and push, then update the private Claude preview link.
- Talk to the owner in the language they write in (Arabic, Darija or English). Code, file names and commits stay in English.
- The owner is not a programmer: explain every important decision simply, and flag risks even when not asked.
- Work on one phase at a time. Start each session by stating the current phase and its remaining acceptance checks.
- Never say something is done, fixed or working until you have run it and checked the acceptance checks, including the hard cases. Show the evidence.
- Bugs: reproduce → root cause → smallest fix → re-run checks → add a check so it can't come back.
- If the same problem fails to fix 3 times: stop, go back to the last working version, explain, and diagnose before writing new code.
- Commit to Git after every successful step.
- Never put API keys or passwords in the game code or in Git.
- Don't add a new library without a clear reason.
- Don't change a decision recorded in SPEC.md without approval. Log every new decision in the decision log.
- New ideas go to "Later", not into the current phase.
- Check current prices with a web search before quoting any cost.
- Update the phase table in SPEC.md when each phase ends.
