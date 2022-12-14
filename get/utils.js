const fs = require('fs');
const { resolve } = require('path');

function writeLog(name, data) {
  fs.writeFile(resolve(__dirname, './logs', name), JSON.stringify(data), () => {});
}

const errorArr = [];

function writeError(error, point) {
  errorArr.push({
    date: new Date(),
    text: String(error),
    point: point,
  });
  writeLog(`errors.txt"`, errorArr);
}

exports.writeError = writeError;
exports.writeLog = writeLog;
