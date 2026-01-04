# Online Feature Catalog (Web SMB3 Scale)

## Core Online
- Basic analytics: page views, session length, error logging (privacy-safe/self-hosted option)
- Cloud saves: progress/settings per user; magic link/local token; simple key-value backend
- Global leaderboard: best times/scores; anti-cheat basics (rate limits, simple validation)
- Weekly/daily challenges: rotating seed/level with dedicated leaderboard; scheduled resets
- Ghost replays: upload/download movement traces; server stores runs; signed replay hashes
- Social sharing hooks: shareable links/cards for levels/seeds; optional referral stats
- Account system: email/password or OAuth; sync coins/unlocks across devices

## Competitive & Social
- Friend system: add/approve, compare stats, invite to races; presence indicators
- Co-op/versus multiplayer (async): turn-based/time-shifted runs; minimal real-time needs
- Real-time multiplayer: rollback/lockstep netcode, matchmaking, chat/emoji, hit validation
- Spectator mode: watch live runs or top replays; follow friends/rivals
- Webhooks/Discord integration: post highscores or event starts to community servers

## Live Ops & Progression
- Seasonal events/battle passes: time-limited goals with cosmetic rewards
- Daily quests/bounties: rotating tasks that grant coins/skins
- In-game news/announcements: small JSON feed for updates, patch notes, tips
- Content rotation: remote playlist of levels/tileset themes; swap without redeploy
- Seasonal skins/tilesets via CDN: streamed, cached offline; manifest + integrity hashes

## UGC & Editors
- User-generated levels: submit/download; moderation queue, reporting
- World creator: share overworlds/world maps; gating rules, progression metadata
- Player-created challenges: pick seed + modifiers; mini leaderboard per link
- Validators & safety: schema checks, banned patterns, auto-moderation heuristics

## Personalization & Accessibility
- Accessibility profiles in cloud: colorblind palettes, input remaps
- Performance tuning: remote difficulty/physics tweaks for playtests (gravity/speed/HP)
- Player polls/feedback prompts: served from JSON endpoint; trigger after runs

## Anti-Cheat & Integrity
- Verification: signed replay uploads, server-side validation, rate limits
- Device/behavior signals: heuristics for tampering; soft/hard bans

## Telemetry & Experimentation
- Level analytics: death/coin heatmaps to tune layouts
- Performance telemetry: FPS/load-time pings by device to catch regressions
- A/B tests/feature flags: remotely toggle mechanics/HUD; typed configs

## Monetization (Cosmetic-Only)
- Shop/donate button/season pass: entitlements handled server-side; cosmetic-only
