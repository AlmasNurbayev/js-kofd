//const e = require('express');
const { writeError, readLog, logger } = require('../logs/logs-utils.js');
const { alarmAdmin, uploadToTelegram, ReplyData, ReplyChart, parseResRaws } = require('./utils.js');
const { Markup } = require('telegraf');
const { getCheck } = require('../get/api.js');

let resAll = [];


// monitoring all push button or commands from user, and doing nead tasks 
// mode - string, select hear command or markup button
// bot - object of bot
// no return
function hears(mode, bot) {
    let emptyMessage = 'произошла ошибка - попробуйте позже';
    //console.log(Markup);
    if (mode == 'query') {
        bot.hears(/Query|query/, async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
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
            await ctx.sendChatAction("upload_document", ctx.from.id);
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
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
            await ctx.sendChatAction("upload_document", ctx.from.id);
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
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
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
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
            //Markup.removeKeyboard(true);
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            await ctx.sendChatAction("typing", ctx.from.id);

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
            await ctx.reply('меню скрыто', {reply_markup: {remove_keyboard: true,},});
            resAll = await ReplyData('текущий день', ctx);
        });

        bot.hears('текущая неделя', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('текущая неделя', ctx);
        });

        bot.hears('текущий месяц', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('текущий месяц', ctx);
        });

        bot.hears('текущий квартал', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('текущий квартал', ctx);
        });

        bot.hears('текущее полугодие', async (ctx) => {
            resAll = await ReplyData('текущее полугодие', ctx);
        });

        bot.hears('текущий год', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('текущий год', ctx);
        });

        bot.hears('прошлый день', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлый день', ctx);
        });

        bot.hears('прошлая неделя', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлая неделя', ctx);
        });

        bot.hears('прошлый месяц', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлый месяц', ctx);
        });

        bot.hears('прошлый квартал', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлый квартал', ctx);
        });

        bot.hears('прошлое полугодие', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлое полугодие', ctx);
        });

        bot.hears('прошлый год', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            resAll = await ReplyData('прошлый год', ctx);
        });

    }
    if (mode == 'chart') { // hears markup buttons of chart periods
        bot.hears('chart-10', async (ctx) => {
            await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
            await ReplyChart('chart-10', ctx, ctx.from.id);
        });
    }

    if (mode == 'скрыть меню') {
        hide_menu(bot);
    }

}

async function actions_oper(bot) {
    bot.action(/operations/i, (ctx) => {
        //ctx.reply('меню скрыто', {reply_markup: {remove_keyboard: true,},});
        const dateInButton = ctx.match.input.slice(11);
        //console.log(dateInButton);
        logger.info('bot/hears - receive /Operations/ with mode: ' + dateInButton);
        //console.log('--- ' + dateInButton);
        let message = '';
        let buttons = [];
        if (resAll.length == 0) {
            ctx.reply('для получения детальных операций, необходимо обновить статистику нужного периода');
            logger.error('bot/hears - ending /Operations/ - not data ');
            return;
        }
        //console.log(JSON.stringify(resAll));
        let list = [];
        list = parseResRaws(resAll.rows, dateInButton);
        list.forEach((e, index) => {
            //console.log(JSON.stringify(e));
            message += `${index}. ${e.elementKassa} ${e.elementTypeOper} ${e.elementSum.toLocaleString('ru-RU')} ${e.elementTypePay} ${e.elementTime}\n`;
            buttons.push(Markup.button.callback(String(index), "check-" + index + "-" + dateInButton + "-" + e.elementId + "-" + e.elementKnumber));
        })
        if (buttons.length > 0) {
            if (buttons.length > 8) {
                let subarray = []; //разбиваем массив в подмассивы по 8 кнопок
                for (let i = 0; i <Math.ceil(buttons.length/8); i++){
                    subarray[i] = buttons.slice((i*8), (i*8) + 8);
                }
                subarray.forEach ((element, index) =>{
                   if (index != 0) {
                    message = 'продолжение выбора чеков';
                   }     
                   ctx.replyWithHTML(message, Markup.inlineKeyboard(element));    
                });
            } else {
                ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons));
            }

        }
        //ctx.reply(message);
    })
}

async function actions_check(bot) {
    bot.action(/check-/i, async (ctx) => {
        //ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
        console.log(ctx.match.input);


        if (resAll.length == 0) {
            ctx.reply('для получения детальных операций, необходимо обновить статистику нужного периода');
            logger.error('bot/hears - ending /Check/ - not data resAll');
            return;
        }
        let message = '';
        const resArray = ctx.match.input.split('-');
        const index = resArray[1];
        const day = resArray[2] + resArray[3] + resArray[4];
        let res = await getDataCheck(resArray);
        if (typeof (res) == 'object') {
            message += 'чек №' + index + ' - ' + day + '\n';
            res.data.forEach((element) => {
                message += element.text + '\n';
            })
        } else {
            message = 'не удалось получить данные';
        }
        ctx.reply(message);

    });
}

async function getDataCheck(resArray) {

    const knumber = resArray[resArray.length - 1];
    const id = resArray[resArray.length - 2];
    //console.log(knumber, id);
    let token = "";
    resAll.rows.forEach((kassa) => {
        kassa.data.forEach((element) => {
            if (element.id === id) {
                token = kassa.token;
            }
        });
    });
    if (token === "") {
        logger.error('bot/hears - ending /Check/ - not data resAll');
        return 'для получения детальных операций, необходимо обновить статистику нужного периода';
    }
    try {
        const res = await getCheck(id, knumber, token);
        //console.log(JSON.stringify(res))
        return res;
    } catch (err) {
        logger.error('bot/hears - getCheck', err.stack);
    }
}

function hide_menu(bot) {
    //bot.ctx.ReplyKeyboardHide();
    bot.hears('скрыть меню', async (ctx) => {
        logger.info('bot/command - markup remove');
        await ctx.reply('меню скрыто', { reply_markup: { remove_keyboard: true, }, });
    });
}

exports.hears = hears;
exports.actions_oper = actions_oper;
exports.actions_check = actions_check;
exports.hide_menu = hide_menu;