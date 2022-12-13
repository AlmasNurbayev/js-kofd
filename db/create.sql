-- create organization
ALTER SCHEMA "public" OWNER TO ps;
CREATE TABLE "public".organization (
	id smallint PRIMARY KEY,
	BIN varchar,
	name varchar
);
ALTER TABLE "public".organization OWNER TO ps;

-- create kassa
CREATE TABLE "public".kassa (
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
    id_kassa smallint REFERENCES "public".kassa (id)
);
ALTER TABLE "public".transaction OWNER TO ps;