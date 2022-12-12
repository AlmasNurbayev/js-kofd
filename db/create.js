const fs = require("fs");
const { resolve } = require("path");
const { Client } = require("pg");

const sql = fs
  .readFileSync(resolve(__dirname, "../sql/initial.sql"))
  .toString();

const sqlConnectionString = "postgres://ps:PS31415926@localhost/kofd";
const client = new Client(sqlConnectionString);

client.connect();

client.query(sql, (err, res) => {
  if (err) throw err;
  console.log(res);
  client.end();
});
