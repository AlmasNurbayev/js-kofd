const fs = require("fs");
const { getJWT, getTransaction, getQuery } = require('./api');
const { writeError, writeLog } = require('../logs/logs-utils.js');
const count = 40; // count of transaction get from kofd


// delete all temporary files
fs.unlink("logs/response-post.txt", (err) => { });
fs.unlink("logs/jwt.txt", (err) => { });
fs.unlink("logs/response-get.txt", (err) => { });
//fs.unlink("get/errors.txt", (err) => { });
fs.unlink("logs/response.txt", (err) => { });


const queryAllKassa = `select organization.bin, organization.name_org, organization.password_kofd, kassa.*  FROM "public".organization
join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
const queryAllOrganization = `select * FROM "public".organization`;

// get list of org & kassa form db 
Promise.all([getQuery(queryAllKassa), getQuery(queryAllOrganization)]).then(res => {
  let arrJWT = [];
  listKassa = res[0].rows;
  console.table(listKassa);
  listOrg = res[1].rows;
  listOrg.forEach(element => {
    arrJWT.push(getJWT(element.bin, element.password_kofd));
  });
  // get JWT for all organization
  return Promise.all(arrJWT).then(res => {
    //console.log(JSON.stringify(res));
    listOrg.forEach((element, index) => {
      element['jwt'] = res[index];
    });
    // merge listOrg and listKassa
    //let arrKnumber = [];
    listKassa.forEach(elementKassa => {
      listOrg.forEach(elementOrg => {
        if (elementKassa.bin === elementOrg.bin) {
          elementKassa['jwt'] = elementOrg.jwt;

          let arrGet = [];
          arrGet.push(getTransaction(count, elementKassa.jwt, elementKassa.knumber));
          //arrKnumber.push(elementKassa.knumber);
          // get data for all kassa
          return Promise.all(arrGet).then(res => {
            writeLog(`response.txt`, JSON.stringify(res), false);
            writeOperation(res, elementKassa.id, elementKassa.id_organization);
            //fs.appendFile("get/response.txt", JSON.stringify(res) + "\n", (error2) => { });
            //console.log(arrKnumber);
            //console.log(res);
          })
            .catch(err => {
              writeError(err.stack, 'getTransaction');
              console.log();
            });
        }
      });
    });
    // console.table(listOrg);
    // console.table(listKassa);
  })
    .catch(err => {
      console.log(err.stack);
      writeError(err.stack, 'getTransaction');
    });
}).catch(err => {
  console.log(err.stack);
  writeError(err.stack, 'getTransaction');
});

async function writeOperation(res, id_kassa, id_organization) {
  try {
    sql = `INSERT INTO "public".transaction (
    id,
    onlineFiscalNumber,
    offlineFiscalNumber,
    systemDate,
    operationDate,
    type_operation,
    subType,
    sum_operation,
    availableSum, 
    paymentTypes,
    shift,
    uploadDate,
    id_organization,
    id_kassa)
  VALUES
  `;
    res.forEach((element) => {
      element.data.forEach((element2, index) => {

        sql += `(`;
        arr = []
        arr.push(`'` + element2.id + `'`);
        if (element2.onlineFiscalNumber == null) {
          arr.push(`'`+`'`);
        } else {
          arr.push(`'` + element2.onlineFiscalNumber + `'`);
        }
        if (element2.offlineFiscalNumber == null) {
          arr.push(`'`+`'`);
        } else {
          arr.push(`'` + element2.offlineFiscalNumber + `'`);
        }
        arr.push(`'` + element2.systemDate + `'`);
        arr.push(`'` + element2.operationDate + `'`);
        arr.push(`'` + element2.type + `'`);
        if (element2.subType == null) {
          arr.push('NULL');
        } else {
          arr.push(`'` + element2.subType + `'`);
        }
        arr.push(element2.sum);
        arr.push(element2.availableSum);
        arr.push(`'` + element2.paymentTypes + `'`);
        arr.push(element2.shift);
        arr.push(`'` + new Date().toISOString() + `'`);
        arr.push(id_organization);
        arr.push(id_kassa);
        sql += arr.join(',');
        //console.log(index + " / " + element.data.length);

        if (index == element.data.length - 1) {
          sql += `)`;
        } else { sql += `),`; }
      });
    });
    sql += `
    ON CONFLICT (id) DO NOTHING;`;
    //console.log(sql);
    let res2 =  await getQuery(sql);
    writeLog(`writeOperation.txt`, JSON.stringify(res2), false);
    return res2;
  }
  catch (err) {
    writeError(err.stack, 'writeOperation');
    //console.error('query error', err.stack);
    throw new Error(err);
  };
}