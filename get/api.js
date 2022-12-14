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
    const response = await axios(config);

    writeLog('response-post.txt', response.data);

    if (response.data.data == null) {
      writeError(JSON.stringify(response.data.error), 'getJWT');
    }
    return response.data.data.jwt;
  } catch (error) {
    writeError(error, 'getJWT');
    return String(error);
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
  } catch (error) {
    writeError(error, 'getData');
  }
}

// Any query to DB
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
    res = await client.connect();
    try {
      res = await client.query(query);
      //console.log(res)
      fs.writeFile('get/kassa-get.txt', JSON.stringify(res), () => {});
      return res;
    } catch (err) {
      writeError(JSON.stringify(err.stack), 'getKassa-connect');
      //console.error('query error', err.stack);
      throw err;
    } finally {
    }
  } catch (err) {
    writeError(JSON.stringify(err.stack), 'getKassa-query');
    //console.error('query error', err.stack);
    throw err;
  } finally {
    client.end();
  }
}

exports.getJWT = getJWT;
exports.getData = getData;
exports.getQuery = getQuery;
