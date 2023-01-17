"use strict";

const fs = require('fs/promises');
const pino = require('pino');
const logger = pino({
  timestamp: () => `,"time":"${new Date().toLocaleString("ru-RU")}"`,
  base: undefined,
  transport: {
    targets: [
      {
        level: 'info',
        target: 'pino/file',
        options: { destination: 'logs/log_p.txt', append: true }
      },
      {
        level: 'error',
        target: 'pino/file',
        options: { destination: 'logs/error_p.txt', append: true }
      },
    ]
  }
});
//const logger_l = pino(transport_l);



// write string  to text file
// input name - name of file, 
// input data - text of record, 
// input append - write to end of old file or writing new file
// return promise
async function writeLog(name, data, append = true, jsoned = true) {

  if (jsoned) {
    data = JSON.stringify(data);
  } else {
    data = String(data);
  }

  if (append) {
    await fs.appendFile('logs/' + name, data + '\n');
  } else {
    fs.writeFile('logs/' + name, data);
  }
}

// write string error to text file
// input error - text of error, 
// input point - description - place about function
// return promise
async function writeError(error, point) {
  logger.error(point + " | " + error);
  // await writeLog('errors.txt', {
  //   date: new Date(),
  //   text: error.slice(0, 300),
  //   point: point,
  // });
}

// reading text file
// input name - name of file, 
// input countRow - count of last rows
// return string - last rows in text file
async function readLog(name, countRow) {
    logger.info('logs-utils-readlog - starting: ' + name);
  if (!await isFileExist('logs/' + name)) {
    console.log('not found file: ' + 'logs/' + name);
    writeError('not found file: ' + 'logs/' + name, 'readLog');
    return '';
  }

  try {
    const res = await fs.readFile('logs/' + name);
    logger.info('logs-utils-readlog - end: ' + name);
    return res.toString().split('\n').slice(-countRow).join('\n');
  } catch (err) {
    // write error log
    writeError(err.stack, 'logs-utils-readLog');
  }
}

(async () => {
  //console.log(await readLog('bot_request.txt', 10));
})();

// check exist of file
// input name - name-path of file, 
// return true or false
async function isFileExist(name) {
  //console.log(name);
  
  const constants = require('fs');
  try {
    await fs.access(name, constants.R_OK);
    return true;
  } catch (error) {
    // write error твой
    writeError(error.stack, 'logs-utils - is file exist');
    return false;
  }
}

// delete all files in directory
// input path - target directory, 
// no return

async function clearDirectory(path) {
  logger.info('logs-utils-readlog - starting clearDirectory: ' + path);
  for (const file of await fs.readdir(path)) {
    try {
      await fs.unlink(path + '/'+ file);
      logger.info('logs-utils-readlog - clearDirectory file ' + path + '/'+ file);
    }
    catch (err) {
      writeError(err.stack, 'logs-utils - clearDirectory');
    }
  }
  
}

exports.writeError = writeError;
exports.writeLog = writeLog;
exports.readLog = readLog;
exports.logger = logger;
exports.clearDirectory = clearDirectory;