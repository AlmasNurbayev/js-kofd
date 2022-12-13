const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];

fs.unlink("db/errors.txt", (err) => {});
fs.unlink("db/create_result1.txt", (err) => {});
fs.unlink("db/result.txt", (err) => {});

fs.readFile('db/create.sql', "utf8", (err, data) => {
  sql = data;
    //console.log(sql);
  if (err) {
    writeError(JSON.stringify(err), "read sql-script");
    throw err;
  }
  b = clientQuery2(sql);
  console.log(b);
  //fs.writeFile('db/result.txt', JSON.stringify(b), error2 => { });
});

function writeError(error, point) {
  errorAr.push({
    date: new Date(),
    text: error,
    point: point
  });
  fs.writeFileSync('db/errors.txt', JSON.stringify(errorAr), error2 => {console.log("Error write file errors") });
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

  let result = {error: ""};

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
      writeError(JSON.stringify(e), "query");
      throw new Error(e);
    })
    .finally(() => {
      client.end();
      //result;
    });
  return result;
}






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