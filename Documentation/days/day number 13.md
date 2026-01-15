## Day 13/365 — January 13, 2206

- Fixed the combat demo start flow: ensured the boss transition triggers reliably and added a fallback so combat always begins even if the transition hiccups.
- Exposed ATB loop controls globally, stopping the undefined errors on Start/Reset and keeping the FF-style command HUD in sync.
- Refreshed the demo UI: status orbs for Ready/Pending/Declined, Start button always available, and the boss HUD now appears only once combat begins.
- Added a forced HUD visibility on the main game overlay to prevent it collapsing when entering the demo.
- Bumped the combat demo script version to pull in all the latest fixes for the showcase build.
