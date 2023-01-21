const e = require('express');
const { writeError, readLog, logger } = require('../logs/logs-utils.js');
const { alarmAdmin, uploadToTelegram, ReplyData, ReplyChart, parseResRaws } = require('./utils.js');

let resAll;


// monitoring all push button or commands from user, and doing nead tasks 
// mode - string, select hear command or markup button
// bot - object of bot
// no return
function hears(mode, bot) {
    let emptyMessage = 'произошла ошибка - попробуйте позже';
    //console.log(Markup);
    if (mode == 'query') {
        bot.hears(/Query|query/, async (ctx) => {
            let infoText = 'bot/hears - query command, receive last 15 records of bot_request.txt';
            let infoText2 = 'from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username;

            //mode = 'текущий день';
            //ReplyData(mode, ctx);
            alarmAdmin(ctx, 'not admin: ' + infoText + ' ' + infoText2);
            ctx.reply(infoText);
            try {
                logger.info(infoText + ' starting ' + infoText2);
                emptyMessage = await readLog('bot_request.txt', 15);
                ctx.reply(emptyMessage);
                logger.info(infoText + ' ending ' + infoText2);
            }
            catch (err) {
                writeError(err.stack, infoText);
            }
        });
    }

    if (mode == 'full log') {
        bot.hears(/full log|Full log/, async (ctx) => {
            let infoText = 'bot/hears - full log command, receive log_p.txt';
            let infoText2 = 'from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username;
            alarmAdmin(ctx, 'not admin: ' + infoText + ' ' + infoText2);
            ctx.reply(infoText);
            try {
                logger.info(infoText + ' starting ' + infoText2);
                await uploadToTelegram(ctx.from.id, 'logs/log_p.txt');
                logger.info(infoText + ' ending ' + infoText2);
            }
            catch (err) {
                writeError(err.stack, infoText);
            }
        });
    }

    if (mode == 'full error') {
        bot.hears(/full error|Full error/, async (ctx) => {
            let infoText = 'bot/hears - full error command, receive error_p.txt';
            let infoText2 = 'from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username;
            alarmAdmin(ctx, 'not admin: ' + infoText + ' ' + infoText2);
            ctx.reply(infoText);
            try {
                logger.info(infoText + ' starting ' + infoText2);
                await uploadToTelegram(ctx.from.id, 'logs/error_p.txt');
                logger.info(infoText + ' ending ' + infoText2);
            }
            catch (err) {
                writeError(err.stack, infoText);
            }
        });
    }
    if (mode == 'error') {
        bot.hears(/Error|error/, async (ctx) => {
            let infoText = 'bot/hears - /error/ command, receive last 2000 symbols of error_p.txt ';
            let infoText2 = 'from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username;
            alarmAdmin(ctx, 'not admin: ' + infoText + ' ' + infoText2);
            ctx.reply(infoText);
            try {
                logger.info(infoText + ' starting ' + infoText2);
                let message = await readLog('error_p.txt', 100);
                ctx.reply(message.slice(-2000));
                logger.info(infoText + ' ending ' + infoText2);
            }
            catch (err) {
                writeError(err.stack, infoText);
            }
        });
    }
    if (mode == 'log') {
        bot.hears(/Log|log/, async (ctx) => {
            let infoText = 'bot/hears - /log/ command, receive last 2000 symbols of log_p.txt ';
            let infoText2 = 'from user: ' + ' / ' + ctx.from.id + ' / ' + ctx.from.username;
            alarmAdmin(ctx, 'not admin: ' + infoText + ' ' + infoText2);
            ctx.reply(infoText);
            try {
                logger.info(infoText + ' starting ' + infoText2);
                let message = await readLog('log_p.txt', 100);
                ctx.reply(message.slice(-2000));
                logger.info(infoText + ' ending ' + infoText2);
            }
            catch (err) {
                writeError(err.stack, infoText);
            }
        });
    }
    if (mode == 'datemode') { // hears markup buttons of summary statistics of periods
        
        bot.hears('текущий день', async (ctx) => {
            resAll = await ReplyData('текущий день', ctx);
        });

        bot.hears('текущая неделя', async (ctx) => {
            resAll = await ReplyData('текущая неделя', ctx);
        });

        bot.hears('текущий месяц', async (ctx) => {
            resAll = await ReplyData('текущий месяц', ctx);
        });

        bot.hears('текущий квартал', async (ctx) => {
            resAll = await ReplyData('текущий квартал', ctx);
        });

        bot.hears('текущее полугодие', async (ctx) => {
            resAll = await ReplyData('текущее полугодие', ctx);
        });

        bot.hears('текущий год', async (ctx) => {
            resAll = await ReplyData('текущий год', ctx);
        });

        bot.hears('прошлый день', async (ctx) => {
            resAll = await ReplyData('прошлый день', ctx);
        });

        bot.hears('прошлая неделя', async (ctx) => {
            resAll = await ReplyData('прошлая неделя', ctx);
        });

        bot.hears('прошлый месяц', async (ctx) => {
            resAll = await ReplyData('прошлый месяц', ctx);
        });

        bot.hears('прошлый квартал', async (ctx) => {
            resAll = await ReplyData('прошлый квартал', ctx);
        });

        bot.hears('прошлое полугодие', async (ctx) => {
            resAll = await ReplyData('прошлое полугодие', ctx);
        });

        bot.hears('прошлый год', async (ctx) => {
            resAll = await ReplyData('прошлый год', ctx);
        });
        
    }
    if (mode == 'chart') { // hears markup buttons of chart periods
        bot.hears('chart-10', async (ctx) => {
            await ReplyChart('chart-10', ctx, ctx.from.id);
        });
    }

    if (mode == 'скрыть меню') { 
        bot.hears('скрыть меню', async (ctx) => {
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

function actions(bot) {
    bot.action(/operations/i, (ctx) => {
        const dateInButton = ctx.match.input.slice(11);
        //console.log(dateInButton);
        logger.info('bot/hears - receive /Operations/ with mode: ' + dateInButton);
        //console.log('--- ' + dateInButton);
        let message = '';
        let list = parseResRaws(resAll.rows, dateInButton);
        list.forEach ((e, index) =>{
            message += `${index} ${e.elementKassa} ${e.elementTypeOper} ${e.elementSum.toLocaleString('ru-RU')} ${e.elementTypePay} ${e.elementTime}\n`;
        })
        ctx.reply(message);
    });
}

exports.hears = hears;
exports.actions = actions;