const { Client } = require('pg');
const fs = require('fs/promises');
const errorAr = [];

(async () => {
  await runAll();
})();

async function runAll() {
  try {
    await runScript('db/create.sql');
    await runScript('db/insert.sql');
  } catch (e) {
    throw e;
  }
}

async function runScript(path) {
  let sql;
  try {
    sql = await fs.readFile(path, 'utf8');
  } catch (error) {
    writeError(JSON.stringify(err), 'read sql-script', path);
    throw err;
  }

  try {
    await clientQuery(sql, path);
  } catch (error) {
    console.log(path + ':    fuck!');
    console.log(err.stack);
  }
}

function writeError(error, point, path) {
  errorAr.push({
    date: new Date(),
    text: error,
    point: point,
    path: path,
  });
  fs.writeFileSync('db/logs/errors.txt', JSON.stringify(errorAr), (error2) => {
    console.log('Error write file errors');
  });
}

async function clientQuery(query, path) {
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
      fs.writeFile('db/logs/create_result1.txt', JSON.stringify(res), (error2) => {});
      return res;
    } catch (err) {
      writeError(JSON.stringify(err.stack), 'query', path);
      //console.error('query error', err.stack);
      throw err;
    } finally {
      client.end();
    }
  } catch (err) {
    writeError(JSON.stringify(err.stack), 'connect', path);
    //console.error('query error', err.stack);
    client.end();
    throw err;
  } finally {
  }
}
