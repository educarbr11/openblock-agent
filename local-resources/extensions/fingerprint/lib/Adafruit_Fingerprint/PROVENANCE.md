# Adafruit Fingerprint Sensor Library

Vendored from the official Adafruit repository without source changes:

- Repository: https://github.com/adafruit/Adafruit-Fingerprint-Sensor-Library
- Release: `2.1.4`
- Commit: `b5de3ff6b430922d702db76e0c9ce29200c06d34`
- Source: https://github.com/adafruit/Adafruit-Fingerprint-Sensor-Library/tree/2.1.4
- License: BSD, preserved as `LICENSE` (upstream filename: `license.txt`).

Only the two source files, library manifest and license are included. The
DoGoBlock behavior and enrollment guards live in the separate `DoGoFingerprint`
library. Do not patch the vendor files when changing the blocks.

SHA-256:

```text
a614052ec3f49af537b2fe85d9ce53312b0181c95c08aac74c85e730f6db54bc  Adafruit_Fingerprint.h
5b6982cf65d8682bcdeb8b8fea57cf6e7d546e492f5858287fd2019af454ca46  Adafruit_Fingerprint.cpp
baa00ccc5fb704158020551d05dfe17a3284bda577a6e60d1e637204febce30e  library.properties
4b6bb6d827e9da638841bf575c6068b83aaaf0d9508e892d3ea27e2525b070e8  LICENSE
```

To update, pin a new upstream release, verify its license and API, replace the
vendor files, update these hashes and run the host and AVR extension tests.
