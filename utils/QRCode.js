const path = require('path');

const QRCode = require('qrcode');

module.exports = {
    generate: async (filepath, data) => {
        return new Promise((resolve, reject) => {
            QRCode.toFile(
                filepath,
                [{ data: data, mode: 'byte' }],
                () => {
                    resolve(true);
                }
            );
        });
    }
};