const { Client } = require('pg');
const fs = require('fs');
const errorAr = [];

fs.unlink("db/errors.txt", (err) => { });
fs.unlink("db/create_result1.txt", (err) => { });
fs.unlink("db/result.txt", (err) => { });

runall();

async function runall() {

     try {
        await runScript('db/create.sql');
        try {
            await runScript('db/insert.sql');
        } 
        catch (err) {
            throw err;
        }
    } catch (err) {
        throw err;
    }

}


async function runScript(path) {
    fs.readFile(path, "utf8", (err, data) => {
        sql = data;
        if (err) {
            writeError(JSON.stringify(err), "read sql-script", path);
            throw err;
        }
        return clientQuery(sql, path).then(res => {
            console.log(path + ":   yes!");
            //console.log(JSON.stringify(res));
        })
            .catch(err => {
                console.log(path + ":    fuck!");
                console.log(err.stack);
            });
        //console.log(path + " === " + clientQuery(sql, path));
    });

}

function writeError(error, point, path) {
    errorAr.push({
        date: new Date(),
        text: error,
        point: point,
        path: path
    });
    fs.writeFileSync('db/errors.txt', JSON.stringify(errorAr), error2 => { console.log("Error write file errors") });
}

async function clientQuery(query, path) {
    
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
        res = await  client.connect();
        try {
            res = await client.query(query);
            fs.writeFile('db/create_result1.txt', JSON.stringify(res), error2 => { });
            return res;
        } catch (err) {
            writeError(JSON.stringify(err.stack), "query", path);
            //console.error('query error', err.stack);
            throw err;
        } finally {
            client.end();
        }
    } catch (err) {
        writeError(JSON.stringify(err.stack), "connect", path);
        //console.error('query error', err.stack);
        client.end();
        throw err;
    } finally {
     
    }


}
