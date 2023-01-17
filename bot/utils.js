const { writeError, writeLog, logger } = require('../logs/logs-utils.js');
const { load } = require('../get/load.js');
const { getQuery } = require('../get/api.js');
const adminId = '590285714';
const ChartJsImage = require('chartjs-to-image');
const fs = require("fs");
const moment = require('moment');

// return true if userid contains in db table telegram_users
// userid - id of telegram user
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

// send message to admin if user is NOT contains in db table telegram_users
// message - string of message
// ctx - object of chat
// no return
async function alarmAdmin(ctx, message) {
  if (await isAdmin(ctx.from.id) === false) {
    ctx.telegram.sendMessage(adminId, message);
    logger.info(message);
  }
}

// upload local file to telegram chat with namde document.txt
// chat_id - id of sended chat
// path - string, local path to sended file
// no return
async function uploadToTelegram(chatID, path) {
  logger.info('bot/utils - starting /upload/: ' + path);
  const fs = require('fs');
  const axios = require('axios');
  const FormData = require('form-data');

  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', chatID);
  try {
    formData.append('document', fs.createReadStream(path), 'document.txt');
  }
  catch (err) {
    await writeError(JSON.stringify(err.stack), 'bot/utils - uploadToTelegram - read');
  }
  try {
    await axios.post(url, formData, {
      headers: formData.getHeaders(),
    })
    logger.info('bot/utils - ending /upload/: ' + path);
  }
  catch (err) {
    await writeError(JSON.stringify(err.stack), 'bot/utils - uploadToTelegram - post');
  }
}

// render chart and send image to chat
// res - array with data of transactions
// chat_id - id of sended chat
// ctx - object of chat
// no return
async function makeChart(res, chat_id, ctx) {

  logger.info('bot/utils - starting /makeChart/ to ' + chat_id);
  // подготовка массивов к группировке
  if (res.length > 0) { //добавляем имя кассы в каждую строку
    let resAll = [];
    res.forEach((element) => { // цикл касс
      let kassa_array = element.data;
      kassa_array = kassa_array.filter((e) => {
        return e.type == 1;
      });
      kassa_array = kassa_array.filter((e) => {
        return e.subType == 2 || e.subType == 3;
      });
      kassa_array.forEach((element2 => { // цикл операций
        element2.name_kassa = element.name_kassa;
        element2.date = element2.operationDate.split('T')[0];
        if (element2.type == 1 && element2.subType == 3) {
          element2.sum = element2.sum * -1;
        }
      }));
      resAll = resAll.concat(kassa_array); // соединяем массивы касс в один
      //console.table(resAll);
    });
    let data2 = groupAndSum(resAll, ['date', 'name_kassa'], ['sum']);
    let data3 = groupAndSum(data2, ['date'], ['sum']);

    data3.sort(function (a, b) {
      var dateA = new Date(a.date), dateB = new Date(b.date)
      return dateB - dateA //сортировка по убывающей дате
    })
    data3.forEach(element => {
      moment.locale('ru');
      element.date = element.date + ' (' + moment(element.date).format('ddd') + ')';
    });

    const data3_labels = data3.map(item => item.date);
    const data3_data = data3.map(item => item.sum);
    //console.log(data3_data);

    const chart = new ChartJsImage(); // using QuickChart/Chart.js
    //let chart = new chart(
    const data = {
      labels: data3_labels,
      datasets: [
        {
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
          label: 'чистые продажи всех касс, тенге',
          data: data3_data
        }
      ]
    };
    //chart.version = '4';
    chart.setConfig(
      {
        type: 'horizontalBar',
        data,
        options: {
          scales: {
            xAxes: [{
              display: false
            }]
          },
          indexAxis: 'y',
          plugins: {
            datalabels: {
              anchor: 'end',
              align: 'start',
              clamp: true,
              formatter: function(value) {
                return value.toLocaleString('ru-RU');
              }
            }
          }
        }
      });


    chart.setWidth(450).setHeight(350);
    
    let namefile = 'temp_chart' + String(new Date().getTime()).trim() + '.png';
    let namedir = 'logs/charts/';
    await chart.toFile(namedir + namefile);
    try {
      logger.info('bot/utils - sending chart ' + namedir + namefile + ' to ' + chat_id);
      await ctx.replyWithPhoto({ source: fs.readFileSync(namedir + namefile) });
    }
    catch (err) {
      writeError(err.stack, 'bot/utils - MakeChart sending chart');
    }
  }
}

// return array with grouping and summary data in objects
// groupKeys - array of grouping keys
// sumKeys - array of summary keys
function groupAndSum(arr, groupKeys, sumKeys) {
  return Object.values(
    arr.reduce((acc, curr) => {
      const group = groupKeys.map(k => curr[k]).join('-');
      acc[group] = acc[group] || Object.fromEntries(
        groupKeys.map(k => [k, curr[k]]).concat(sumKeys.map(k => [k, 0])));
      sumKeys.forEach(k => acc[group][k] += curr[k]);
      return acc;
    }, {})
  );
}

// load transactions of period and send data to render charts, finally send image of chart to user
// mode - string of period, for example 'chart-10'
// chat_id - id of sended chat
// ctx - object of chat
// no return
async function ReplyChart(mode, ctx, chat_id) {

  let count = +mode.slice(6);
  console.log(count);

  alarmAdmin(ctx, 'bot/utils - receive /mode/ ' + mode + ' command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  if (await isAdmin(ctx.from.id) === false) {
    ctx.reply('Вы не входите в разрешенные пользователи, обратитесь к администратору');
    return;
  }

  await ctx.reply('формируются данные по запросу ... ');

  console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));

  try {
    logger.info('bot/utils - starting /ReplyChart/ with mode: ' + mode);
    await load(mode).then(res => {
      logger.info('bot/utils - ending /ReplyChart/ with mode: ' + mode);
      //const img = makeChart(res['rows']);
      res = res['rows'];
      makeChart(res, chat_id, ctx);
      //console.log(JSON.stringify(res));
      let date2 = new Date().toLocaleString("ru-RU");
      writeLog(`bot_request.txt`, String(date2 + ': SUCCESS request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
    })
  }
  catch (err) {
    let date2 = new Date().toLocaleString("ru-RU");
    writeError(err.stack, 'bot/utils - ReplyChart');
    writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  }
}

// load transactions of period and send summary statistic to user
// mode - string of period, for example 'текущий день'
// ctx - object of chat
// no return

async function ReplyData(mode, ctx) {
  logger.info('bot/utils - starting /ReplyData/ with mode: ' + mode);
  alarmAdmin(ctx, 'bot/utils - receive /mode/ ' + mode + ' command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  if (await isAdmin(ctx.from.id) === false) {
    ctx.reply('Вы не входите в разрешенные пользователи, обратитесь к администратору');
    return;
  }

  await ctx.reply('формируются данные по запросу ... ');
  let message = 'произошла ошибка или сервер не ответил в отведенное время - попробуйте позже';
  console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  try {
    //ctx.reply("не рано ли?");
    //if (ctx.message.text == 'последний день') {
    await load(mode).then(res => {
      logger.info('bot/utils - ending /ReplyData/ with mode: ' + mode);
      //const img = makeChart(res['rows']);
      res = res['table'];
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
          if (element.sumAll != 0 || element.cashEject != 0) {
            message += `
   - ${element.name_kassa} поступило: <b>${element.sumAll.toLocaleString('ru-RU')}</b>               
      в т.ч. продажи ${element.sumSale.toLocaleString('ru-RU')}, возвраты ${element.sumReturn.toLocaleString('ru-RU')}, выемка ${element.cashEject.toLocaleString('ru-RU')}`;
            if (element.shiftClosed && mode.includes('день')) {
              message += `. Смена закрыта.
                `;
            } else if (!element.shiftClosed && mode.includes('день')) {
              message += `. Смена открыта.
                `;
            }
          }
        });
      }
      let date2 = new Date().toLocaleString("ru-RU");
      writeLog(`bot_request.txt`, String(date2 + ': SUCCESS request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
    });
   }
  //}
  catch (err) {
    let date2 = new Date().toLocaleString("ru-RU");
    writeError(err.stack, 'bot/utils - ReplyData');
    writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  }
  ctx.replyWithHTML(message);
}

exports.alarmAdmin = alarmAdmin;
exports.isAdmin = isAdmin;
exports.uploadToTelegram = uploadToTelegram;
exports.ReplyData = ReplyData;
exports.ReplyChart = ReplyChart;