const axios = require("axios");
const https = require("https");
const moment = require('moment');
const fs = require("fs");
const { Client } = require('pg');
const { writeError, writeLog } = require('../logs/logs-utils.js');

const agent = new https.Agent({
    rejectUnauthorized: false,
  });

const dateMode = {
    mode1: 'текущий день',
    mode2: 'текущая неделя',
    mode3: 'текущий месяц',
    mode4: 'текущий год',
    mode1: 'прошлый день',
    mode2: 'прошлая неделя',
    mode3: 'прошлый месяц',
    mode4: 'прошлый год'
  };

/**
 * @description Get token from KOFD
 * @param {*} iin
 * @param {*} pass
 * @returns {Promise<string|Error>}
 */
async function getJWT(iin, pass) {
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
    timeout: 4000
  };

  //console.log("1");

  try {
    const response = await axios(config);
    //      console.log("2");
    console.log(typeof response);
    writeLog('response-post.txt', response.data);
    if (response.data.data == null) {
      await writeError(response.data, 'getJWT');
      return;
    }
    return response.data.data.jwt;
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
async function getTransaction(count ,jwt, knumber, id_kassa, name_kassa, id_organization, dateMode) {
    const token = "Bearer " + jwt;
    await writeLog(`jwt.txt`, String(token));
  
    if (dateMode != '') {
      dateString = getStringFilter(dateMode)[0];
    };
    //skip=0&take=${count} - убрано кол-во операций
    const config = {
      method: "get",
      url: `https://cabinet.kofd.kz/api/operations?${dateString}&cashboxId=${knumber}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      httpsAgent: agent,
      timeout: 2000
    };
    
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
      await writeLog(`response-${knumber}.txt`, res.data, false);
      return res.data;
    } catch (e) {
      await writeError(e, 'getData');
      throw new Error(e);
    }
  }
  
  /**
 * @description Any query to DB
 * @param {*} query
 * @returns {Promise<string|Error>}
 */
  async function getQuery(query) {
    const client = new Client({
      user: 'ps',
      host: 'localhost',
      database: 'kofd',
      password: 'PS31415926',
      connectionTimeoutMillis: 4000,
      query_timeout: 4000,
      idle_in_transaction_session_timeout: 2000,
      port: 5432
    });
  
    try {
      await client.connect();
    } catch (err) {
      await writeError(JSON.stringify(e.stack), 'getKassa-connect');
      //console.error('query error', err.stack);
      throw err;
    }
    
    try {
      let res = await client.query(query);
      //console.log(res)
      await writeLog(`query.txt`, res);
      return res;
    } catch (e) {
      await writeError(JSON.stringify(e.stack), 'query');
      //console.error('query error', err.stack);
      throw new Error(e);
    } finally {
      client.end();
    }
  }
  
  // 
    
  /**
 * @description recieve string for adding to filter GET in UTI encode
 * @param {string} mode
 * @returns {string} string
 */

  function getStringFilter(mode, begin, end) {
    console.log(mode);
    moment.updateLocale();
    moment.updateLocale('en', {
      week : {
          dow : 1,
          doy : 4
       }
  });
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
    } else if (mode === 'текущий год') {
      dateStart = moment().startOf('year');
      dateEnd = moment().endOf('year');
    } else if (mode === 'прошлый день') { // 
      dateStart = moment().add(-1,'d').startOf('day');
      dateEnd = moment().add(-1,'d').endOf('day');
    } else if (mode === 'прошлая неделя') {
      dateStart = moment().add(-1,'w').startOf('week');
      dateEnd = moment().add(-1,'w').endOf('week');
    } else if (mode === 'прошлый месяц') {
      dateStart = moment().add(-1,'m').startOf('month');
      dateEnd = moment().add(-1,'m').endOf('month');
    } else if (mode === 'прошлый квартал') {
      dateStart = moment().add(-1,'Q').startOf('quarter');
      dateEnd = moment().add(-1,'Q').endOf('quarter');
    } else if (mode === 'прошлый год') {
      dateStart = moment().add(-1,'y').startOf('year');
      dateEnd = moment().add(-1,'y').endOf('year');
    } else {
      dateStart = moment(begin).startOf('day');
      dateEnd = moment(end).endOf('day');
    };
    dateStart = dateStart.format('YYYY-MM-DD[T]HH:mm:ss.SSSZ');
    dateEnd = dateEnd.format('YYYY-MM-DD[T]HH:mm:ss.SSSZ');

    //&filter=[["operationDate",">=","2022-12-18T00:00:00.000+06:00"],"and",["operationDate","<","2022-12-22T00:00:00.000+06:00"]]
    let s1 = `&requireTotalCount=true&sort=[{"selector":"operationDate","desc":true}]&filter=[["operationDate",">=","${dateStart}"],"and",["operationDate","<=","${dateEnd}"]]`;
    let s2 = encodeURI(s1).replaceAll(',','%2C').replaceAll(':','%3A').replaceAll('+', '%2B'); // остались :+,
    //s2 = s2.replaceAll();

    return [s2, dateStart, dateEnd, mode];
  }

  //console.log(getStringFilter('текущий квартал'));

exports.getJWT = getJWT;
exports.getTransaction = getTransaction;
exports.getQuery = getQuery;
exports.getStringFilter = getStringFilter;