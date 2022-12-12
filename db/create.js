const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];
const sql = [];



sql.push({
    desciption: 'create organization',
    status: false,
    sql: `
    ALTER SCHEMA "public" OWNER TO ps;
    
    CREATE TABLE "public".organization (
        id smallint PRIMARY KEY,
        BIN varchar,
        name varchar
    );
    ALTER TABLE "public".organization OWNER TO ps;
    `,
});

sql.push({
    desciption: 'create kassa',
    status: false,
    sql: `CREATE TABLE "public".kassa (
        id smallint PRIMARY KEY,
        snumber varchar,
        znumber varchar,
        knumber varchar,
        name varchar,
        id_organization smallint REFERENCES "public".organization (id)
    );
    COMMENT ON COLUMN "public".kassa.snumber IS E'serial number, like 010102360873';
    COMMENT ON COLUMN "public".kassa.znumber IS E'Zavod number, like SWK00426370';
    COMMENT ON COLUMN "public".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
    COMMENT ON COLUMN "public".kassa.name IS E'name, like Incore-EU-3';
    COMMENT ON COLUMN "public".kassa.id_organization IS E'linked table';
    ALTER TABLE "public".kassa OWNER TO ps;
    `,
});

sql.push({
    desciption: 'create transaction',
    status: false,
    sql: `CREATE TABLE "public".transaction (
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
        id_kassa smallint REFERENCES "public".kassa (id)
    );
    ALTER TABLE "public".kassa OWNER TO ps;
    `,
});

megascript = ' ';
sql.forEach((item) => {
    megascript = megascript + String(item.sql);

    //clientQuery(item);
})

clientQuery(megascript);

function writeError(error, point) {
    errorAr.push({
        date: new Date(),
        text: String(error),
        point: point
    });
    fs.writeFile('db/errors.txt', JSON.stringify(errorAr), error2 => { });
}

async function clientQuery(item) {
    let client = new Client({
        user: 'ps',
        host: 'localhost',
        database: 'kofd',
        password: 'PS31415926',
        connectionTimeoutMillis: 5000,
        query_timeout: 2000,
        idle_in_transaction_session_timeout: 2000,
        port: 5432
    });

    await client.connect()
        .then((result) => {
            client.query(item);
            console.log("1");
            console.log(result);
            //fs.writeFile('db/create_result1.txt', String(result), error2 => { });
        })
        .catch(err => {
            console.log("3");
            console.log('connection error');
            console.log(err);
            writeError('connection error' & " ===== " & JSON.stringify(err))
                .then(result => {
                    console.log("2");
                    console.log(result);
                    fs.writeFile('db/create_result2.txt', JSON.stringify(result), error2 => { });
                })
                .catch((e) => {
                    console.log("4");
                    console.log('query error');
                    console.log(e);
                    writeError('query error' & " ===== " & JSON.stringify(e))
                    //item.status = true;
                })
                .finally(() => {
                    //client.end();
                    console.log("6");
                })
        })
        .finally(() => {
            client.end();
            console.log("5");
        });



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
}

// sql.forEach((item) => {
//     if (item.status) {
//         console.log('found error in ' & String(item.desciption));
//     }
// });