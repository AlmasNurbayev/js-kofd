const fs = require('fs');
const { resolve } = require('path');

function writeLog(name, data) {
  fs.appendFileSync(resolve(__dirname, 'logs', name), JSON.stringify(data)+'\n');
}

function writeError(error, point) {
  writeLog('errors.txt', {
    date: new Date(),
    text: error,
    point: point,
  });
}

exports.writeError = writeError;
exports.writeLog = writeLog;
