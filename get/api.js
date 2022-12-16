const axios = require("axios");
const https = require("https");
const fs = require("fs");
const { Client } = require('pg');
const { resolve } = require("path");
const { writeError, writeLog } = require('../logs/logs-utils.js');

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
    timeout: 2000
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
async function getTransaction(count ,jwt, kassa_id) {
    const token = "Bearer " + jwt;
    await writeLog(`jwt.txt`, String(token));
  
    const config = {
      method: "get",
      url: `https://cabinet.kofd.kz/api/operations?skip=0&take=${count}&cashboxId=${kassa_id}`,
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
      res.data['knumber'] = kassa_id;
      await writeLog(`response-${kassa_id}.txt`, res.data, false);
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
      connectionTimeoutMillis: 2000,
      query_timeout: 1000,
      idle_in_transaction_session_timeout: 1000,
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
  

exports.getJWT = getJWT;
exports.getTransaction = getTransaction;
exports.getQuery = getQuery;