"use strict";

const { Telegraf, Markup } = require('telegraf');
const { load } = require('./get/load.js');
const { uploadToTelegram, getQuery } = require('./get/api.js');

const dotenv = require("dotenv");
const { writeError, writeLog, readLog, logger } = require('./logs/logs-utils.js');
dotenv.config();
const adminId = '590285714';

const bot = new Telegraf(process.env.BOT_TOKEN);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

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
    writeError(err.stack, 'index - query isAdmin');
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

bot.start((ctx) => {
  logger.info('index - bot start new user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  return ctx.reply('Добро пожаловать! Это бот для просмотра статистики касс. Нажмите кнопку меню для доступа к командам...');
});

bot.command('menu', async (ctx) => {
  logger.info('markup building');
  return await ctx.reply('Выберите период продаж', Markup
    .keyboard([[
      Markup.button.callback("текущий день", "1"),
      Markup.button.callback("прошлый день", "2")],
    [Markup.button.callback("текущая неделя", "2"),
    Markup.button.callback("прошлая неделя", "2")],
    [Markup.button.callback("текущий месяц", "2"),
    Markup.button.callback("прошлый месяц", "1")],
    [Markup.button.callback("текущий квартал", "2"),
    Markup.button.callback("прошлый квартал", "2")],
      //[Markup.button.callback("текущий год", "2"),
      //Markup.button.callback("прошлый год", "2")]
    ])
    .oneTime()
    .resize()
  )
})

bot.command('hide_menu', async (ctx) => {
  await ctx.reply('меню скрыто',
    {
      reply_markup: {
        remove_keyboard: true,
      },
    });
});

bot.command('about', async (ctx) => {
  ctx.reply(`Данный бот разработан Алмасом с целью онлайн отображения информации о суммах продажах/возвратах в сети магазинов Cipo.
  Сервис выступает и как пет-проект и с практической целью.
  Выводится информация:
  - о продажах/возвратах за заданный период времени, используются предустановленные периоды. Источник данных - ОФД Jusan Mobile.  
  - состоянии смен в текущий день
  - служебные данные - лог-файл, файл ошибок в усеченном или полном виде, лог запросов.
  
  Используемый стек:
  - node js с модулями - axios (get и post запросы к ОФД jusan Mobile), telegraf (интерфейс бота), pg (обращения к Postgres), moment (даты), pino (логи).
  - репозиторий - https://github.com/AlmasNurbayev/js-kofd
  `);
});


let mode;

bot.hears(/Query|query/, async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  alarmAdmin(ctx, 'index - receive /query/ command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  
  ctx.reply('читаем файл bot_request.txt и возвращаем последние 15 записей ...');
  let message = 'произошла ошибка - попробуйте позже';

  try {
    logger.info('index - receive /query/ command starting from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
    message = await readLog('bot_request.txt', 15);
    ctx.reply(message);
    logger.info('index - receive /query/ command ending from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  }
  catch (err) {
    writeError(err.stack, 'bot.hears - query');
  }
});

bot.hears(/full log|Full log/, async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  alarmAdmin(ctx, 'index - receive /full log/ command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  
  ctx.reply('отправляем файл log_p ...');
  let message = 'произошла ошибка - попробуйте позже';

  try {
    logger.info('index - receive /full log/ command starting from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
    await uploadToTelegram(ctx.from.id, 'logs/log_p.txt', 'log_p.txt');
    logger.info('index - receive /full log/ command ending from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  }
  catch (err) {
    writeError(err.stack, 'bot.hears - full log');
  }
});

bot.hears(/full error|Full error/, async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  alarmAdmin(ctx, 'index - receive /full error/ command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  
  ctx.reply('отправляем файл error_p ...');
  let message = 'произошла ошибка - попробуйте позже';
  logger.info('index - receive /full error/ command starting from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  

  try {
    await uploadToTelegram(ctx.from.id, 'logs/error_p.txt', 'error_p.txt');
    logger.info('index - receive /full error/ command ending from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  }
  catch (err) {
    writeError(err.stack, 'bot.hears - full error');
  }
});

bot.hears(/Error|error/, async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  alarmAdmin(ctx, 'index - receive /error/ command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  
  ctx.reply('читаем файл error_p.txt и возвращаем последние 2000 символов ...');
  let message = 'произошла ошибка - попробуйте позже';

  try {
    logger.info('index - receive /error/ command starting from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
    message = await readLog('error_p.txt', 100);
    ctx.reply(message.slice(-2000));
    logger.info('index - receive /error/ command ending from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  }
  catch (err) {
    writeError(err.stack, 'bot.hears - error');
  }
  
});

bot.hears(/Log|log/, async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  alarmAdmin(ctx, 'index - receive /log/ command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  
  ctx.reply('читаем файл log_p.txt и возвращаем последние 2000 символов ...');
  let message = 'произошла ошибка - попробуйте позже';

  try {
    logger.info('index - receive /log/ command starting from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
    message = await readLog('log_p.txt', 20);
    ctx.reply(message.slice(-2000));
    logger.info('index - receive /log/ command ending from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  }
  catch (err) {
    writeError(err.stack, 'bot.hears - log');
  }
  
});


bot.hears('текущий день', async (ctx) => {
  mode = 'текущий день';
  await ReplyData(mode, ctx);
});

bot.hears('текущая неделя', async (ctx) => {
  mode = 'текущая неделя';
  await ReplyData(mode, ctx);
});

bot.hears('текущий месяц', async (ctx) => {
  mode = 'текущий месяц';
  await ReplyData(mode, ctx);
});

bot.hears('текущий квартал', async (ctx) => {
  mode = 'текущий квартал';
  await ReplyData(mode, ctx);
});

bot.hears('текущий год', async (ctx) => {
  mode = 'текущий год';
  await ReplyData(mode, ctx);
});

bot.hears('прошлый день', async (ctx) => {
  mode = 'прошлый день';
  await ReplyData(mode, ctx);
});

bot.hears('прошлая неделя', async (ctx) => {
  mode = 'прошлая неделя';
  await ReplyData(mode, ctx);
});

bot.hears('прошлый месяц', async (ctx) => {
  mode = 'прошлый месяц';
  await ReplyData(mode, ctx);
});

bot.hears('прошлый квартал', async (ctx) => {
  mode = 'прошлый квартал';
  await ReplyData(mode, ctx);
});

bot.hears('прошлый год', async (ctx) => {
  mode = 'прошлый год';
  await ReplyData(mode, ctx);
});

async function ReplyData(mode, ctx) {

  alarmAdmin(ctx,'index - receive /mode/ ' + mode + ' command by not-admin user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
  if (await isAdmin(ctx.from.id) === false) {
    ctx.reply('Вы не входите в разрешенные пользователи, обратитесь к администратору');
    return;
  };

  await ctx.reply('формируются данные по запросу ... ');
  let message = 'произошла ошибка - попробуйте позже';
  console.log('receive request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': receive request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  try {
    //ctx.reply("не рано ли?");
    //if (ctx.message.text == 'последний день') {
    logger.info('index - starting /load/ with mode: ' + mode);  
    await load(mode).then(res => {
      logger.info('index - ending /load/ with mode: ' + mode);  
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
        writeError(err.stack, 'bot.hears - load');
        writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
      });
  }
  //}
  catch {
    let date2 = new Date().toLocaleString("ru-RU");
    writeError(err.stack, 'bot.hears - load');
    writeLog(`bot_request.txt`, String(date2 + ': ERROR request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  }
  ctx.replyWithHTML(message);
}


bot.command('quit', async (ctx) => {
  logger.info('leave chat');
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id);

  // Using context shortcut
  await ctx.leaveChat();
});

bot.on('text', async (ctx) => {
  // Explicit usage

  await ctx.telegram.sendMessage(ctx.message.chat.id, `Команда не распознана`);

  // Using context shortcut
  //await ctx.reply(`Hello ${ctx.state.role}`);
});



bot.launch();
logger.info('starting bot');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
