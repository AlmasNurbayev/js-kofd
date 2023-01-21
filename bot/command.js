const { writeError, logger } = require('../logs/logs-utils.js');
const { Markup } = require('telegraf');

// Doing actions of telegram bot commands
// input mode - name of command, 
// input bot - object of bot
// no return
function command(mode, bot) {
  try {
    if (mode == 'about') {
      bot.command('about', async (ctx) => {
        ctx.reply(`Данный бот разработан с целью онлайн отображения информации о суммах продажах/возвратах в сети магазинов Cipo.
            Сервис выступает и как пет-проект и с практической целью.
            Выводится информация:
            - о продажах/возвратах за заданный период времени, используются предустановленные периоды. Источник данных - ОФД Jusan Mobile.  
            - состоянии смен в текущий день
            - служебные данные - лог-файл, файл ошибок в усеченном или полном виде, лог запросов.
            
            Используемый стек:
            - node js с модулями - axios (get и post запросы к ОФД jusan Mobile), telegraf (интерфейс бота), pg (обращения к Postgres), moment (даты), pino (логи).
            - репозиторий - https://github.com/AlmasNurbayev/js-kofd
            `);
      })
    }
  } catch (err) {
    writeError(err.stack, 'bot/command.js - about');
  }


  if (mode == 'menu') {
    //const Markup = other.Markup;
    try {
      bot.command('menu', async (ctx) => {
        logger.info('bot/command - markup building');
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
          [Markup.button.callback("chart-10", "1"), Markup.button.callback("скрыть меню", "2")]
            //[Markup.button.callback("текущий год", "2"),
            //Markup.button.callback("прошлый год", "2")]
          ])
          .oneTime()
          .resize()
        );

      });
    } catch (err) {
      writeError(err.stack, 'bot/command.js - markup');
    }
  }

  if (mode == 'hide_menu') {
    try {
      bot.command('hide_menu', async (ctx) => {
        logger.info('bot/command - markup remove');
        await ctx.reply('меню скрыто',
          {
            reply_markup: {
              remove_keyboard: true,
            },
          });
      });
    } catch (err) {
      writeError(err.stack, 'bot/command.js - hide_menu');
    }
  }

}


exports.command = command;