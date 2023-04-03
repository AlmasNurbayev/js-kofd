-- create organization
ALTER SCHEMA "public" OWNER TO ps;
CREATE TABLE "public".organization (
	id smallint PRIMARY KEY,
	BIN varchar UNIQUE,
	name_org varchar);
ALTER TABLE "public".organization OWNER TO ps;

-- create kassa
CREATE TABLE "public".kassa (
    id smallint PRIMARY KEY,
    snumber varchar UNIQUE,
    znumber varchar,
    knumber varchar UNIQUE,
    name_kassa varchar,
    id_organization smallint REFERENCES "public".organization (id));
COMMENT ON COLUMN "public".kassa.snumber IS E'serial number, like 010102360873';
COMMENT ON COLUMN "public".kassa.znumber IS E'Zavod number, like SWK00426370';
COMMENT ON COLUMN "public".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
COMMENT ON COLUMN "public".kassa.name_kassa IS E'name, like Incore-EU-3';
COMMENT ON COLUMN "public".kassa.id_organization IS E'linked table';
ALTER TABLE "public".kassa OWNER TO ps;

-- create transaction
CREATE TABLE "public".transaction (
    id varchar UNIQUE,
    onlineFiscalNumber varchar,
    offlineFiscalNumber varchar,
    systemDate timestamptz,
    operationDate timestamptz,
    type_operation smallint,
    subType smallint,
    sum_operation numeric,
    availableSum numeric,
    paymentTypes varchar,
    shift smallint,
    uploadDate timestamptz,
    id_organization smallint REFERENCES "public".organization (id),
    id_kassa smallint REFERENCES "public".kassa (id));
ALTER TABLE "public".transaction OWNER TO ps;

--create telegram users
CREATE TABLE "public".telegram_users (
    id varchar UNIQUE,
    username varchar);
ALTER TABLE "public".telegram_users OWNER TO ps;

CREATE TABLE "public".token (
    id SERIAL PRIMARY KEY,
    bin varchar,
    token varchar,
    exp int,
    nbf int,
    working boolean);