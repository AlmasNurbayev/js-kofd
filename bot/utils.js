const { writeError, writeLog, logger } = require('../logs/logs-utils.js');
const { load } = require('../get/load.js');
const { getQuery } = require('../get/api.js');
const adminId = '590285714';
const ChartJsImage = require('chartjs-to-image');
const fs = require("fs");
const moment = require('moment');
const { Markup } = require('telegraf');
const { getStringFilter } = require('../get/api.js');

// return true if userid contains in db table telegram_users
// userid - id of telegram user
async function isAdmin(userId) {
  //logger.info('userId: ' + userId + ' check isAdmin');
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
async function makeChart(res, chat_id, ctx, mode) {

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
        if (mode.includes('d')) {
          element2.date = element2.operationDate.split('T')[0];
        } else if (mode.includes('m')) {
          element2.date = element2.operationDate.slice(0,7);
        }
        if (element2.type == 1 && element2.subType == 3) {
          element2.sum = element2.sum * -1;
        }
      }));
      resAll = resAll.concat(kassa_array); // соединяем массивы касс в один
      //console.table(resAll);
    });
    

    let data2 = groupAndSum(resAll, ['date', 'name_kassa'], ['sum']);

    let dateStart = moment(getStringFilter(mode)[1]);
    let dateEnd = moment(getStringFilter(mode)[2]);
    // console.log(mode);
    // console.log(dateStart, dateEnd);
    if (mode.includes('d')) {
      let dif_days = dateEnd.diff(dateStart, 'days');
      for (let x = 0; x <= dif_days; x++) {
         let some_day = dateStart.add(1, 'd').toISOString().split('T')[0];
         data2.push({
          date: some_day,
          sum: 0
        });         
      };
    } else if (mode.includes('m')) {
      let dif_month = dateEnd.diff(dateStart, 'month');
      for (let x = 0; x <= dif_month; x++) {
         let some_month = dateStart.add(1, 'M').toISOString().slice(0,7);
         data2.push({
          date: some_month,
          sum: 0
        });         
      };      
    }

    let data3 = groupAndSum(data2, ['date'], ['sum']);

    data3.sort(function (a, b) {
      var dateA = new Date(a.date), dateB = new Date(b.date)
      return dateB - dateA //сортировка по убывающей дате
    })
    data3.forEach(element => { // добавление дня недели
      if (mode.includes('d')) {
      moment.locale('ru');
      element.date = element.date + ' (' + moment(element.date).format('ddd') + ')';
      }
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
          skipNull: false,
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
          layout: { //https://www.chartjs.org/docs/2.9.4/configuration/layout.html
            padding: {
                left: 0,
                right: 50,
                top: 0,
                bottom: 0
            }
          },
          scales: {
            xAxes: [{
              display: false,
            }]
          },
          indexAxis: 'y',
          plugins: {
            datalabels: { // https://chartjs-plugin-datalabels.netlify.app/guide/#table-of-contents
              anchor: 'end',
              align: 'end',
              clamp: false,
              offset: 5,
              formatter: function (value) {
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
  //console.log(count);

  alarmAdmin(ctx, 'bot/utils - receive /mode/ ' + mode + ' command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  if (await isAdmin(ctx.from.id) === false) {
    ctx.reply('Вы не входите в разрешенные пользователи, обратитесь к администратору');
    return;
  }

  await ctx.sendChatAction("typing",ctx.from.id);
  //await ctx.reply('формируются данные по запросу ... ');

  console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));

  try {
    logger.info('bot/utils - starting /ReplyChart/ with mode: ' + mode);
    await load(mode).then(res => {
      logger.info('bot/utils - ending /ReplyChart/ with mode: ' + mode);
      //const img = makeChart(res['rows']);
      res = res['rows'];
      makeChart(res, chat_id, ctx, mode);
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
  await ctx.sendChatAction("typing",ctx.from.id);
  //await ctx.reply('формируются данные по запросу ... ');
  let message = 'произошла ошибка или сервер не ответил в отведенное время - попробуйте позже';
  console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  try {
    //ctx.reply("не рано ли?");
    //if (ctx.message.text == 'последний день') {
    let bot_message;
    let resAll = await load(mode)
      logger.info('bot/utils - ending /ReplyData/ with mode: ' + mode);
      //console.log(JSON.stringify(res['rows']));
     let res = resAll['table'];

      message = `Сумма продаж за "${mode}" = ${res.dateStart.slice(0, 10)} - ${res.dateEnd.slice(0, 10)}
  Чистое поступление: <b>${res.sumAll.toLocaleString('ru-RU')}</b>`;

      //if (res.sumAll != 0 || res.cashEject != 0) {
        message += `
          кеш: ${res.sumAllCash.toLocaleString('ru-RU')}, карта: ${res.sumAllCard.toLocaleString('ru-RU')}, смешано: ${res.sumAllMixed.toLocaleString('ru-RU')}
          В т.ч.:
          Продажи: ${res.sumSale.toLocaleString('ru-RU')}, возвраты: ${res.sumReturn.toLocaleString('ru-RU')}, выемка: ${res.cashEject.toLocaleString('ru-RU')}`; 
          
          message += `

  Итоги по кассам:`;
        res.obj.forEach((element) => {
          if (element.sumAll != 0 || element.cashEject != 0 || element.availableSum != 0) {
            message += `
   - ${element.name_kassa} поступило: <b>${element.sumAll.toLocaleString('ru-RU')}</b>               
      в т.ч. продажи ${element.sumSale.toLocaleString('ru-RU')}, возвраты ${element.sumReturn.toLocaleString('ru-RU')}, выемка ${element.cashEject.toLocaleString('ru-RU')}. `;
            // message += `
            // В кассе ${element.availableSum.toLocaleString('ru-RU')}`;

            if (element.shiftClosed && mode.includes('день')) {
              message += `. Смена закрыта.
                `;
            } else if (!element.shiftClosed && mode.includes('день')) {
              message += `. Смена открыта.
                `;
            }
          }
        });
      //} else {
        message += `

  Остатки по активным кассам:`;
        let queryAllKassa = `select organization.bin, organization.name_org, kassa.*  FROM "public".organization
  join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
        if (String(mode).includes('день')) { 
          queryAllKassa += ' where kassa.active = true';
        }
        const dataKassa = await getQuery(queryAllKassa);
        const listKassa = dataKassa.rows;
        for await (const element of listKassa) {
          const queryElement = `select * from transaction
          where id_kassa = ${element.id}
          order by id desc 
          limit 1;`;
          const listTransaction = await getQuery(queryElement);
          const lastTransaction = listTransaction.rows[0];
          message += `
    - ${element.name_kassa} - ${Number(lastTransaction.availablesum).toLocaleString('ru-RU')}`;
        }
      //}
      let date2 = new Date().toLocaleString("ru-RU");
      writeLog(`bot_request.txt`, String(date2 + ': SUCCESS request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));

      if (mode.includes('день')) {
      bot_message = await ctx.replyWithHTML(message, Markup.inlineKeyboard([
        Markup.button.callback("🔍все операции", "operations-" + res.dateStart.slice(0, 10))])//-" + res.dateStart)]),
      );} else {
        bot_message = await ctx.replyWithHTML(message);
      }

      resAll.bot_message_id = bot_message.message_id;
      return resAll;

    
  }
  //}
  catch (err) {
    ctx.replyWithHTML('произошла ошибка или сервер не ответил в отведенное время - попробуйте позже');
    let date2 = new Date().toLocaleString("ru-RU");
    writeError(err.stack, 'bot/utils - ReplyData');
    writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  }

}

function parseResRaws(rows) {
  //logger.info('bot-utiles - parseResRaws starting');
  
  const list = [];
  if (rows.length == 0) {
    return list;
  }
  
  rows.forEach((element) => {
    
      let elementTypeOper, elementSum;
      if (element.type_operation == 1 && element.subtype == 3) {
        elementTypeOper = 'возврат';
        elementSum = -1 * element.sum_operation;
      }
      if (element.type_operation == 1 && element.subtype == 2) {
        elementTypeOper = 'продажа';
        elementSum = element.sum_operation;
      }
      if (element.type_operation == 2) {
        elementTypeOper = 'Закрытие смены (Z)';
        elementSum = 0;
      }
      if (element.type_operation == 6 && element.subtype == 1) {
        elementTypeOper = 'выемка';
        elementSum = element.sum_operation;
      }
      if (element.type_operation == 3 && element.subtype >= 1) {
        elementTypeOper = 'X-отчет';
        elementSum = 0;
      }
      let elementTypePay;
      //if (typeof (element.paymenttypes) == 'object') {
        if (element.paymenttypes === '0,1') {
          elementTypePay = 'смешанно';
        } else if (element.paymenttypes === '0') {
          elementTypePay = 'кеш';
        } else if (element.paymenttypes[0] === '1') {
          elementTypePay = 'карта';
        } else {
          elementTypePay = '';
        }
      //}
      // console.log(String(element.operationDate).slice(0,10));
      // console.log(controlDate);
      //if (String(element.operationDate).slice(0,10) == controlDate) { // сверка даты операции и переданной даты
        list.push({
          //elementToken: kassa.token,
          elementKnumber: element.knumber,
          elementKassa: element.name_kassa,
          elementTypeOper: elementTypeOper,
          elementSum: elementSum,
          elementTypePay: elementTypePay,
          elementId: element.id,
          elementTime: element.operationdate.toLocaleString("ru-RU").slice(12, 17),
          elementFullTime: element.operationdate,
          check: element.cheque,
          names: element.names,
        });
      //}
    })
  //logger.info('bot-utiles - parseResRaws ending');
  return list;
}

async function  buildMessage(payload) {
  let message = `Агент мониторинга: новые транзакции: + ${payload.length} шт.:\n`;
  let buttons = [];
  const arrKassa = await getQuery('select * from kassa');

  if (payload) {
    //console.log(arrKassa);
    payload.forEach((element) => {
      const name_kassa = arrKassa.rows.find(e => e.knumber === element.knumber);
      element.name_kassa = name_kassa.name_kassa;
    });
    const list = parseResRaws(payload);
    //console.log('list', list);
    if (list.length > 0) {
      list.sort((x, y) => x.elementTime.localeCompare(y.elementTime));
  }
      list.forEach((e, index) => {
      //e.elementTime = e.elementFullTime.slice(11,16); // в функции ParseResRaws время возвращается со смещением, непонятно почему. Поэтому парсим время заново.
      //console.log(e.elementFullTime);
      const dateInButton = e.elementFullTime.slice(6,10) + '-' + e.elementFullTime.slice(3,5) + '-' + e.elementFullTime.slice(0,2);
      //console.log(dateInButton);
      message += `${index}. ${e.elementKassa} ${e.elementTypeOper} ${e.elementSum.toLocaleString('ru-RU')} ${e.elementTypePay} ${e.elementTime}\n ${e.names}\n`;
      buttons.push(Markup.button.callback(String(index), "check-" + index + "-" + dateInButton  + "-"  + e.elementId + "-" + e.elementKnumber));
  })

    // const name_operation = ? 
    // newTrans += `${index} ${name_kassa.name_kassa} ${element.type_operation} ${element.sum_operation} ${element.names}\n`;


  }

  return [message, buttons];

}

exports.buildMessage = buildMessage;
exports.alarmAdmin = alarmAdmin;
exports.isAdmin = isAdmin;
exports.uploadToTelegram = uploadToTelegram;
exports.ReplyData = ReplyData;
exports.ReplyChart = ReplyChart;
exports.parseResRaws = parseResRaws;
