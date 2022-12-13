const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];
let  sql = "";

fs.readFile('db/create.sql', (err, data) => {
  sql = data;
    //console.log(sql);
  if (err) {
    writeError(JSON.stringify(err), "read sql-script");
    throw err;
  }
});

sql = `-- create organization
ALTER SCHEMA "public" OWNER TO ps;
CREATE TABLE "public".organization (
	id smallint PRIMARY KEY,
	BIN varchar,
	name varchar);
ALTER TABLE "public".organization OWNER TO ps;

-- create kassa
CREATE TABLE "public".kassa (
    id smallint PRIMARY KEY,
    snumber varchar,
    znumber varchar,
    knumber varchar,
    name varchar,
    id_organization smallint REFERENCES "public".organization (id));
COMMENT ON COLUMN "public".kassa.snumber IS E'serial number, like 010102360873';
COMMENT ON COLUMN "public".kassa.znumber IS E'Zavod number, like SWK00426370';
COMMENT ON COLUMN "public".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
COMMENT ON COLUMN "public".kassa.name IS E'name, like Incore-EU-3';
COMMENT ON COLUMN "public".kassa.id_organization IS E'linked table';
ALTER TABLE "public".kassa OWNER TO ps;

-- create transaction
CREATE TABLE "public".transaction (
    id varchar,
    onlineFiscalNumber varchar,
    offlineFiscalNumber varchar,
    systemDate timestamptz,
    operationDate timestamptz,
    type_operation smallint,
    subType smallint,
    sum_operation numeric,
    availableSum numeric,
    paymentTypes smallint,
    shift smallint,
    id_organization smallint REFERENCES "public".organization (id),
    id_kassa smallint REFERENCES "public".kassa (id));
ALTER TABLE "public".transaction OWNER TO ps;`;

function writeError(error, point) {
  errorAr.push({
    date: new Date(),
    text: string(error),
    point: point
  });
  fs.writeFile('db/errors.txt', JSON.stringify(errorAr), error2 => { });
}



function clientQuery2(item) {
  
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

  let result = undefined;

  client
    .connect()
    .catch((e) => {
      // что-то тут делаешь
      writeError(JSON.stringify(e), "connect");
      throw new Error(e);
    })
    .then(() => {
        return client.query(item).then((res) => {
        result = res;
        fs.writeFile('db/create_result1.txt', JSON.stringify(result), error2 => { });
      });
    })
    .catch((e) => {
      // что-то тут делаешь
      writeError(e, "query");
      throw new Error(e);
    })
    .finally(() => {
      //return client.end();
      client.end();
    });

  return result;
}

 let b = clientQuery2(sql);
 console.log(b);




//  b = clientQuery2(sql).then((res) => {
//    console.log(res);
//  });

  // let client = new Client({
  //     user: 'ps',
  //     host: 'localhost',
  //     database: 'kofd',
  //     password: 'PS31415926',
  //     port: 5432
  // });

  // await client.connect();
  // await client.query(item.sql, (err, data) => {
  //     if (err)
  //     throw new Error(err);
  //     writeError(String(data) &  " ===== " & JSON.stringify(err), item.desciption);
  //     item.status = true;
  // });
  // await client.end();


// sql.forEach((item) => {
//     if (item.status) {
//         console.log('found error in ' & String(item.desciption));
//     }
// });