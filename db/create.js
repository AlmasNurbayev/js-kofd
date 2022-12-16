const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];

fs.unlink("db/errors.txt", (err) => { });
fs.unlink("db/create_result1.txt", (err) => { });
fs.unlink("db/result.txt", (err) => { });

(async () => {
    await runAll();
  })();
  
  async function runAll() {
    try {
      await clientQuery('db/drop.sql');
      await clientQuery('db/create.sql');
      await clientQuery('db/insert.sql');
    } catch (e) {
      throw e;
    }
  }

function writeError(error, point, path) {
    errorAr.push({
        date: new Date(),
        text: error,
        point: point,
        path: path
    });
    fs.writeFile('db/errors.txt', JSON.stringify(errorAr), error2 => { console.log("Error write file errors") });
}

async function clientQuery(path) {
    console.log("begin " + path);
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

    let query = "";
    try {
        query = String(fs.readFileSync(path));
    }
    catch (err) {
        writeError(JSON.stringify(err.stack), "reading script");
        throw new Error(err);
    }
    // fs.readFile(path, "utf8", (err, data) => {
    //     query = data;
    //     if (err) {
    //         writeError(JSON.stringify(err), "read sql-script", path);
    //         throw err;
    //     }
    
    try {
        await client.connect();
    } catch (err) {
        writeError(JSON.stringify(err.stack), "connect " + path);
        throw new Error(err);
    }

    try {
        let res = await client.query(query);
        fs.writeFile('db/create_result1.txt', JSON.stringify(res), error2 => { });
        //console.log(res);
        //client.end();
        return res;
    } catch (err) {
        writeError(JSON.stringify(err.stack), "query " + path);
        //console.error('query error', err.stack);
        throw new Error(err);
    } finally {
        client.end();
    }
    // });
}

