"use strict";

const { Telegraf } = require('telegraf');
const { agent } = require('./agent/agent.js');
// const { Markup } = require('telegraf');
const { command } = require('./bot/command.js');
// const { buildMessage } = require('./bot/utils.js');
const { hears, actions_oper, actions_check } = require('./bot/hears.js');
// const amqplib = require('amqplib');
//const { actions } = require('./bot/actions.js');

const dotenv = require("dotenv");
const { getQuery } = require('./get/api');
const { logger, clearDirectory } = require('./logs/logs-utils.js');
dotenv.config();

// async function listenRM(queue, bot) {
//   try {
//     const connection = await amqplib.connect(`amqp://${process.env.RMUSER}:${process.env.RMPASSWORD}@rabbitmq`);
//     const channel = await connection.createChannel()
//     console.log('create connection to RMQ');

//     await channel.assertQueue(queue)

//     channel.consume(queue, data => {
//       let data2 = JSON.parse(data.content);
//       console.log(`Получено сообщение от кролика для: ${data2.user}`);
//       logger.info('index - get message from rabbitMQ ' + JSON.stringify(data.content).slice(0,100));
//       if (data2.message === 'new_transactions') {
//           let message = buildMessage(data2.payload).then(res => {
//             //console.log(message);
//             bot.telegram.sendMessage(Number(data2.user), res[0],Markup.inlineKeyboard(res[1]));
//             channel.ack(data);
//           });
//       }
//     })
//   } catch (error) {
//     await writeError(error.stack);
//     console.log(error);
//     setTimeout(listenRM, 5000);
//   }
// }


//process.env.TZ = 'Asia/Almaty';

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

bot.launch();
console.log('starting bot');
logger.info('starting bot');

(async () => {
  const agentTimer = setInterval(() => {
    agent(bot);
    // чистим папку с диаграммами
    clearDirectory('logs/charts');
    // чистим токены созданные более 1 часа назад
    const clean_old_token = `DELETE FROM token WHERE created_at < NOW() - INTERVAL '1 hour';`;
    getQuery(clean_old_token);
  }, 180000);
  // await listenRM('transactions', bot);
})();


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

exports.bot = bot;