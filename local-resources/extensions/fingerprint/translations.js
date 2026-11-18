/* eslint-disable func-style */
/* eslint-disable require-jsdoc */
function getInterfaceTranslations () {
    return {
        'en': {
            'fingerprint.name': 'Fingerprint',
            'fingerprint.description': 'Enroll and recognize fingerprints with an AS608/R307 UART sensor.'
        },
        'pt-br': {
            'fingerprint.name': 'Leitor de digitais',
            'fingerprint.description': 'Cadastre e reconheça digitais com um sensor UART AS608/R307.'
        }
    };
}

function registerScratchExtensionTranslations () {
    return {};
}

function registerBlocksMessages (Blockly) {
    const english = {
        FINGERPRINT_CATEGORY: 'Fingerprint',
        FINGERPRINT_INIT: 'init fingerprint RX %1 TX %2 baud %3',
        FINGERPRINT_VERIFY_PASSWORD: 'fingerprint verify sensor password',
        FINGERPRINT_CAPTURE_IMAGE: 'fingerprint capture image',
        FINGERPRINT_IMAGE_TO_TEMPLATE: 'fingerprint convert image to buffer %1',
        FINGERPRINT_CREATE_MODEL: 'fingerprint create model from buffers 1 and 2',
        FINGERPRINT_STORE_MODEL: 'fingerprint store model at ID %1',
        FINGERPRINT_SEARCH: 'fingerprint capture and search',
        FINGERPRINT_DELETE_MODEL: 'fingerprint delete model at ID %1',
        FINGERPRINT_REFRESH_TEMPLATE_COUNT: 'fingerprint refresh stored count',
        FINGERPRINT_LAST_STATUS: 'fingerprint last status',
        FINGERPRINT_FINGER_ID: 'fingerprint matched ID',
        FINGERPRINT_CONFIDENCE: 'fingerprint match confidence',
        FINGERPRINT_TEMPLATE_COUNT: 'fingerprint stored count',
        FINGERPRINT_SUCCEEDED: 'fingerprint last operation succeeded?',
        FINGERPRINT_STATUS_CONSTANT: 'fingerprint status %1',
        FINGERPRINT_INIT_TOOLTIP: 'Upload mode only. Board RX connects to sensor TX, board TX to sensor RX. ' +
            'Defaults: RX 10, TX 11, 57600 baud. The baud rate must match the sensor. Use distinct pins. ' +
            'On Leonardo, RX requires a pin-change-interrupt pin.',
        FINGERPRINT_OPERATION_TOOLTIP: 'Sends one sensor command. Check last status or last operation succeeded ' +
            'before the next enrollment or search step. No finger is a normal capture result.',
        FINGERPRINT_DELETE_TOOLTIP: 'Permanently deletes only the specified sensor model. Valid IDs start at 1 ' +
            'and must be below sensor capacity. Check the last status afterward.',
        FINGERPRINT_CACHED_TOOLTIP: 'Reads the result of the last command without communicating with the sensor. ' +
            'Matched ID and confidence are 0 when no match is available.',
        FINGERPRINT_COUNT_TOOLTIP: 'Reads the cached stored count without communicating with the sensor. ' +
            '-1 means unknown; run refresh stored count to update it.',
        FINGERPRINT_STATUS_TOOLTIP: 'A status constant to compare with last status. Does not send a sensor command.',
        FINGERPRINT_STATUS_OK: 'success',
        FINGERPRINT_STATUS_NO_FINGER: 'no finger',
        FINGERPRINT_STATUS_NOT_FOUND: 'no match found',
        FINGERPRINT_STATUS_COMMUNICATION_ERROR: 'communication error',
        FINGERPRINT_STATUS_IMAGE_FAIL: 'capture error',
        FINGERPRINT_STATUS_IMAGE_MESS: 'image too messy',
        FINGERPRINT_STATUS_FEATURE_FAIL: 'insufficient features',
        FINGERPRINT_STATUS_INVALID_IMAGE: 'invalid image',
        FINGERPRINT_STATUS_ENROLL_MISMATCH: 'enrollment images do not match',
        FINGERPRINT_STATUS_BAD_LOCATION: 'invalid ID',
        FINGERPRINT_STATUS_INVALID_RANGE: 'ID out of range',
        FINGERPRINT_STATUS_DELETE_FAIL: 'delete failed',
        FINGERPRINT_STATUS_FLASH_ERROR: 'sensor storage error',
        FINGERPRINT_STATUS_PASSWORD_FAIL: 'incorrect password',
        FINGERPRINT_STATUS_TIMEOUT: 'sensor timeout'
    };
    const portuguese = {
        FINGERPRINT_CATEGORY: 'Leitor de digitais',
        FINGERPRINT_INIT: 'iniciar impressão digital RX %1 TX %2 velocidade %3',
        FINGERPRINT_VERIFY_PASSWORD: 'impressão digital verificar senha do sensor',
        FINGERPRINT_CAPTURE_IMAGE: 'impressão digital capturar imagem',
        FINGERPRINT_IMAGE_TO_TEMPLATE: 'impressão digital converter imagem para buffer %1',
        FINGERPRINT_CREATE_MODEL: 'impressão digital criar modelo dos buffers 1 e 2',
        FINGERPRINT_STORE_MODEL: 'impressão digital salvar modelo no ID %1',
        FINGERPRINT_SEARCH: 'impressão digital capturar e buscar',
        FINGERPRINT_DELETE_MODEL: 'impressão digital excluir modelo do ID %1',
        FINGERPRINT_REFRESH_TEMPLATE_COUNT: 'impressão digital atualizar quantidade salva',
        FINGERPRINT_LAST_STATUS: 'impressão digital último estado',
        FINGERPRINT_FINGER_ID: 'impressão digital ID encontrado',
        FINGERPRINT_CONFIDENCE: 'impressão digital confiança da comparação',
        FINGERPRINT_TEMPLATE_COUNT: 'impressão digital quantidade salva',
        FINGERPRINT_SUCCEEDED: 'impressão digital última operação teve sucesso?',
        FINGERPRINT_STATUS_CONSTANT: 'impressão digital estado %1',
        FINGERPRINT_INIT_TOOLTIP: 'Somente no modo de envio. RX da placa liga ao TX do sensor e TX ao RX. ' +
            'Padrão: RX 10, TX 11 e 57600 baud. A velocidade deve ser igual à do sensor. Use pinos diferentes. ' +
            'No Leonardo, RX exige um pino com interrupção por mudança.',
        FINGERPRINT_OPERATION_TOOLTIP: 'Envia um comando ao sensor. Confira o último estado ou o sucesso da operação ' +
            'antes da próxima etapa de cadastro ou busca. Sem dedo é um resultado normal da captura.',
        FINGERPRINT_DELETE_TOOLTIP: 'Exclui permanentemente apenas o modelo do ID indicado. IDs válidos começam em 1 ' +
            'e devem ser menores que a capacidade do sensor. Confira o último estado depois.',
        FINGERPRINT_CACHED_TOOLTIP: 'Lê o resultado do último comando sem comunicar com o sensor. ' +
            'ID encontrado e confiança são 0 quando não há uma correspondência.',
        FINGERPRINT_COUNT_TOOLTIP: 'Lê a quantidade salva em cache sem comunicar com o sensor. ' +
            '-1 significa desconhecida; use atualizar quantidade salva para atualizá-la.',
        FINGERPRINT_STATUS_TOOLTIP: 'Uma constante para comparar com o último estado. Não envia comandos ao sensor.',
        FINGERPRINT_STATUS_OK: 'sucesso',
        FINGERPRINT_STATUS_NO_FINGER: 'sem dedo',
        FINGERPRINT_STATUS_NOT_FOUND: 'digital não encontrada',
        FINGERPRINT_STATUS_COMMUNICATION_ERROR: 'erro de comunicação',
        FINGERPRINT_STATUS_IMAGE_FAIL: 'erro de captura',
        FINGERPRINT_STATUS_IMAGE_MESS: 'imagem com ruído',
        FINGERPRINT_STATUS_FEATURE_FAIL: 'características insuficientes',
        FINGERPRINT_STATUS_INVALID_IMAGE: 'imagem inválida',
        FINGERPRINT_STATUS_ENROLL_MISMATCH: 'imagens do cadastro diferentes',
        FINGERPRINT_STATUS_BAD_LOCATION: 'ID inválido',
        FINGERPRINT_STATUS_INVALID_RANGE: 'ID fora do intervalo',
        FINGERPRINT_STATUS_DELETE_FAIL: 'falha ao excluir',
        FINGERPRINT_STATUS_FLASH_ERROR: 'erro de memória do sensor',
        FINGERPRINT_STATUS_PASSWORD_FAIL: 'senha incorreta',
        FINGERPRINT_STATUS_TIMEOUT: 'tempo limite do sensor'
    };

    // Populate every installed locale so changing editor language keeps the extension usable.
    Object.keys(Blockly.ScratchMsgs.locales).forEach(locale => {
        Object.assign(Blockly.ScratchMsgs.locales[locale], english,
            locale.toLowerCase().indexOf('pt') === 0 ? portuguese : {});
    });
    Blockly.ScratchMsgs.locales.en = Object.assign({}, Blockly.ScratchMsgs.locales.en, english);
    Blockly.ScratchMsgs.locales['pt-br'] = Object.assign({}, Blockly.ScratchMsgs.locales['pt-br'], english, portuguese);
    return Blockly;
}

if (typeof module !== 'undefined') {
    module.exports = {getInterfaceTranslations};
}
exports = registerScratchExtensionTranslations;
exports = registerBlocksMessages;
