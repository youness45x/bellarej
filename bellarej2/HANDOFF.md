# Bellarej 2 — handoff (2026-10-14)

Read this first, then `DECISIONS.md` (every decision, newest at the bottom).

## What Bellarej 2 is
A free-flight runner for Android phones, made in **Unity**. You fly low and fast through Moroccan medina
streets: a bird in the easy stages (birds fly alone), then a dragon carrying a rider. Win a stage → the bird
lands on Yassine's shoulder, he whistles, a dragon arrives, he jumps on, the next stage starts.
Game ideas (Darija): `doc/Bellarej2-daftar-afkar.pdf`. Note: the PDF's "3 lanes × 3 heights" is REPLACED by free flight.

## Controls (decided)
Drone-style thumb control: touch anywhere = virtual joystick; thumb offset from the touch point = climb/turn rate;
release = auto-level. Dead zone, response curve, smoothing, sensitivity slider. "Invert up/down" switch (owner wants
slide up = dive). Power = tap with a second finger. Easy stages gently steer toward the gap.

## Look (decided)
2.5D: a real 3D street built from flat pictures. Kit wall pieces = side walls in perspective; far background at the end;
characters/obstacles = flat cut-outs facing the camera; the mount = back-view frames, tilted to bank. Effects are made by
the engine (wind streaks, dust, fire, blur, fog) — nothing see-through is painted into the pictures.
Motion reference: low skimming, banking slalom, spring camera, speed streaks; camera rolls ~1/3 of the mount.

## Owner's PC (Windows, "DESKTOP-9M7…") — already done
- Unity CLI 1.0.0-beta.13, signed in, Unity Personal licence active.
- Unity 6.3 LTS (6000.3.26f1) + Android Build Support, OpenJDK, NDK, SDK. Took 19.4 GB; ~26.9 GB free left. Keep ≥15 GB free.
- Money: nothing for now. Platform: Android first.
- The owner is not a programmer: one small step at a time, explain simply, he works on this PC (never block it).

## Art (all approved cut-outs, transparent PNG)
`cutouts/bellarej2-*.zip`: birds (5 × flying + landing), dragons (5), riders (Yassine incl. whistle/jump, Salma, Jeddi,
Mishmish), street (9 sheets), obstacles (easy/medium/hard, 30), places (6 kits with `joins.json` + 6 seamless backgrounds),
icons (16). Still to regenerate (stand-ins included): desert kit, spice merchant, power-ups without bubbles.
Prompt kit: `doc/prompts.html` (built by `doc/make_prompts.py`). Cut-out tools: `tools/` (source sheets are not in Git).

## Next step
Create the Unity project "Bellarej2" (3D URP template) in a folder the owner allows, Git + GitHub repo, import the cut-outs.
First playable goal: a one-minute "feel test" — Atlas flying down one Marrakech street with the thumb controls, speed effects
and spring camera, on the owner's Android phone. Tune sensitivity and the up/down direction with him.
