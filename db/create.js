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