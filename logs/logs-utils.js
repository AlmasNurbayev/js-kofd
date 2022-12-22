"use strict";

const fs = require('fs/promises');
//const { resolve } = require('path');

async function writeLog(name, data, append = true) {
  if (append) {
    await fs.appendFile('logs/'+name, JSON.stringify(data) + '\n');
  } else {
    fs.writeFile('logs/'+name, JSON.stringify(data));
  };
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