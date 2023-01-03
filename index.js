"use strict";

const { Telegraf, Markup } = require('telegraf');
const { load } = require('./get/load.js');

const dotenv = require("dotenv");
const { writeError, writeLog, readLog } = require('./logs/logs-utils.js');
dotenv.config();
const adminId = '590285714';

const bot = new Telegraf(process.env.BOT_TOKEN);


function isAdmin(userId) {
  if (String(userId) === adminId) {return true}  
  else {return false}
}

bot.start((ctx) => {
  //console.log('Id пользователя:', ctx.from.id);
  return ctx.reply('Добро пожаловать! Это бот для просмотра статистики касс');
});

bot.command('menu', async (ctx) => {
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
      // ['button 1', 'button 2'], // Row1 with 2 buttons
      // ['button 3', 'button 4'], // Row2 with 2 buttons
      // ['button 5', 'button 6', 'button 7'] // Row3 with 3 buttons
    ])
    .oneTime()
    .resize()
  )
})

bot.command('hide_menu', async (ctx) => {
  // await ctx.editMessageReplyMarkup({
  //   reply_markup: { remove_keyboard: true },
  //   });
  await ctx.reply("меню скрыто",
    {
      reply_markup: {
        remove_keyboard: true,
      },
    });
});

let mode;

bot.hears('log', async (ctx) => {
  //mode = 'текущий день';
  //ReplyData(mode, ctx);
  if (isAdmin(ctx.from.id) === false) {
    ctx.telegram.sendMessage(adminId, 'Получен запрос в бот Cipo ' + mode + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
};
  
  ctx.reply('читаем файл bot_request.txt и возвращаем последние 15 записей ...');
  let message = 'произошла ошибка - попробуйте позже';

  try {
    message = await readLog('bot_request.txt', 15);
  }
  catch {
    writeError(err.stack, 'bot.hears - log');
  }
  ctx.reply(message);
});

bot.hears('текущий день', async (ctx) => {
  mode = 'текущий день';
  ReplyData(mode, ctx);
});

bot.hears('текущая неделя', async (ctx) => {
  mode = 'текущая неделя';
  ReplyData(mode, ctx);
});

bot.hears('текущий месяц', async (ctx) => {
  mode = 'текущий месяц';
  ReplyData(mode, ctx);
});

bot.hears('текущий квартал', async (ctx) => {
  mode = 'текущий квартал';
  ReplyData(mode, ctx);
});

bot.hears('текущий год', async (ctx) => {
  mode = 'текущий год';
  ReplyData(mode, ctx);
});

bot.hears('прошлый день', async (ctx) => {
  mode = 'прошлый день';
  ReplyData(mode, ctx);
});

bot.hears('прошлая неделя', async (ctx) => {
  mode = 'прошлая неделя';
  ReplyData(mode, ctx);
});

bot.hears('прошлый месяц', async (ctx) => {
  mode = 'прошлый месяц';
  ReplyData(mode, ctx);
});

bot.hears('прошлый квартал', async (ctx) => {
  mode = 'прошлый квартал';
  ReplyData(mode, ctx);
});

bot.hears('прошлый год', async (ctx) => {
  mode = 'прошлый год';
  ReplyData(mode, ctx);
});

async function ReplyData(mode, ctx) {

  if (isAdmin(ctx.from.id) === false) {
    ctx.telegram.sendMessage(adminId, 'Получен запрос в бот Cipo ' + mode + ' / ' + ctx.from.id + ' / ' + ctx.from.username);
};

  await ctx.reply('формируются данные по запросу ... ');
  let message = 'произошла ошибка - попробуйте позже';
  console.log('recieve request: ' + mode + " от пользователя " + ctx.from.id);
  let date = new Date().toLocaleString("ru-RU");
  writeLog(`bot_request.txt`, String(date + ': recieve request: <' + mode + "> от пользователя " + ctx.from.id + " / " + ctx.from.username));
  try {
    //ctx.reply("не рано ли?");
    //if (ctx.message.text == 'последний день') {
    await load(mode).then(res => {
      message = `Сумма продаж за "${mode}" = ${res.dateStart.slice(0, 10)} - ${res.dateEnd.slice(0, 10)}
Чистое поступление: ${res.sumAll.toLocaleString('ru-RU')}`;

      if (res.sumAll > 0) {
        message += `
        кеш: ${res.sumAllCash.toLocaleString('ru-RU')}
        карта: ${res.sumAllCard.toLocaleString('ru-RU')}
        смешано: ${res.sumAllMixed.toLocaleString('ru-RU')}
        В т.ч.:
        Продажи: ${res.sumSale.toLocaleString('ru-RU')}
        Возвраты: ${res.sumReturn.toLocaleString('ru-RU')} 
        
        Данные по кассам:`;
        res.obj.forEach((element) => {
          if (element.sumSale != 0) {
            message += `
 - ${element.name_kassa} поступило: ${element.sumAll.toLocaleString('ru-RU')}               
    в т.ч. продажи ${element.sumSale.toLocaleString('ru-RU')}, возвраты ${element.sumReturn.toLocaleString('ru-RU')} 
            `;
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
  ctx.reply(message);
}


bot.command('quit', async (ctx) => {
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

bot.on('callback_query', async (ctx) => {
  // Explicit usage

  //}

  await ctx.telegram.answerCbQuery(ctx.callbackQuery.id);

  // Using context shortcut
  await ctx.answerCbQuery();
});

bot.on('inline_query', async (ctx) => {
  const result = [];
  // Explicit usage
  await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result);

  // Using context shortcut
  await ctx.answerInlineQuery(result);
});


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));