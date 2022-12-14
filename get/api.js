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
 * @returns
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

    if (res.data.data == null) {
      writeError(JSON.stringify(res.data.error), 'getJWT');
    }
    return res.data.data.jwt;
  } catch (e) {
    writeError(e, 'getJWT');
    return String(e);
  }
}

/**
 * @description Get transaction data form KOFD
 * @param {*} jwt
 * @param {*} kassa_id
 * @returns
 */
async function getData(jwt, kassa_id) {
  const token = 'Bearer ' + jwt;

  writeLog('jwt.txt', response.data);

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
      writeError(JSON.stringify(res.data.error), 'getData');
    }

    writeLog(`response-${kassa_id}.txt"`, response.data);

    return res.data;
  } catch (e) {
    writeError(e, 'getData');
  }
}

/**
 * @description Any query to DB
 * @param {*} query
 * @returns
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
    writeError(JSON.stringify(e.stack), 'getKassa-connect');
    throw e;
  }

  try {
    try {
      const res = await client.query(query);
      fs.writeFile('get/kassa-get.txt', JSON.stringify(res), () => {});
      return res;
    } catch (e) {
      writeError(JSON.stringify(e.stack), 'getKassa-connect');
      throw e;
    } finally {
    }
  } catch (e) {
    writeError(JSON.stringify(e.stack), 'getKassa-query');
    throw e;
  } finally {
    client.end();
  }
}

exports.getJWT = getJWT;
exports.getData = getData;
exports.getQuery = getQuery;
