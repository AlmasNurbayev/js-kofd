const { getQuery } = require("./api");
const { writeError, writeLog } = require('../logs/logs-utils.js');

(async () => {
    await ViewData();
  })();

async function ViewData() {
    sql = `select * from "public".transaction;`;
    try {
      console.table(JSON.stringify(getQuery(sql)));
      
    } catch (e) {
      throw e;
    }
}