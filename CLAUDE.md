# Working rules for this project

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
