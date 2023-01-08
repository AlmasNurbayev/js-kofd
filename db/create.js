"use strict";

const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];
const dotenv = require("dotenv");
const { writeError, writeLog, logger } = require('../logs/logs-utils.js');
dotenv.config();

fs.unlink("db/errors.txt", (err) => { });
fs.unlink("db/create_result1.txt", (err) => { });
fs.unlink("db/result.txt", (err) => { });

(async () => {
    await runAll();
  })();
  
  async function runAll() {
    try {
      logger.info('db create - starting runAll');
      await clientQuery('db/drop.sql');
      await clientQuery('db/create.sql');
      await clientQuery('db/insert.sql');
    } catch (e) {
      await writeError(e.stack, 'db - runAll');  
      throw e;
    }
  }

async function clientQuery(path) {
    console.log("begin " + path);
    logger.info('db create - starting clientQuery ' + path);
    const client = new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,        
        connectionTimeoutMillis: 2000,
        query_timeout: 1000,
        idle_in_transaction_session_timeout: 1000,
    });

    let query = "";
    try {
        logger.info('db create - clientQuery reading file ' + path);
        query = String(fs.readFileSync(path));
    }
    catch (err) {
        writeError(JSON.stringify(err.stack), "db create - reading script");
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
        logger.info('db create - clientQuery connecting db');
    } catch (err) {
        writeError(JSON.stringify(err.stack), "db create - connect " + path);
        throw new Error(err);
    }

    try {
        let res = await client.query(query);
        logger.info('db create - clientQuery quering db');
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
        logger.info('db create - clientQuery ending');
    }
    // });
}

