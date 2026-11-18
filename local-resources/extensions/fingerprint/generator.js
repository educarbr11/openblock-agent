/* eslint-disable func-style */
/* eslint-disable require-jsdoc */
function registerGenerators (Blockly) {
    const generator = Blockly.Arduino;
    generator.addReservedWords('dogoblockFingerprint');

    const setupSensor = (rx, tx, baud) => {
        generator.includes_.fingerprint = '#include <DoGoFingerprint.h>';
        generator.definitions_.fingerprint = `DoGoFingerprint dogoblockFingerprint(${rx}, ${tx});`;
        generator.setups_.fingerprint = `dogoblockFingerprint.begin(${baud});`;
        return '';
    };
    const ensureSensorReady = () => {
        if (!generator.definitions_.fingerprint) setupSensor('10', '11', '57600');
    };
    const validPin = (value, fallback) => (/^\d{1,2}$/.test(value) && Number(value) <= 19 ? value : fallback);

    generator.fingerprint_init = function (block) {
        const requestedBaud = block.getFieldValue('BAUD');
        const baud = ['9600', '19200', '28800', '38400', '57600', '115200'].indexOf(requestedBaud) === -1 ?
            '57600' : requestedBaud;
        return setupSensor(validPin(block.getFieldValue('RX'), '10'), validPin(block.getFieldValue('TX'), '11'), baud);
    };

    ['verifyPassword', 'captureImage', 'createModel', 'search', 'refreshTemplateCount'].forEach(operation => {
        generator[`fingerprint_${operation}`] = function () {
            ensureSensorReady();
            return `dogoblockFingerprint.${operation}();\n`;
        };
    });

    generator.fingerprint_image2Tz = function (block) {
        const buffer = block.getFieldValue('BUFFER') === '2' ? '2' : '1';
        ensureSensorReady();
        return `dogoblockFingerprint.image2Tz(${buffer});\n`;
    };

    ['storeModel', 'deleteModel'].forEach(operation => {
        generator[`fingerprint_${operation}`] = function (block) {
            const id = generator.valueToCode(block, 'ID', generator.ORDER_NONE) || '1';
            ensureSensorReady();
            return `dogoblockFingerprint.${operation}(${id});\n`;
        };
    });

    [
        ['lastStatus', 'status'],
        ['fingerID', 'fingerID'],
        ['confidence', 'confidence'],
        ['templateCount', 'templateCount'],
        ['lastOperationSucceeded', 'succeeded']
    ].forEach(([opcode, getter]) => {
        generator[`fingerprint_${opcode}`] = function () {
            ensureSensorReady();
            return [`dogoblockFingerprint.${getter}()`, generator.ORDER_UNARY_POSTFIX];
        };
    });

    generator.fingerprint_statusConstant = function (block) {
        const allowedStatus = [
            'FINGERPRINT_OK', 'FINGERPRINT_NOFINGER', 'FINGERPRINT_NOTFOUND', 'FINGERPRINT_PACKETRECIEVEERR',
            'FINGERPRINT_IMAGEFAIL', 'FINGERPRINT_IMAGEMESS', 'FINGERPRINT_FEATUREFAIL', 'FINGERPRINT_INVALIDIMAGE',
            'FINGERPRINT_ENROLLMISMATCH', 'FINGERPRINT_BADLOCATION', 'FINGERPRINT_DELETEFAIL', 'FINGERPRINT_FLASHERR',
            'FINGERPRINT_PASSFAIL', 'FINGERPRINT_TIMEOUT', 'FINGERPRINT_DBRANGEFAIL'
        ];
        const requested = block.getFieldValue('STATUS');
        const status = allowedStatus.indexOf(requested) === -1 ? 'FINGERPRINT_OK' : requested;
        generator.includes_.fingerprint = '#include <DoGoFingerprint.h>';
        return [status, generator.ORDER_ATOMIC];
    };

    return Blockly;
}

exports = registerGenerators;
