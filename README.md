# Climate Controller — Web Dashboard

A lightweight, responsive dashboard for monitoring and controlling the Climate
Controller (ESP8266 + Peltier + fans) over a local Wi-Fi network. The website
is the interface layer only: all control decisions and hardware safety logic
live in the controller firmware.

## Features

- Live temperature, target, operating mode, Peltier and fan states
- Target temperature control with pending/confirmed/error states
- Manual fan controls (firmware restrictions are surfaced, never overridden)
- Live 5-minute temperature chart (browser-collected history, hand-rolled SVG)
- Accurate connection state: connecting / connected / reconnecting / disconnected
- Stale-data and sensor-error handling
- Browser-local event log
- Light/dark theme (persisted)
- Mock controller for hardware-free development and demos

No internet access, external fonts, or CDNs are required at runtime.

## Getting started

```sh
npm install
npm run dev
```

## Talking to the real controller

By default the app assumes it is **served by the ESP8266 itself** (same
origin, e.g. `http://192.168.4.1/`). That's how it should be deployed — build
with `npm run build` and copy `dist/` to the controller's file system.

For development against a controller on another host, create `.env.local`:

```
VITE_CONTROLLER_BASE_URL=http://192.168.4.1
```

Optional tuning:

```
VITE_POLL_INTERVAL_MS=2000   # status polling interval
VITE_STALE_AFTER_MS=10000    # when data counts as stale
```

## Mock / demo mode

```sh
# .env.local
VITE_USE_MOCK=true
```

Runs against a simulated controller (temperature drift, mode changes, command
failures, connection loss) so the UI can be developed and demonstrated without
hardware. The UI clearly labels demo mode in the header, footer, and About page.

## Firmware protocol

The ESP8266 firmware exposes a minimal read/write protocol (no CORS needed
when the dashboard is served by the board itself, or via the dev proxy below):

```
GET /status
  → {"temperature":1.3,"target":20.0,"peltier":"HEATING","fan1":true,"fan2":true}

GET /settemp?value=20.5   # set target temperature (°C)
GET /mode?value=cool      # operating mode: auto | cool | heat | off
GET /fan1?value=1         # fan 1 on (0 = off)
GET /fan2?value=1         # fan 2 on (0 = off)
GET /off                  # software off: stop Peltier, fans, control loop
```

Notes:

- `/status` has **no mode field**. The dashboard derives the displayed mode
  from the Peltier state (`COOLING → COOL`, `HEATING → HEAT`, otherwise `OFF`),
  so the mode display is read-only. A `/mode` command exists in the firmware,
  but the dashboard does not expose it in the UI.
- `fan1`/`fan2` are booleans in the status payload and are normalised to
  `ON`/`OFF` by the adapter.
- If `/status` lacks a numeric `temperature`, the dashboard treats it as a
  sensor fault and shows the sensor-error notice.

## API adaptation

All communication lives in `src/api/climateApi.ts`. If the firmware changes an
endpoint or payload shape, that file — plus `src/api/index.ts` for routing —
is the only place that needs editing. See the `ClimateApi` interface there for
the expected endpoints and JSON fields.

## Developing against the real board (no CORS hassle)

During `npm run dev`, Vite proxies the firmware endpoints (`/status`,
`/settemp`, `/mode`, `/fan1`, `/fan2`, `/off`) to the board
(default `http://192.168.4.1`, override with `VITE_CONTROLLER_BASE_URL` in
`.env.local`). The browser only ever uses same-origin URLs, so the firmware
does not need CORS headers. In production the app is served by the ESP8266
itself and the proxy is not used.

## Project structure

```text
src/
├── api/            # API adapter + mock controller (all HTTP lives here)
├── assets/         # global stylesheet (CSS variables, themes)
├── components/
│   ├── layout/     # header, footer
│   ├── dashboard/  # temperature, target, mode, status, chart
│   ├── controls/   # fan cards, diagnostics, event log
│   └── shared/     # banners, dialog, connecting screen
├── composables/    # polling/connection, controller state, history, log, theme
├── types/          # shared domain types
├── utils/          # formatting helpers
└── views/          # Dashboard, Controls, About
```

## Build

```sh
npm run build     # type-check + production build
npm run preview   # serve the production build locally
```
