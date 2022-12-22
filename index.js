const { Telegraf, Markup } = require('telegraf');
const { load } = require('./get/load.js');

const dotenv = require("dotenv");
const { writeError } = require('./logs/logs-utils.js');
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.start((ctx) => {
  console.log('Id пользователя:', ctx.from.id);

  return ctx.reply('Добро пожаловать! Это бот для просмотра статистики касс');
});



bot.command('menu', async (ctx) => {
  return await ctx.reply('Выберите период запроса', Markup
    .keyboard([
      Markup.button.callback("последний день", "1"),
      Markup.button.callback("последняя неделя", "2")
      // ['button 1', 'button 2'], // Row1 with 2 buttons
      // ['button 3', 'button 4'], // Row2 with 2 buttons
      // ['button 5', 'button 6', 'button 7'] // Row3 with 3 buttons
    ])
    .oneTime()
    .resize()
  )
})

bot.hears('последний день', async (ctx) => {
  await ctx.reply('формируются данные по запросу ... ');
  try {
    //ctx.reply("не рано ли?");
    //if (ctx.message.text == 'последний день') {
      
      await load('последний день').then(res => {
        console.log(res);
        ctx.sendMessage(ctx.message.chat.id, JSON.stringify(res));
     })
     .catch(err => {
       ctx.reply('произошла ошибка - попробуйте позже');
       writeError(err.stack, 'bot.hears - load');
     });
    }
  //}
  catch {
    ctx.reply('произошла ошибка - попробуйте позже');
    writeError(err.stack, 'bot.hears - load');
  }
});



bot.command('quit', async (ctx) => {
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id);

  // Using context shortcut
  await ctx.leaveChat();
});

bot.on('text', async (ctx) => {
  // Explicit usage

  await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello Anelya`);

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