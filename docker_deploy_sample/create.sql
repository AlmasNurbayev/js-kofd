-- create organization
CREATE TABLE "public".organization (
	id smallint PRIMARY KEY,
	BIN varchar UNIQUE,
	name_org varchar);

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

--create telegram users
CREATE TABLE "public".telegram_users (
    id varchar UNIQUE,
    username varchar);

INSERT INTO "public".organization (id, BIN, name_org)
VALUES
(1, '800727301256', 'ИП Incore'),
(2, '790125400336', 'ИП Solutions (CIPO)');

INSERT INTO "public".kassa (id, snumber, znumber, knumber, name_kassa, id_organization)
VALUES
(1, '010102360873','SWK00426370','34012', 'Incore-Евразия-3', 1),
(2, '010102355028','SWK00426032','33812', 'Incore-Мухамедханова', 1),
(3, '010101724195', 'SWK00402028', '18832', 'Solutions-Евразия-3', 2),
(4, '010101367960', 'SWK00381026', '8247', 'Solutions-Мухамедханова',2);

INSERT INTO "public".telegram_users (id, username)
VALUES
('590285714', 'Almas_Nurbvayev'),
('344432460','Anelya_Nurbayeva');

CREATE TABLE "public".token (
    id SERIAL PRIMARY KEY,
    bin varchar,
    token varchar,
    exp int,
    nbf int,
    working boolean);
