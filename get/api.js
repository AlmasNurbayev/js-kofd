"use strict";

const axios = require("axios");
const https = require("https");
const moment = require('moment');
//const fs = require("fs"); eslint detect
const { Client } = require('pg');
const { writeError, writeLog, logger } = require('../logs/logs-utils.js');
const jwt_decode = require('jwt-decode');
const dotenv = require("dotenv");
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const agent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * @description Get token from KOFD
 * @param {*} iin
 * @param {*} pass
 * @returns {Promise<string|Error>}
 */
async function getJWT(iin, pass) {

  //logger.info('api - starting getJWT: ' + iin);

  const data = {
    credentials: {
      iin: iin,
      password: pass,
    },
    organizationXin: iin,
  };

  const config = {
    method: "post",
    url: "https://cabinet.kofd.kz/api/authenticate/byIinAndPassword",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
    timeout: 14000
  };

  //console.log("1");

  try {

    const nowTimeStamp = Math.round(Date.now() / 1000) + 10; // округляем и прибавляем 10 секунд, чтобы дать время на все остальное
    //console.log('now ts', nowTimeStamp);
    //logger.info('api - getJWT, searching token for ' + iin + ' with timstamp > ' + nowTimeStamp);
    const query_token = `select * FROM "public".token 
    WHERE 
      BIN = '${iin}' and
      EXP > ${nowTimeStamp}   
    `;
    //console.log(nowTimeStamp);
    const res_token_select = await getQuery(query_token);
//    console.log(res_token_select.rows);
    
    if (res_token_select.rows.length > 0) {
        logger.info('api - found JWT in DB ' + res_token_select.rows[0].token.slice(0,20));
        logger.info('api - ending getJWT');
        return res_token_select.rows[0].token;
    } else {
      const response = await axios(config);
      //      console.log("2");
      //console.log(typeof response);
      //writeLog('response-post.txt', response.data, false);
      if (response.data.data == null) {
        await writeError(response.data, 'getJWT - JWT is null received');
        return;
      }

      const decoded = jwt_decode(response.data.data.jwt);
      //console.log(decoded);

      let query_insert = `INSERT INTO "public".token
      (BIN, token, working, exp, nbf)
      VALUES 
      ('${iin}', '${response.data.data.jwt}', ${true}, ${decoded.exp}, ${decoded.nbf})
      `;
      const res_token_insert = await getQuery(query_insert);
      //await writeLog("token_insert.txt", res_token_insert);
      //logger.info('api - insert token to db');

      //logger.info('api - ending getJWT');
      return response.data.data.jwt;
    }



  } catch (e) {
    await writeError(e, 'getJWT');
    throw new Error(e);
  }
}


/**
 * @description Get transaction data form KOFD
 * @param {*} jwt
 * @param {*} kassa_id
 * @returns {Promise<string|Error>}
 */
async function getTransaction(count, jwt, knumber, id_kassa, name_kassa, id_organization, bin, dateMode) {

  //logger.info('api - starting getTransaction: ' + JSON.stringify({ knumber, id_kassa, name_kassa }));
  const token = "Bearer " + jwt;
  //await writeLog(`jwt.txt`, String(token));

  //console.log(400 * index);
  let timer = setTimeout(() => timer = clearTimeout(timer), 400);
  
  let dateString, dateStart, dateEnd;
  if (dateMode != '') {
    let dateArr = getStringFilter(dateMode);
    dateString = dateArr[0];
    dateStart = dateArr[1];
    dateEnd = dateArr[2];
  }
  //skip=0&take=${count} - убрано кол-во операций
  const config = {
    method: "get",
    url: `https://cabinet.kofd.kz/api/operations?${dateString}&cashboxId=${knumber}`,
    headers: {
      "Content-Type": "application/json",
      'Host': String(uuidv4()),
      //"Connection": "keep-alive",
      //"Postman-Token": Date.now(),
      //"User-Agent": "PostmanRuntime/7.30.1",// need 2-nd token
      Authorization: token,
    },
    httpsAgent: agent,
    timeout: 16000
  };
  // console.log("---------------------------");
  // console.log('url', config.url);
  // console.log('host', config.headers.Host);
  // //console.log(jwt);
  // console.log("---------------------------");

  try {
    const res = await axios(config);
    //console.log(res.data);
    if (res.data.error) {
      await writeError(res.data.error, 'getData');
      return;
    }
    res.data['id_kassa'] = id_kassa;
    res.data['name_kassa'] = name_kassa;
    res.data['id_organization'] = id_organization;
    res.data['knumber'] = knumber;
    res.data['bin'] = bin;
    res.data['dateStart'] = dateStart;
    res.data['dateEnd'] = dateEnd;
    res.data['token'] = token;
    //await writeLog(`response-${knumber}.txt`, res.data, false);
    //logger.info('api - ending getTransaction');
    return res.data;
  } catch (e) {
    await writeError(e, 'getTransaction');
    throw new Error(e);
  }
}

/**
* @description Get check data form KOFD
* @param {string} id
* @param {string} knumber 
* @param {string} token 
* @returns {Promise<string|Error>} object
*/
async function getCheck(id, knumber, token) {
  logger.info('api - starting getCheck: ' + id + " - " + knumber);
  const config = {
    method: "get",
    url: `https://cabinet.kofd.kz/api/operations/operation?cashboxId=${knumber}&operationId=${id}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    httpsAgent: agent,
    timeout: 10000
  };
  try {
    const res = await axios(config);
    //console.log(res.data);
    if (res.data.error) {
      await writeError(JSON.stringify(res.data.error), 'getCheck');
      console.log(res.data.error);
      return;
    }
    logger.info('api - ending getCheck: ' + id + " - " + knumber);
    //console.log(JSON.stringify(res.data));
    return res.data;
  } catch (e) {
    await writeError(e.stack, 'getCheck');
    console.log(e.stack)
  }
}


/**
* @description Any query to DB
* @param {*} query
* @returns {Promise<string|Error>}
*/
async function getQuery(query) {
  //logger.info('api - starting getQuery: ' + query.slice(0, 50));
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    connectionTimeoutMillis: 6000,
    query_timeout: 6000,
    idle_in_transaction_session_timeout: 2000,
  });

  try {
    await client.connect();
  } catch (err) {
    await writeError(JSON.stringify(err.stack), 'getQuery-connect');
    //console.error('query error', err.stack);
    throw err;
  }

  try {
    let res = await client.query(query);
    //console.log(res)
    //await writeLog(`sql.txt`, res);
    //await writeLog(`query.txt`, new Date().toLocaleString("ru-RU") + ' /// ' + String(query), true,false);
    return res;
  } catch (e) {
    await writeError(JSON.stringify(e.stack), 'query');
    //console.error('query error', err.stack);
    throw new Error(e);
  } finally {
    client.end();
    //logger.info('api - ending getQuery');
  }
}

// 

/**
* @description recieve string for adding to filter GET in UTI encode
* @param {string} mode
* @returns {string} string
*/

function getStringFilter(mode, begin, end) {
  //console.log(mode);
  logger.info('api - starting getStringFilter: ' + mode);
  moment.updateLocale('ru');
  moment.updateLocale('ru', {
    week: {
      dow: 1,
      doy: 4
    }
  });
  let dateStart, dateEnd;

  if (mode === 'текущий день') {
    dateStart = moment().startOf('day');
    dateEnd = moment().endOf('day');
  } else if (mode === 'текущая неделя') {
    dateStart = moment().startOf('week');
    dateEnd = moment().endOf('week');
  } else if (mode === 'текущий месяц') {
    dateStart = moment().startOf('month');
    dateEnd = moment().endOf('month');
  } else if (mode === 'текущий квартал') {
    dateStart = moment().startOf('quarter');
    dateEnd = moment().endOf('quarter');
  } else if (mode === 'текущее полугодие') {
    if (moment(new Date()).get('quarter') < 3) {
      dateStart = moment().startOf('year');
      dateEnd = moment(dateStart).add(5, 'M').endOf('month');
    } else {
      dateStart = moment().startOf('year');
      dateStart = moment(dateStart).add(6, 'M').startOf('month');
      dateEnd = moment().endOf('year');
    }
  } else if (mode === 'текущий год') {
    dateStart = moment().startOf('year');
    dateEnd = moment().endOf('year');
  } else if (mode === 'прошлый день') { // 
    dateStart = moment().add(-1, 'd').startOf('day');
    dateEnd = moment().add(-1, 'd').endOf('day');
  } else if (mode === 'прошлая неделя') {
    dateStart = moment().add(-1, 'w').startOf('week');
    dateEnd = moment().add(-1, 'w').endOf('week');
  } else if (mode === 'прошлый месяц') {
    dateStart = moment().add(-1, 'M').startOf('month');
    dateEnd = moment().add(-1, 'M').endOf('month');
  } else if (mode === 'прошлый квартал') {
    dateStart = moment().add(-1, 'Q').startOf('quarter');
    dateEnd = moment().add(-1, 'Q').endOf('quarter');
  } else if (mode === 'прошлое полугодие') {
    if (moment(new Date()).get('quarter') < 3) {
      dateStart = moment().startOf('year');
      dateEnd = moment(dateStart).add(5, 'M').endOf('month');
    } else {
      dateStart = moment().startOf('year');
      dateStart = moment(dateStart).add(6, 'M').startOf('month');
      dateEnd = moment().endOf('year');
    }
    dateStart = dateStart.add(-2, 'Q').startOf('quarter');
    dateEnd = dateEnd.add(-2, 'Q').endOf('quarter');
  } else if (mode === 'прошлый год') {
    dateStart = moment().add(-1, 'y').startOf('year');
    dateEnd = moment().add(-1, 'y').endOf('year');
  } else if (mode === 'chart-10d') {
    dateStart = moment().add(-9, 'd').startOf('day');
    dateEnd = moment().endOf('day');
    //console.log(dateStart, dateEnd);
  } else if (mode === 'chart-14m') {
    dateStart = moment().add(-13, 'M').startOf('month');
    dateEnd = moment().endOf('month');    
  } else {
    dateStart = moment(begin).startOf('day');
    dateEnd = moment(end).endOf('day');
  }
  dateStart = dateStart.format('YYYY-MM-DD[T]HH:mm:ss.SSSZ');
  dateEnd = dateEnd.format('YYYY-MM-DD[T]HH:mm:ss.SSSZ');

  //&filter=[["operationDate",">=","2022-12-18T00:00:00.000+06:00"],"and",["operationDate","<","2022-12-22T00:00:00.000+06:00"]]
  let s1 = `&requireTotalCount=true&sort=[{"selector":"operationDate","desc":true}]&filter=[["operationDate",">=","${dateStart}"],"and",["operationDate","<=","${dateEnd}"]]`;
  let s2 = encodeURI(s1).replaceAll(',', '%2C').replaceAll(':', '%3A').replaceAll('+', '%2B'); // остались :+,
  //s2 = s2.replaceAll();

  return [s2, dateStart, dateEnd, mode];
}

/**
* @description Получить информацию о продукте из бэкенда сайта
* @param {string} name наименование товара
* @returns {Promise<string|Error>} object
*/
async function getProduct(name) {
  //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  logger.info('api - starting getCheck: ' + name);
  const config = {
    method: "get",
    url: process.env.SITE_GET_PRODUCT_URL + name,
    headers: {
      "Content-Type": "application/json",
      //Authorization: token,
    },
    httpsAgent: new https.Agent({
      checkServerIdentity: function (host, cert) {
        return undefined;
      }
    }),
    timeout: 14000
  };
  try {
    const res = await axios(config);
    //console.log(res.data);
    if (res.data.error) {
      await writeError(res.data.error, 'getProduct');
      return;
    }
    logger.info('api - ending getProduct: ' + name);
    //console.log(JSON.stringify(res.data));
    return res.data;
  } catch (e) {
    await writeError(e.stack, 'getProduct');
    console.log(e.stack)
  }
}


//console.log(getStringFilter('текущий квартал'));
//console.log([0,1]);

exports.getJWT = getJWT;
exports.getTransaction = getTransaction;
exports.getQuery = getQuery;
exports.getStringFilter = getStringFilter;
exports.getCheck = getCheck;
exports.getProduct = getProduct;
