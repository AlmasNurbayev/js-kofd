"use strict";

const fs = require('fs/promises');
const fs_sync = require('fs');
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
  let data3 = '';  
  let data = fs_sync.readFileSync('logs/'+name, 'utf8') 
  // , function (err, data)  {
  //   console.log(data);  
  //   if (err) {
  //     console.log(err.stack);    
  //     writeError(err.stack, 'logs-utils-readLog');
  //   } 
    
    let data2 = data.split('\n');
    for (let i = 0; i < data2.length; i += 1) {
      // Этот код выполняется для каждого элемента

      if (i > data2.length-numberRow-1) {
          console.log(i);
          data3 += data2[i] + '\n';
      }  
    }
  return data3;
}

(async () => {
//  console.log(await readLog('bot_request.txt', 10));
})();




exports.writeError = writeError;
exports.writeLog = writeLog;
exports.readLog = readLog;