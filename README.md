# MarketPulse

Real-time financial market monitoring platform built to explore high-performance frontend architecture.

## Tech Stack

- **Frontend**: Lit + Lit Signals + TypeScript + Rspack + Module Federation
- **Backend**: Node.js + WebSocket + Market Simulator Engine
- **Architecture**: Microfrontend monorepo

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Shell (Host App)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Market    │ │Watchlist │ │ Asset    │ │Trade Stream│ │
│  │ Overview  │ │          │ │ Details  │ │            │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│  ┌──────────┐                                           │
│  │ Alerts   │                                           │
│  └──────────┘                                           │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket + REST
┌─────────────────▼───────────────────────────────────────┐
│              Market Simulator Server                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐│
│  │Price Engine   │ │Event Emitter │ │Scenario Injector ││
│  └──────────────┘ └──────────────┘ └──────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install
npm run build:packages
npm run dev
```

## Ports

| Service          | Port |
|------------------|------|
| Shell (Host)     | 3000 |
| Market Overview  | 3001 |
| Watchlist        | 3002 |
| Asset Details    | 3003 |
| Trade Stream     | 3004 |
| Alerts           | 3005 |
| Market Simulator | 4000 |

## Monorepo Structure

```
apps/           → Microfrontend applications (Rspack + Module Federation)
  shell/        → Host app: layout, navigation, remote loading
  market-overview/ → Top gainers/losers, breadth, KPIs
  watchlist/    → User-selected assets, price table, sparklines
  asset-details/→ Asset summary, price metrics, event timeline
  trade-stream/ → Live event feed, scrolling timeline
  alerts/       → Volatility alerts, threshold breaches

packages/       → Shared libraries
  contracts/    → TypeScript types, interfaces, constants
  state/        → Lit Signals state management
  ui/           → Shared web components (design system)
  market-client/→ WebSocket client, REST client
  utils/        → Formatting, math, helpers

server/         → Backend services
  market-simulator/ → Price engine, event streaming, scenario injection
```

## Stress Test Mode

Toggle stress test mode from the shell's header to drive ~10x the event volume
(10ms ticks, larger batches) and observe signal-based reactivity under load. The
toggle sends the shared `STRESS_PROFILE`/`NORMAL_PROFILE` cadence from
`@market-pulse/contracts`, which the server clamps to safe bounds.

## Development & Quality

```bash
npm run build:packages   # build shared libs (contracts → utils → state → client → ui)
npm run typecheck        # type-check all apps + server against the built libs
npm test                 # run the unit/component test suite (Vitest + happy-dom)
npm run coverage         # same, with coverage — fails if any file drops below 80%
npm run build            # full build: packages → apps → server
```

- **Tests** live in `test/` and run on **Vitest** with a `happy-dom`
  environment, so Lit components render in-process. Coverage is collected by
  `@vitest/coverage-v8` and mapped back to source via path aliases. They cover
  the signal store (including the aggregate-recompute regression), event
  batching, the WS/REST client (mocked sockets + fetch), the RAF batcher, the
  simulator engine + REST routes, the chart components, and every microfrontend.
- A **per-file 80% threshold** (lines/branches/functions/statements) is enforced
  in `vitest.config.ts`, so coverage can't silently regress.
- **CI** (`.github/workflows/ci.yml`) runs build → typecheck → coverage →
  production build on every push and PR.
- Backend control (scenario injection, stress test) is exposed to microfrontends
  through `getMarketControl()` in `@market-pulse/state` — no `window` globals.
