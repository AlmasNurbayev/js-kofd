const { buildMessage } = require('../bot/utils.js');
const { Markup } = require('telegraf');
const { getQuery } = require('../get/api');
const { load } = require('../get/load.js');
const { loggerAgent } = require('../logs/logs-utils');
//const { writeError } = require('../logs/logs-utils.js');
const moment = require('moment');

//const amqplib = require('amqplib');

/// run this to cron as agent/agent.js periodically event hour

async function startLoad() {
  try {
    await load('текущий день');
    loggerAgent.info('agent - ending startLoad');
  } catch (error) {
    await loggerAgent.error('agent load' + error.stack);
    console.log(error.stack);
    //throw new Error(error);
  }
}

async function checkNew(bot) {
  try {
    loggerAgent.info('agent - starting check');
    // получаем список пользователей
    let arrUsers = await getQuery('select * from telegram_users');

    //получаем из БД транзакции именно продаж за 10 дней (если долго не было продаж или запусков агента)
    const currentDay = moment()
      .add(-10, 'd')
      .startOf('day')
      .format('YYYY-MM-DD[T]HH:mm:ss');
    let sql_today = `
    select * from transaction
    where 
    operationdate > '${currentDay}'
    and (type_operation = 1 OR type_operation = 2 OR type_operation = 3 OR type_operation = 6)
    order by id desc;`;
    let arrTodayTrans = await getQuery(sql_today);

    //сравниваем список транзакций с позицией курсора
    for (let user of arrUsers.rows) {
      let arrNewTrans = [];
      if (user.transaction_cursor.length > 5) {
        // console.log('id: ' + user.id + '. Валидный курсор: ' + user.transaction_cursor);
        for (let [index, transaction] of arrTodayTrans.rows.entries()) {
          transaction.operationdate =
            transaction.operationdate.toLocaleString('ru-RU');
          arrNewTrans.push(transaction);
          //console.log(transaction.operationdate.getTimezoneOffset());
          if (user.transaction_cursor === transaction.id) {
            arrNewTrans.pop();
            //console.log('курсор найден на позиции: ' + index);
            if (index !== 0) {
              loggerAgent.info('new sales are available for ' + user.username);
              // // отправляем на кролика
              // const queue = 'transactions';
              // const conn = await amqplib.connect(`amqp://${process.env.RMUSER}:${process.env.RMPASSWORD}@localhost`);
              // const ch2 = await conn.createChannel();
              // await ch2.assertQueue(queue);
              // await ch2.sendToQueue(queue, Buffer.from(JSON.stringify(
              //   {
              //     user: String(user.id),
              //     message: "new_transactions",
              //     payload: arrNewTrans,
              //     count: index
              //   }
              // )));
              // await ch2.close();
              // await conn.close();

              const message = await buildMessage(arrNewTrans);
              bot.telegram.sendMessage(
                Number(user.id),
                message[0],
                Markup.inlineKeyboard(message[1])
              );

              // смещаем курсор
              let sql_upd = `UPDATE telegram_users SET transaction_cursor = '${arrTodayTrans.rows[0].id}' WHERE id = '${user.id}';`;
              await getQuery(sql_upd);
            }
            break;
          }
        }
      }
      //console.log(arrNewTrans);
    }
    loggerAgent.info('agent - ending check');
  } catch (error) {
    await loggerAgent.error('agent checkNew ' + error.stack);
    console.log(error.stack);
    //throw new Error(error);
  }
}

async function agent(bot) {
  //console.log('======== ' + new Date().toLocaleString("ru-RU"));
  await startLoad();
  await checkNew(bot);
}

exports.agent = agent;
