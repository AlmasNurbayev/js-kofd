const { writeError, writeLog, readLog, logger } = require('../logs/logs-utils.js');
const { load } = require('../get/load.js');
const { getQuery } = require('../get/api.js');
const adminId = '590285714';

async function isAdmin(userId) {
    logger.info('userId: ' + userId + ' check isAdmin');
    let isadmin = false;
    try {
      const res = await getQuery('select id FROM "public".telegram_users');
      const listAdmin = res.rows;
      listAdmin.forEach(element => {
        if (element.id === String(userId)) { 
          isadmin = true;
        }
      });
    } catch (err) {
      writeError(err.stack, 'bot / utils - query isAdmin');
    }
    logger.info('userId: ' + userId + ' result checking isAdmin: ' + isadmin);
    return isadmin;
  }
  
  async function alarmAdmin(ctx, message) {
    if (await isAdmin(ctx.from.id) === false) {
      ctx.telegram.sendMessage(adminId, message);
      logger.info(message);  
    };
  }

  async function uploadToTelegram(chatID, path, name) {
    const fs = require('fs');
    const axios = require('axios');
    const FormData = require('form-data');
    
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', chatID);
    try {
    formData.append('document', fs.createReadStream(path), name);
    }
    catch (err) {
        await writeError(JSON.stringify(err.stack), 'uploadToTelegram - read');
    };
    //console.log(formData);
    try {
    await axios.post(url, formData, {
        headers: formData.getHeaders(),
    })
    }
    catch (err) {
      await writeError(JSON.stringify(err.stack), 'uploadToTelegram - post');
    }
  }

  async function ReplyData(mode, ctx) {

    alarmAdmin(ctx,'bot/utils - receive /mode/ ' + mode + ' command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
    if (await isAdmin(ctx.from.id) === false) {
      ctx.reply('Вы не входите в разрешенные пользователи, обратитесь к администратору');
      return;
    };
  
    await ctx.reply('формируются данные по запросу ... ');
    let message = 'произошла ошибка или сервер не ответил в отведенное время - попробуйте позже';
    console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
    let date = new Date().toLocaleString("ru-RU");
    writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
    try {
      //ctx.reply("не рано ли?");
      //if (ctx.message.text == 'последний день') {
      logger.info('bot/utils - starting /load/ with mode: ' + mode);  
      await load(mode).then(res => {
        logger.info('bot/utils - ending /load/ with mode: ' + mode);  
        message = `Сумма продаж за "${mode}" = ${res.dateStart.slice(0, 10)} - ${res.dateEnd.slice(0, 10)}
  Чистое поступление: <b>${res.sumAll.toLocaleString('ru-RU')}</b>`;
  
        if (res.sumAll != 0 || res.cashEject != 0) {
          message += `
          кеш: ${res.sumAllCash.toLocaleString('ru-RU')}
          карта: ${res.sumAllCard.toLocaleString('ru-RU')}
          смешано: ${res.sumAllMixed.toLocaleString('ru-RU')}
          В т.ч.:
          Продажи: ${res.sumSale.toLocaleString('ru-RU')}
          Возвраты: ${res.sumReturn.toLocaleString('ru-RU')} 
          Выемка: ${res.cashEject.toLocaleString('ru-RU')} 
          
          Данные по кассам:`;
          res.obj.forEach((element) => {
            if (element.sumSale != 0 || element.cashEject != 0) {
              message += `
   - ${element.name_kassa} поступило: <b>${element.sumAll.toLocaleString('ru-RU')}</b>               
      в т.ч. продажи ${element.sumSale.toLocaleString('ru-RU')}, возвраты ${element.sumReturn.toLocaleString('ru-RU')}, выемка ${element.cashEject.toLocaleString('ru-RU')}`;
              if (element.shiftClosed && mode.includes('день')) {
                message += `. Смена закрыта.
                `;
              } else if (!element.shiftClosed && mode.includes('день')) {
                message += `. Смена открыта.
                `;
              };
            };
          })
        };
        let date2 = new Date().toLocaleString("ru-RU");
        writeLog(`bot_request.txt`, String(date2 + ': SUCCESS request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
      })
        .catch(err => {
          let date2 = new Date().toLocaleString("ru-RU");
          writeError(err.stack, 'bot/utils - load');
          writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
        });
    }
    //}
    catch (err) {
      let date2 = new Date().toLocaleString("ru-RU");
      writeError(err.stack, 'bot/utils - load');
      writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
    }
    ctx.replyWithHTML(message);
  }
  



  exports.alarmAdmin = alarmAdmin;
  exports.isAdmin = isAdmin;
  exports.uploadToTelegram = uploadToTelegram;
  exports.ReplyData = ReplyData;