/* eslint-disable func-style */
/* eslint-disable require-jsdoc */
function registerToolboxs () {
    return `
<category name="%{BKY_FINGERPRINT_CATEGORY}" id="FINGERPRINT_CATEGORY" colour="#0F8B8D" secondaryColour="#0B6B6D">
    <block type="fingerprint_init">
        <field name="RX">10</field>
        <field name="TX">11</field>
        <field name="BAUD">57600</field>
    </block>
    <block type="fingerprint_verifyPassword"></block>
    <sep gap="24"></sep>
    <block type="fingerprint_captureImage"></block>
    <block type="fingerprint_image2Tz"><field name="BUFFER">1</field></block>
    <block type="fingerprint_createModel"></block>
    <block type="fingerprint_storeModel">
        <value name="ID"><shadow type="math_whole_number"><field name="NUM">1</field></shadow></value>
    </block>
    <block type="fingerprint_search"></block>
    <block type="fingerprint_deleteModel">
        <value name="ID"><shadow type="math_whole_number"><field name="NUM">1</field></shadow></value>
    </block>
    <block type="fingerprint_refreshTemplateCount"></block>
    <sep gap="24"></sep>
    <block type="fingerprint_lastStatus"></block>
    <block type="fingerprint_lastOperationSucceeded"></block>
    <block type="fingerprint_fingerID"></block>
    <block type="fingerprint_confidence"></block>
    <block type="fingerprint_templateCount"></block>
    <block type="fingerprint_statusConstant"><field name="STATUS">FINGERPRINT_OK</field></block>
</category>`;
}

exports = registerToolboxs;
