/* eslint-disable func-style */
/* eslint-disable require-jsdoc */
function registerBlocks (Blockly) {
    const colour = '#0F8B8D';
    const secondaryColour = '#0B6B6D';
    const digitalPins = Blockly.Device.getPinOptions('arduino_pin_setDigitalOutput');
    const isLeonardo = (Blockly.Device.getDeviceId() || '').split('_').pop() === 'arduinoLeonardo';
    const rxPins = isLeonardo ? digitalPins.filter(pin =>
        ['8', '9', '10', '11', '14', '15', '16'].indexOf(pin[1]) !== -1) : digitalPins;

    const defineBlock = (opcode, message, args, shape, tooltip, defaults) => {
        Blockly.Blocks[`fingerprint_${opcode}`] = {
            init: function () {
                this.jsonInit({
                    message0: Blockly.Msg[message],
                    args0: args || [],
                    colour,
                    colourSecondary: secondaryColour,
                    extensions: [shape || 'shape_statement']
                });
                Object.keys(defaults || {}).forEach(name => this.setFieldValue(defaults[name], name));
                this.setTooltip(Blockly.Msg[tooltip || 'FINGERPRINT_OPERATION_TOOLTIP']);
            }
        };
    };
    const numberInput = name => ({type: 'input_value', name, check: 'Number'});
    const dropdown = (name, options) => ({type: 'field_dropdown', name, options});

    defineBlock('init', 'FINGERPRINT_INIT', [
        dropdown('RX', rxPins),
        dropdown('TX', digitalPins),
        dropdown('BAUD', ['9600', '19200', '28800', '38400', '57600', '115200'].map(baud => [baud, baud]))
    ], 'shape_statement', 'FINGERPRINT_INIT_TOOLTIP', {RX: '10', TX: '11', BAUD: '57600'});
    defineBlock('verifyPassword', 'FINGERPRINT_VERIFY_PASSWORD');
    defineBlock('captureImage', 'FINGERPRINT_CAPTURE_IMAGE');
    defineBlock('image2Tz', 'FINGERPRINT_IMAGE_TO_TEMPLATE', [dropdown('BUFFER', [['1', '1'], ['2', '2']])]);
    defineBlock('createModel', 'FINGERPRINT_CREATE_MODEL');
    defineBlock('storeModel', 'FINGERPRINT_STORE_MODEL', [numberInput('ID')]);
    defineBlock('search', 'FINGERPRINT_SEARCH');
    defineBlock('deleteModel', 'FINGERPRINT_DELETE_MODEL', [numberInput('ID')],
        'shape_statement', 'FINGERPRINT_DELETE_TOOLTIP');
    defineBlock('refreshTemplateCount', 'FINGERPRINT_REFRESH_TEMPLATE_COUNT');

    [
        ['lastStatus', 'FINGERPRINT_LAST_STATUS'],
        ['fingerID', 'FINGERPRINT_FINGER_ID'],
        ['confidence', 'FINGERPRINT_CONFIDENCE']
    ].forEach(([opcode, message]) => defineBlock(opcode, message, [], 'output_number',
        'FINGERPRINT_CACHED_TOOLTIP'));
    defineBlock('templateCount', 'FINGERPRINT_TEMPLATE_COUNT', [], 'output_number', 'FINGERPRINT_COUNT_TOOLTIP');
    defineBlock('lastOperationSucceeded', 'FINGERPRINT_SUCCEEDED', [], 'output_boolean',
        'FINGERPRINT_CACHED_TOOLTIP');

    const statusOptions = () => [
        ['FINGERPRINT_STATUS_OK', 'FINGERPRINT_OK'],
        ['FINGERPRINT_STATUS_NO_FINGER', 'FINGERPRINT_NOFINGER'],
        ['FINGERPRINT_STATUS_NOT_FOUND', 'FINGERPRINT_NOTFOUND'],
        ['FINGERPRINT_STATUS_COMMUNICATION_ERROR', 'FINGERPRINT_PACKETRECIEVEERR'],
        ['FINGERPRINT_STATUS_IMAGE_FAIL', 'FINGERPRINT_IMAGEFAIL'],
        ['FINGERPRINT_STATUS_IMAGE_MESS', 'FINGERPRINT_IMAGEMESS'],
        ['FINGERPRINT_STATUS_FEATURE_FAIL', 'FINGERPRINT_FEATUREFAIL'],
        ['FINGERPRINT_STATUS_INVALID_IMAGE', 'FINGERPRINT_INVALIDIMAGE'],
        ['FINGERPRINT_STATUS_ENROLL_MISMATCH', 'FINGERPRINT_ENROLLMISMATCH'],
        ['FINGERPRINT_STATUS_BAD_LOCATION', 'FINGERPRINT_BADLOCATION'],
        ['FINGERPRINT_STATUS_INVALID_RANGE', 'FINGERPRINT_DBRANGEFAIL'],
        ['FINGERPRINT_STATUS_DELETE_FAIL', 'FINGERPRINT_DELETEFAIL'],
        ['FINGERPRINT_STATUS_FLASH_ERROR', 'FINGERPRINT_FLASHERR'],
        ['FINGERPRINT_STATUS_PASSWORD_FAIL', 'FINGERPRINT_PASSFAIL'],
        ['FINGERPRINT_STATUS_TIMEOUT', 'FINGERPRINT_TIMEOUT']
    ].map(([message, value]) => [Blockly.Msg[message], value]);
    defineBlock('statusConstant', 'FINGERPRINT_STATUS_CONSTANT', [dropdown('STATUS', statusOptions)],
        'output_number', 'FINGERPRINT_STATUS_TOOLTIP');

    return Blockly;
}

exports = registerBlocks;
