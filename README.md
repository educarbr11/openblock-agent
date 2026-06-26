# DoGoBlock Agent

DoGoBlock Agent is the lightweight local companion for Dogoblock Web.

It does not compile Arduino code. Compilation runs in `dogoblock-api` through
the Arduino compiler endpoint. The Agent only keeps the local hardware bridge
available so the browser can list ports, connect boards and upload compiled
artifacts.

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
