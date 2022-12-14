const axios = require("axios");
const https = require("https");
const fs = require("fs");
const { Client } = require('pg');
const { resolve } = require("path");


// delete all temporary files
fs.unlink("get/response-post.txt", (err) => { });
fs.unlink("get/jwt.txt", (err) => { });
fs.unlink("get/response-get.txt", (err) => { });
fs.unlink("get/errors.txt", (err) => { });
fs.unlink("get/response.txt", (err) => { });

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const errorAr = [];

// Get token from KOFD
async function getJWT(iin, pass) {
  const data = {
    credentials: {
      iin: iin,
      password: pass,
    },
    organizationXin: iin,
  };

  const config = {
    method: "post",
    url: "https://cabinet.kofd.kz/api/authenticate/byIinAndPassword",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
    timeout: 2000
  };

  //console.log("1");

  try {
    const response = await axios(config);
    //      console.log("2");
    console.log(typeof response);
    fs.writeFile("get/response-post.txt", JSON.stringify(response.data), (error2) => { });
    if (response.data.data == null) {
      writeError(JSON.stringify(response.data.error), "getJWT");
    }
    return response.data.data.jwt;
  } catch (error) {
    writeError(error, "getJWT");
    return String(error);
  }
}


// get transaction data form KOFD
async function getData(jwt, kassa_id) {
  const token = "Bearer " + jwt;
  fs.writeFile("get/jwt.txt", String(token), (error2) => { });

  const config = {
    method: "get",
    url: `https://cabinet.kofd.kz/api/operations?skip=0&take=2&cashboxId=${kassa_id}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    httpsAgent: agent,
    timeout: 2000
  };

  try {
    const res = await axios(config);
    //console.log(res.data);
    if (res.data.error) {
      writeError(JSON.stringify(res.data.error), "getData");
    }
    fs.writeFile("get/response-" + kassa_id + ".txt", JSON.stringify(res.data), (error2) => { });
    return res.data;
  } catch (error) {
    writeError(error, "getData");
  }
}

function writeError(error, point) {
  errorAr.push({
    date: new Date(),
    text: String(error),
    point: point,
  });
  fs.writeFile("get/errors.txt", JSON.stringify(errorAr), (error2) => { });
}

// запускать либо так
// (async () => {
//   console.log(await getData("800727301256", "Aw31415926!", "33812"));
// })();

// ВРЕМЕННО ОТКЛЮЧЕНО!
//  getData("800727301256", "Aw31415926!", "33812").then(res => {
//    fs.writeFile("get/response.txt", JSON.stringify(res), (error2) => {});
//    console.log(res); // if res.error == constain error
//  })
//  .catch(err => {
//     console.log("4");
//     console.log(err);
//  })

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
    port: 5432
  });



  try {
    res = await client.connect();
    try {
      res = await client.query(query);
      //console.log(res)
      fs.writeFile("get/kassa-get.txt", JSON.stringify(res), (error2) => { });
      return res;
    } catch (err) {
      writeError(JSON.stringify(err.stack), "getKassa-connect");
      //console.error('query error', err.stack);
      throw err;
    } finally {

    }
  } catch (err) {
    writeError(JSON.stringify(err.stack), "getKassa-query");
    //console.error('query error', err.stack);
    throw err;
  } finally {
    client.end();
  }
}


const queryAllKassa = `select organization.bin, organization.name_org, organization.password_kofd, kassa.*  FROM "public".organization
join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
const queryAllOrganization = `select * FROM "public".organization`;

// get list of org & kassa form db 
Promise.all([getQuery(queryAllKassa), getQuery(queryAllOrganization)]).then(res => {
  ArrJWT = [];
  listKassa = res[0].rows;
  console.table(listKassa);
  listOrg = res[1].rows;
  listOrg.forEach(element => {
    ArrJWT.push(getJWT(element.bin, element.password_kofd));
  });
  // get JWT for all organization
  Promise.all(ArrJWT).then(res => {
    //console.log(JSON.stringify(res));
    listOrg.forEach((element,index) => {
      element['jwt'] = res[index];
    });
    // merge listOrg and listKassa
    listKassa.forEach(elementKassa => {
      listOrg.forEach(elementOrg => {
         if (elementKassa.bin === elementOrg.bin) {
            elementKassa['jwt'] = elementOrg.jwt;

            ArrGet = [];
            ArrGet.push(getData(elementKassa.jwt, elementKassa.knumber));
            
            // get data for all kassa
            Promise.all(ArrGet).then(res => {
              fs.writeFile("get/response.txt", JSON.stringify(res), (error2) => {});
              console.log(res);
            })
            .catch (err => {
              console.log(err.stack);
            });
         }
      }); 
    });
    // console.table(listOrg);
    // console.table(listKassa);
  })
    .catch(err => {
      console.log(err.stack);
    });
}).catch (err => {
  console.log(err.stack);
});

