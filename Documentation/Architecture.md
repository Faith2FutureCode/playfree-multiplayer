## Web AAA Architecture (SMB3-Scale)

### Monorepo layout (web-first)
- packages/web-client: game shell (canvas/WebGL), routing, auth, i18n, offline cache
- packages/game-core: deterministic sim, ECS/physics, camera, input, RNG seeding
- packages/game-content: tilesets, prefabs, enemies, power-ups, world/level configs
- packages/game-netcode: rollback/lockstep, prediction, reconciliation, transport adapters (WebRTC/WebSocket)
- packages/game-replays: record/playback, ghost streaming, signing/validation
- packages/game-editors: level + world editors, validators, publish/review flow
- packages/game-scripting: safe sandbox for triggers/events; limited API surface
- packages/sdk: TS SDK for services (auth, saves, leaderboards, flags, telemetry)
- packages/design-system: shared UI kit (themes, accessibility primitives)
- packages/analytics: event schema, beacons, sampling, privacy-safe defaults
- packages/feature-flags: flag client + typed configs

### Backend services (deployed separately)
- auth: OAuth/email, device links, sessions, bans
- profiles: accounts, cosmetics, progression sync
- saves: cloud saves, settings, accessibility profiles
- ugc: level submit/review/publish, moderation queue, reports
- leaderboards: global/weekly/daily/friend boards; anti-cheat basics
- matchmaking: queues, MMR, lobbies, tournaments
- multiplayer: real-time sessions, relay/relayless, chat/emotes
- replays: upload/store/validate ghosts, signed hashes
- analytics: events, telemetry, heatmaps, A/B flags
- live-ops: events, seasons/battle passes, quests/bounties, rotations
- news: announcements feed, patch notes JSON
- commerce: cosmetics shop, entitlements (cosmetic-only)
- anti-cheat: rate limits, heuristics, replay verification, device signals
- cdn: asset manifests, seasonal skins/tilesets, delta updates
- tournaments: brackets/ladders, seeding
- social: friends/presence, invites, webhooks/Discord
- config: feature flags, remote tuning, experiment configs

### Data contracts
- data/schemas: Protobuf/JSON schemas for packets, events, saves, replays
- data/contracts: generated TS/SDK bindings; single source of truth

### Ops
- ops/infra: IaC (Terraform/Pulumi) for CDN, queues, DBs, caches, observability
- ops/deploy: CI/CD, canary/blue-green, asset pipeline, integrity signing
- ops/observability: logs/metrics/traces dashboards and alerts
- ops/runbooks: incident playbooks, on-call
- ops/security: secrets, signing keys, dependency audits

### Key principles
- Deterministic sim: fixed-step core; render interpolation only
- Rollback-first netcode: minimal, typed state deltas; prediction bounded
- Replays as truth: signed uploads, server verification; ghosts drive spectating + anti-cheat
- Live-ops knobs: all events/rotations/quests driven by data + flags
- CDN-first assets: manifest + integrity hashes; seasonal skins streamed/cached
- UGC pipeline: validators, auto-moderation, human queue, signing/publishing, reporting
- Privacy/compliance: consent, telemetry minimization, data export/delete

### Suggested stacks (web)
- Build: PNPM + Turbo + Vite/ESBuild; code-split by route/subsystem; lazy-load editors/world map
- Rendering: WebGL2/WebGPU-ready; asset compression; dynamic resolution and frame pacing
- Transport: WebRTC data channels with TURN fallback; WebSocket for lockstep/fallback
- Storage: CDN + cache storage for assets; IndexedDB for offline saves/replays; SRP for auth tokens
- Observability: OpenTelemetry, SLOs per service, synthetic probes for matchmaking/leaderboards/CDN
