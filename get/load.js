"use strict";

//const fs = require("fs");
const { getJWT, getTransaction, getQuery } = require('./api');
const { writeError, writeLog, logger, isFileExist } = require('../logs/logs-utils.js');
//const dotenv = require("dotenv");
const count = 1000; // count of transaction get from kofd


// clear all temporary files
const name1 = "../logs/response-post.txt";
if (isFileExist(name1)) {
  //fs.unlink(name1, (err) => {writeError(err.stack, 'load - unlink')});
} 
const name2 = "../logs/response.txt";
if (isFileExist(name2)) {
  //fs.unlink(name2, (err) => {writeError(err.stack, 'load - unlink')});
} 

//fs.unlink("../logs/jwt.txt", (err) => {writeError(err.stack, 'load - unlink') });
//fs.unlink("../logs/response-get.txt", (err) => {writeError(err.stack, 'load - unlink') });


// get list of org & kassa form db 
async function load(period) {
  const tableSumAll = {
    sumSale: 0,
    sumSaleCard: 0,
    sumSaleCash: 0,
    sumSaleMixed: 0,
    sumReturn: 0,
    sumReturnCard: 0,
    sumReturnCash: 0,
    sumReturnMixed: 0,
    sumAll: 0,
    sumAllCard: 0,
    sumAllCash: 0,
    sumAllMixed: 0,
    countChecks: 0,
    availableSum: 0,
    shiftClosed: false,
    cashEject: false,
    dateStart: '',
    dateEnd: '',
    obj: []
  };
  const queryAllKassa = `select organization.bin, organization.name_org, kassa.*  FROM "public".organization
  join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
  const queryAllOrganization = `select * FROM "public".organization`;

  let listKassa, listOrg;


  let arrJWT = [];
  let arrGet = [];
  try {
    logger.info('load - starting query of kassa and organization');  
    let res = await Promise.all([getQuery(queryAllKassa), getQuery(queryAllOrganization)]);
    listKassa = res[0].rows;
    listOrg = res[1].rows;
    console.table(listKassa);
    console.table(listOrg);

    listOrg.forEach(element => {
      arrJWT.push(getJWT(element.bin, process.env.KOFDPASSWORD));
      //console.log('get jwt: ' + element.bin);
    });

  }
  catch (err) {
    console.log(err.stack);
    writeError(err.stack, 'getTransaction - promise get kassa and org ');
    throw new Error(err);
  }

  

  try {
    logger.info('load - starting of build array with JWT'); 
    let res = await Promise.all(arrJWT);
    
    //console.log(JSON.stringify(res));
    listOrg.forEach((element, index) => {
      element['jwt'] = res[index];
    });
    //console.table(listOrg);
    // merge listOrg and listKassa
    // arrKnumber = [];

    listKassa.forEach((elementKassa) => {
      listOrg.forEach(elementOrg => {
        if (elementKassa.bin === elementOrg.bin) {
          elementKassa['jwt'] = elementOrg.jwt;
          //setTimeout(() => {
          arrGet.push(getTransaction(count, elementKassa.jwt, elementKassa.knumber, elementKassa.id, elementKassa.name_kassa, elementKassa.id_organization, elementKassa.bin, period));
          //}, index * 200);
          //arrKnumber.push(elementKassa.knumber);
          // get data for all kassa
        }
      });
    });
  }
  catch (err) {
    console.log(err.stack);
    writeError(JSON.stringify(err.stack), 'getTransaction - promise get jwt and transactions');
    throw new Error(err);
  }

  try {
    logger.info('load - starting GET query receive transaction'); 
    let res2 = await Promise.all(arrGet);
    res2.forEach((element3) => {
      //console.log(element3.name_kassa + ", " + element3.data.length + ", " + element3.id_kassa + ",  " + element3.id_organization);
      writeOperation(element3, element3.id_kassa, element3.name_kassa, element3.id_organization);
      writeLog(`response.txt`, element3, false);
      getSummary(tableSumAll, getStat(element3, element3.id_kassa, element3.name_kassa, element3.id_organization, element3.dateStart, element3.dateEnd));
    });
    //fs.appendFile("get/response.txt", JSON.stringify(res) + "\n", (error2) => { });
    //writeLog(`tableSumAll.txt`, tableSumAll, false);
    //writeLog(`rows.txt`, res2, false);
    //console.log(tableSumAll);
    return {
      'table': tableSumAll,
      'rows': res2};
  } catch (err) {
    writeError(err.stack, 'getTransaction - promise get summary');
    console.log(err.stack);
    throw new Error(err);
  }
}

// insert to db from recieved transaction 
async function writeOperation(res, id_kassa, name_kassa, id_organization) {
  if (res.data.length == 0) { return }
  let sql;
  try {
    logger.info('load - starting query in DB for insert transactions'); 
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
  VALUES`;
    
    res.data.forEach((element2, index) => {
      let arr = [];
      sql += `
      (`;
      arr.push(`'` + element2.id + `'`);
      if (element2.onlineFiscalNumber == null) {
        arr.push(`'` + `'`);
      } else {
        arr.push(`'` + element2.onlineFiscalNumber + `'`);
      }
      if (element2.offlineFiscalNumber == null) {
        arr.push(`'` + `'`);
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
      if (index == res.data.length - 1) {
        sql += `)`;
      } else {
        sql += `),`;
      }
    });
    sql += `
    ON CONFLICT (id) DO NOTHING;`;
    //fs.writeFileSync('logs/insert.txt', String(new Date()) + " " + sql);
    //console.log(sql);
    let res2 = await getQuery(sql);
    //writeLog(`writeOperation.txt`, JSON.stringify(res2), false);
    return res2;
  }
  catch (err) {
    writeError(err.stack, 'writeOperation');
    //console.error('query error', err.stack);
    throw new Error(err);
  }
}

// count statistics from recieved transaction 
function getStat(res, knumber, name_kassa, id_organization, dateStart, dateEnd) {

  let tableSum = {
    sumSale: 0,
    sumSaleCard: 0,
    sumSaleCash: 0,
    sumSaleMixed: 0,
    sumReturn: 0,
    sumReturnCard: 0,
    sumReturnCash: 0,
    sumReturnMixed: 0,
    sumAll: 0,
    sumAllCard: 0,
    sumAllCash: 0,
    sumAllMixed: 0,
    countChecks: 0,
    availableSum: 0,
    shiftClosed: false,
    cashEject: 0,
    knumber: knumber,
    name_kassa: name_kassa,
    id_organization: id_organization,
    dateStart: dateStart,
    dateEnd: dateEnd
  };

  logger.info(`load - starting get stat for ${knumber} / ${name_kassa}`); 

  try {
    res.data.forEach((element2, index) => {
      //console.log(element2);
      if (index === 0) {tableSum.availableSum = element2.availableSum;}
      if (element2.type == 1) {
        if (element2.subType == 2) { // продажа
          tableSum.countChecks++;
          tableSum.sumSale += element2.sum;
          //console.log(element2.paymentTypes);
          if (typeof (element2.paymentTypes) == 'object') {
            if (element2.paymentTypes.length == 2) {
              tableSum.sumSaleMixed += element2.sum;
            } else if (element2.paymentTypes[0] == 0) {
              tableSum.sumSaleCash += element2.sum;
            } else if (element2.paymentTypes[0] == 1) {
              tableSum.sumSaleCard += element2.sum;
            }
          }
        }
        else if (element2.subType == 3) { // возврат
          tableSum.countChecks++;
          tableSum.sumReturn += element2.sum;
          if (typeof (element2.paymentTypes) == 'object') {
            if (element2.paymentTypes.length == 2) {
              tableSum.sumReturnMixed += element2.sum;
            } else if (element2.paymentTypes[0] == 0) {
              tableSum.sumReturnCash += element2.sum;
            } else if (element2.paymentTypes[0] == 1) {
              tableSum.sumReturnCard += element2.sum;
            }
          }
        }
      } else if (element2.type == 2) { // смена
        tableSum.shiftClosed = true;
        //tableSum.availableSum = element2.availableSum;
      } else if (element2.type == 6 && element2.subType == 1) { // выемка
        tableSum.cashEject += element2.sum;
        //tableSum.availableSum = element2.availableSum;
      }
    });
    tableSum.sumAll = tableSum.sumSale - tableSum.sumReturn;
    tableSum.sumAllCard = tableSum.sumSaleCard - tableSum.sumReturnCard;
    tableSum.sumAllCash = tableSum.sumSaleCash - tableSum.sumReturnCash;
    tableSum.sumAllMixed = tableSum.sumSaleMixed - tableSum.sumReturnMixed;
    return tableSum;
    //console.log('Итоги по кассе ' + name_kassa + ':');
    //console.log(tableSum);
  }
  catch (err) {
    writeError(err.stack, 'getStat');
    //console.error('query error', err.stack);
    throw new Error(err);
  }
}

function getSummary(tableSumAll, obj) {

  logger.info(`load - starting get summary for ${JSON.stringify(obj.name_kassa)}`); 

  try {
    tableSumAll.sumSale += obj.sumSale;
    tableSumAll.sumSaleCard += obj.sumSaleCard;
    tableSumAll.sumSaleCash += obj.sumSaleCash;
    tableSumAll.sumSaleMixed += obj.sumSaleMixed;
    tableSumAll.sumReturn += obj.sumReturn;
    tableSumAll.sumReturnCard += obj.sumReturnCard;
    tableSumAll.sumReturnCash += obj.sumReturnCash;
    tableSumAll.sumReturnMixed += obj.sumReturnMixed;
    tableSumAll.sumAll += obj.sumAll;
    tableSumAll.sumAllCard += obj.sumAllCard;
    tableSumAll.sumAllCash += obj.sumAllCash;
    tableSumAll.sumAllMixed += obj.sumAllMixed;
    tableSumAll.countChecks += obj.countChecks;
    tableSumAll.cashEject += obj.cashEject; 
    tableSumAll.dateStart = obj.dateStart;
    tableSumAll.dateEnd = obj.dateEnd;
    tableSumAll.obj.push(obj);
  }
  catch (err) {
    writeError(err.stack, 'getSummary');
    //console.error('query error', err.stack);
    throw new Error(err);
  }
}

(async () => {
  //console.log(await load('текущий день'));
})();


exports.load = load;