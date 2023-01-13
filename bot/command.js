const { writeError, writeLog, readLog, logger } = require('../logs/logs-utils.js');
const { Markup } = require('telegraf');

// Doing actions of telegram bot commands
// input mode - name of command, 
// input bot - object of bot
// no return
function command(mode, bot) {
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
          });
    }

    if (mode == 'menu') {
        //const Markup = other.Markup;
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
                //[Markup.button.callback("текущий год", "2"),
                //Markup.button.callback("прошлый год", "2")]
              ])
              .oneTime()
              .resize()
            );
            
          });
    }    

    if (mode == 'hide_menu') {
        bot.command('hide_menu', async (ctx) => {
            logger.info('bot/command - markup remove');
            await ctx.reply('меню скрыто',
            {
                reply_markup: {
                remove_keyboard: true,
                },
            });
        });
    }

}


exports.command = command;