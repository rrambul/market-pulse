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

Toggle stress test mode from the shell's performance panel to increase update frequency 10x and observe signal-based reactivity under load.
