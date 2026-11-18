const fingerprint = formatMessage => ({
    name: formatMessage({id: 'fingerprint.name', default: 'Fingerprint'}),
    extensionId: 'fingerprint',
    version: '1.0.0',
    supportDevice: ['arduinoUno', 'arduinoNano', 'arduinoLeonardo'],
    author: 'DoGoBlock',
    iconURL: 'assets/fingerprint.svg',
    description: formatMessage({
        id: 'fingerprint.description',
        default: 'Enroll and recognize fingerprints with an AS608/R307 UART sensor.'
    }),
    featured: true,
    blocks: 'blocks.js',
    generator: 'generator.js',
    toolbox: 'toolbox.js',
    translations: 'translations.js',
    library: 'lib',
    official: true,
    tags: ['sensor'],
    helpLink: 'https://learn.adafruit.com/adafruit-optical-fingerprint-sensor'
});

module.exports = fingerprint;
