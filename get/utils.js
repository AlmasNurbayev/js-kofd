const fs = require('fs/promises');
const { resolve } = require('path');

async function writeLog(name, data) {
  await fs.appendFile(resolve(__dirname, 'logs', name), JSON.stringify(data) + '\n');
}

async function writeError(error, point) {
  await writeLog('errors.txt', {
    date: new Date(),
    text: error,
    point: point,
  });
}

exports.writeError = writeError;
exports.writeLog = writeLog;
