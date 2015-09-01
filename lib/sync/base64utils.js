var fs = require('fs');

function readBase64Encoded(file) {
    return new Buffer(fs.readFileSync(file)).toString('base64');
}

function writeFromBase64Encoded(base64str, file) {
    fs.writeFileSync(file, new Buffer(base64str, 'base64'));
}

module.exports = {
    readBase64Encoded:readBase64Encoded,
    writeFromBase64Encoded:writeFromBase64Encoded
}
