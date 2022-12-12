const fs = require("fs");
const { resolve } = require("path");
const { Client } = require("pg");

const sql = fs
  .readFileSync(resolve(__dirname, "../sql/initial.sql"))
  .toString();

const sqlConnectionString = "postgres://ps:PS31415926@localhost:5432/kofd";
const client = new Client(sqlConnectionString);

client.connect();

// async / await
(async () => {
  try {
    const res = await client.query(sql);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
  await client.end();
})();

// promises
client
  .query(sql)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  })
  .then(() => {
    client.end();
  });
