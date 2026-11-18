#include "DoGoFingerprint.h"

DoGoFingerprint::DoGoFingerprint(uint8_t rxPin, uint8_t txPin)
    : _serial(rxPin, txPin), _sensor(&_serial),
      _status(FINGERPRINT_PASSFAIL), _serialStarted(false), _ready(false),
      _imageReady(false), _buffer1Ready(false), _buffer2Ready(false),
      _modelReady(false), _capacity(0), _fingerID(0), _confidence(0),
      _templateCount(-1) {}

uint8_t DoGoFingerprint::begin(uint32_t baud) {
    _ready = false;
    _serialStarted = false;
    _capacity = 0;
    _templateCount = -1;
    clearEnrollment();
    clearMatch();
    if (baud == 0) return _status = FINGERPRINT_INVALIDREG;

    _sensor.begin(baud);
    _serialStarted = true;
    return verifyPassword();
}

uint8_t DoGoFingerprint::verifyPassword() {
    _ready = false;
    _capacity = 0;
    _templateCount = -1;
    clearEnrollment();
    clearMatch();
    if (!_serialStarted) return _status = FINGERPRINT_PASSFAIL;

    // Adafruit exposes only a boolean for password verification.
    if (!_sensor.verifyPassword()) return _status = FINGERPRINT_PASSFAIL;
    _status = _sensor.getParameters();
    if (_status != FINGERPRINT_OK) return _status;
    if (_sensor.capacity < 2) return _status = FINGERPRINT_BADLOCATION;

    _capacity = _sensor.capacity;
    _ready = true;
    return _status;
}

bool DoGoFingerprint::requireReady() {
    if (_ready) return true;
    _status = FINGERPRINT_PASSFAIL;
    return false;
}

bool DoGoFingerprint::validId(double id) const {
    return id >= 1 && id < _capacity && id == static_cast<uint16_t>(id);
}

void DoGoFingerprint::clearEnrollment() {
    _imageReady = false;
    _buffer1Ready = false;
    _buffer2Ready = false;
    _modelReady = false;
}

void DoGoFingerprint::clearMatch() {
    _fingerID = 0;
    _confidence = 0;
}

uint8_t DoGoFingerprint::captureImage() {
    _imageReady = false;
    _buffer2Ready = false;
    _modelReady = false;
    if (!requireReady()) return _status;
    _status = _sensor.getImage();
    _imageReady = _status == FINGERPRINT_OK;
    // Keep the first sample while the user removes and replaces the finger.
    return _status;
}

uint8_t DoGoFingerprint::image2Tz(uint8_t slot) {
    const bool freshImage = _imageReady;
    _imageReady = false;
    _modelReady = false;
    _buffer2Ready = false;
    if (slot == 1) _buffer1Ready = false;
    if (!requireReady()) return _status;
    if (slot != 1 && slot != 2) return _status = FINGERPRINT_BADLOCATION;
    if (!freshImage || (slot == 2 && !_buffer1Ready)) {
        return _status = FINGERPRINT_INVALIDIMAGE;
    }

    _status = _sensor.image2Tz(slot);
    if (_status == FINGERPRINT_OK) {
        if (slot == 1) _buffer1Ready = true;
        else _buffer2Ready = true;
    }
    return _status;
}

uint8_t DoGoFingerprint::createModel() {
    _modelReady = false;
    if (!requireReady()) return _status;
    if (!_buffer1Ready || !_buffer2Ready) {
        return _status = FINGERPRINT_ENROLLMISMATCH;
    }
    _status = _sensor.createModel();
    if (_status == FINGERPRINT_OK) _modelReady = true;
    else clearEnrollment();
    return _status;
}

uint8_t DoGoFingerprint::storeModel(double id) {
    const bool freshModel = _modelReady;
    clearEnrollment();
    if (!requireReady()) return _status;
    if (!validId(id)) return _status = FINGERPRINT_BADLOCATION;
    if (!freshModel) return _status = FINGERPRINT_DBRANGEFAIL;

    _templateCount = -1;
    _status = _sensor.storeModel(static_cast<uint16_t>(id));
    if (_status == FINGERPRINT_OK) updateTemplateCount();
    return _status;
}

uint8_t DoGoFingerprint::search() {
    clearMatch();
    clearEnrollment();
    if (!requireReady()) return _status;
    _status = _sensor.getImage();
    if (_status != FINGERPRINT_OK) return _status;
    _status = _sensor.image2Tz(1);
    if (_status != FINGERPRINT_OK) return _status;
    _status = _sensor.fingerSearch(1);
    if (_status == FINGERPRINT_OK) {
        _fingerID = _sensor.fingerID;
        _confidence = _sensor.confidence;
    }
    return _status;
}

uint8_t DoGoFingerprint::deleteModel(double id) {
    clearEnrollment();
    clearMatch();
    if (!requireReady()) return _status;
    if (!validId(id)) return _status = FINGERPRINT_BADLOCATION;

    _templateCount = -1;
    _status = _sensor.deleteModel(static_cast<uint16_t>(id));
    if (_status == FINGERPRINT_OK) updateTemplateCount();
    return _status;
}

void DoGoFingerprint::updateTemplateCount() {
    if (_sensor.getTemplateCount() == FINGERPRINT_OK) {
        _templateCount = _sensor.templateCount;
    }
}

uint8_t DoGoFingerprint::refreshTemplateCount() {
    _templateCount = -1;
    if (!requireReady()) return _status;
    _status = _sensor.getTemplateCount();
    if (_status == FINGERPRINT_OK) _templateCount = _sensor.templateCount;
    return _status;
}
