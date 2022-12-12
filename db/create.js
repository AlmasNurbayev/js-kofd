const { Client } = require('pg');
const client = new Client({
    user: 'ps',
    host: 'localhost',
    database: 'kofd',
    password: 'PS31415926',
    port: 5432  
}); 

client.connect();

console.log('1 - create organization');
client.query(`
ALTER SCHEMA "public" OWNER TO ps;

CREATE TABLE "public".organization (
	id smallint NOT NULL,
	"BIN" varchar,
	name varchar,
	CONSTRAINT organization_pk PRIMARY KEY (id)
);
ALTER TABLE "public".organization OWNER TO ps;

CREATE TABLE "public".kassa (
	id smallint,
	snumber varchar,
	znumber varchar,
	knumber varchar,
	name varchar,
	id_organization smallint REFERENCES "public".organization (id)

);
COMMENT ON COLUMN "public".kassa.snumber IS E'serial number, like 010102360873';
COMMENT ON COLUMN "public".kassa.znumber IS E'Zavod number, like SWK00426370';
COMMENT ON COLUMN "public".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
COMMENT ON COLUMN "public".kassa.name IS E'name, like Incore-Евразия-3';
COMMENT ON COLUMN "public".kassa.id_organization IS E'linked table';
ALTER TABLE "public".kassa OWNER TO ps;
`, (err, data) => {
    if (err) 
        throw new Error(err);
    console.log(data, err);
    client.end();  
});

console.log('2 - create kassa');
client.query(`
CREATE TABLE "public".kassa (
	id smallint,
	snumber varchar,
	znumber varchar,
	knumber varchar,
	name varchar,
	id_organization smallint REFERENCES "public".organization (id)

);
COMMENT ON COLUMN "public".kassa.snumber IS E'serial number, like 010102360873';
COMMENT ON COLUMN "public".kassa.znumber IS E'Zavod number, like SWK00426370';
COMMENT ON COLUMN "public".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
COMMENT ON COLUMN "public".kassa.name IS E'name, like Incore-Евразия-3';
COMMENT ON COLUMN "public".kassa.id_organization IS E'linked table';
ALTER TABLE "public".kassa OWNER TO ps;
`, (err, data) => {
    if (err) 
        throw new Error(err);
    console.log(data, err);
    client.end();  
});