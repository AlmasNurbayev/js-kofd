"use strict";

const fs = require('fs/promises');
const fs2 = require('fs');
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

async function readLog(name, numberRow) {
 

  try {
    const res = await fs.readFile('logs/'+name);
    return res.toString().split('\n').slice(-numberRow).join('\n');
  } catch (err) {
    // write error log
    writeError(err.stack, 'logs-utils-readLog');
  }
}

  // return new Promise(function (resolve, reject) {
  //   fs2.readFile('logs/' + name, 'utf8', function(err, data) {
  //     if (err) {
  //       reject(err);
  //       writeError(err.stack, 'logs-utils-readLog');
  //     }
  //     else {
  //       let data3 = '';
  //       let data2 = data.split('\n');
  //       for (let i = 0; i < data2.length; i += 1) {
  //         if (i > data2.length - numberRow - 1) {
  //           //console.log(data2[i]);
  //           data3 += data2[i] + '\n';
  //         }
  //       }
  //       resolve(data3);
  //     }
  //   });
  // });


(async () => {
  console.log(await readLog('bot_request.txt', 10));
})();

exports.writeError = writeError;
exports.writeLog = writeLog;
exports.readLog = readLog;