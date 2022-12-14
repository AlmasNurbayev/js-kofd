const https = require('https');
const axios = require('axios');
const { Client } = require('pg');
const { writeLog, writeError } = require('./utils');

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
    method: 'post',
    url: 'https://cabinet.kofd.kz/api/authenticate/byIinAndPassword',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
    timeout: 2000,
  };

  try {
    const res = await axios(config);
    writeLog('response-post.txt', res.data);
    if (!res.data.data) {
      await writeError(res.data, 'getJWT');
      return;
    }
    return res.data.data.jwt;
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
async function getOperationsData(jwt, kassa_id) {
  const token = 'Bearer ' + jwt;

  const config = {
    method: 'get',
    url: `https://cabinet.kofd.kz/api/operations?skip=0&take=2&cashboxId=${kassa_id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    httpsAgent: agent,
    timeout: 2000,
  };

  try {
    const res = await axios(config);

    if (res.data.error) {
      await writeError(res.data.error, 'getData');
    }

    await writeLog(`response-${kassa_id}.txt`, res.data);
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
    port: 5432,
  });

  try {
    await client.connect();
  } catch (e) {
    await writeError(JSON.stringify(e.stack), 'getKassa-connect');
    throw new Error(e);
  }

  try {
    const res = await client.query(query);
    await writeLog(`kassa-get.txt`, res);
    return res;
  } catch (e) {
    await writeError(e.stack, 'getKassa-query');
    throw new Error(e);
  } finally {
    await client.end();
  }
}

exports.getJWT = getJWT;
exports.getData = getOperationsData;
exports.getQuery = getQuery;
