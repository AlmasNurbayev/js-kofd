const fs = require('fs');
const { resolve } = require('path');

function writeLog(name, data) {
  console.log('-----------------');
  console.log(name);
  console.log(data);
  console.log('-----------------');

  fs.writeFileSync(resolve(__dirname, './logs', name), JSON.stringify(data), () => {});
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
