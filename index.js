"use strict";

const { Telegraf } = require('telegraf');
const { command } = require('./bot/command.js');
const { hears, actions_oper, actions_check } = require('./bot/hears.js');
//const { actions } = require('./bot/actions.js');

const dotenv = require("dotenv");
const { logger, clearDirectory } = require('./logs/logs-utils.js');
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


bot.start((ctx) => {
  logger.info('index - bot start new user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username);  
  return ctx.reply('Добро пожаловать! Это бот для просмотра статистики касс. Нажмите кнопку меню для доступа к командам...');
});

command('menu', bot);
command('hide_menu', bot);
command('about', bot);

hears('query', bot);
hears('full log', bot);
hears('full error', bot);
hears('error', bot);
hears('log', bot);
hears('datemode', bot);
hears('chart', bot);
hears('скрыть меню', bot);

actions_oper(bot);
actions_check(bot);

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


(async () => {
  await clearDirectory('logs/charts');
})();





bot.launch();
logger.info('starting bot');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
