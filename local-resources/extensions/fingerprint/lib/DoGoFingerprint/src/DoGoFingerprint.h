#ifndef DOGOBLOCK_FINGERPRINT_H
#define DOGOBLOCK_FINGERPRINT_H

#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

class DoGoFingerprint {
public:
    DoGoFingerprint(uint8_t rxPin, uint8_t txPin);

    uint8_t begin(uint32_t baud);
    uint8_t verifyPassword();
    uint8_t captureImage();
    uint8_t image2Tz(uint8_t slot);
    uint8_t createModel();
    uint8_t storeModel(double id);
    uint8_t search();
    uint8_t deleteModel(double id);
    uint8_t refreshTemplateCount();

    uint8_t status() const { return _status; }
    uint16_t fingerID() const { return _fingerID; }
    uint16_t confidence() const { return _confidence; }
    // -1 means that the sensor has not confirmed the current count.
    long templateCount() const { return _templateCount; }
    bool succeeded() const { return _status == FINGERPRINT_OK; }

private:
    DoGoFingerprint(const DoGoFingerprint&) = delete;
    DoGoFingerprint& operator=(const DoGoFingerprint&) = delete;

    bool requireReady();
    bool validId(double id) const;
    void clearEnrollment();
    void clearMatch();
    void updateTemplateCount();

    SoftwareSerial _serial;
    Adafruit_Fingerprint _sensor;
    uint8_t _status;
    bool _serialStarted;
    bool _ready;
    bool _imageReady;
    bool _buffer1Ready;
    bool _buffer2Ready;
    bool _modelReady;
    uint16_t _capacity;
    uint16_t _fingerID;
    uint16_t _confidence;
    long _templateCount;
};

#endif
