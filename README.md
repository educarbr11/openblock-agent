# DoGoBlock Agent

DoGoBlock Agent is the lightweight local companion for Dogoblock Web.

The standard build does not compile Arduino code. Compilation runs in
`dogoblock-api` through the Arduino compiler endpoint. The Agent only keeps the
local hardware bridge available so the browser can list ports, connect boards
and upload compiled artifacts.

The **Offline** build (`npm run dist:offline`) also ships the Arduino AVR
compiler, so the web editor can send Arduino programs without internet. See
[Offline build](#offline-build).

## Architecture

- Dogoblock Web generates Arduino code from blocks.
- Dogoblock API compiles the code and returns a temporary `.hex` artifact.
- Dogoblock Agent receives the compiled artifact through OpenBlock Link.
- OpenBlock Link writes the artifact to the board through the local serial port.

The Agent exposes only the local Link server:

```text
http://127.0.0.1:20111/
ws://127.0.0.1:20111/openblock/serialport
```
    
The old resource server on `20112` is no longer part of the Agent. Web editor
resources such as LCD and LED Matrix extensions are served by `openblock-gui`
from `/static/device-extensions`.

## Supported Upload Flow

Initial lightweight support focuses on Arduino AVR boards:

- Arduino Uno
- Arduino Nano
- Arduino Leonardo

The compiler API is responsible for board-specific compilation. The Agent uses
the compiled `.hex` and uploads it with the local AVR uploader.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Build a distributable:

```bash
npm run dist
```

During packaging, resources are pruned so only the local connection server,
drivers, minimal firmware files and the AVR uploader are included.

## Offline build

`DoGoBlock Agent Offline` is the same app packaged with the Arduino AVR
toolchain (`arduino-cli`, `arduino:avr` core, Servo, SimpleList and the
LiquidCrystal library from `local-resources/extensions/displayLcd`). It is meant
for Chromebooks (installed in the ChromeOS Linux environment) and other
computers that must send Arduino programs without Dogoblock API.

```bash
npm run dist:offline
npm run verify:package:offline
```

The output is `dist/DoGoBlock-Agent-Offline_v<version>_linux_<arch>.deb` and
`.AppImage`, about 300 MB larger than the standard build once installed. The
`openblock-tools` toolchain is x64 only, so build it on x64 and install it only
on Intel/AMD machines.

How it is used:

- The web editor compiles through Dogoblock API while it is reachable. When the
  browser is offline or the API does not answer, it compiles through
  `ws://127.0.0.1:20111/openblock/compiler`, provided by `openblock-link`.
- The compiled `.hex` is uploaded through Web Serial (Uno and Nano) or through
  this Agent (Leonardo), exactly like an artifact from the API.
- The compiler route only accepts local connections from allowed web origins
  (`https://dogoblock.vercel.app`, `https://*.dogomaker.com` and `localhost` by
  default; see `openblock-link/src/session/compiler.js`).
- The Agent window shows whether the offline compiler is included.

The compiler route requires an `openblock-link` revision that contains
`src/session/compiler.js`. Update the `openblock-link` tarball in
`package.json` to that commit and run `npm install` before building.

Installation guide for schools: [docs/chromebook.md](./docs/chromebook.md).
