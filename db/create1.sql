CREATE DATABASE kofd;

CREATE SCHEMA "Schema1";
ALTER SCHEMA "Schema1" OWNER TO ps;

CREATE TABLE "Schema1".kassa (
	id smallint,
	snumber varchar,
	znumber varchar,
	knumber varchar,
	name varchar,
	id_organization smallint REFERENCES "Schema1".organization (id)

);
COMMENT ON COLUMN "Schema1".kassa.snumber IS E'serial number, like 010102360873';
COMMENT ON COLUMN "Schema1".kassa.znumber IS E'Zavod number, like SWK00426370';
COMMENT ON COLUMN "Schema1".kassa.knumber IS E'Inhouse number KOFD. 5 numbers, like 34012';
COMMENT ON COLUMN "Schema1".kassa.name IS E'name, like Incore-Евразия-3';
COMMENT ON COLUMN "Schema1".kassa.id_organization IS E'linked table';
ALTER TABLE "Schema1".kassa OWNER TO ps;


-- DROP TABLE IF EXISTS "Schema1".organization CASCADE;
CREATE TABLE "Schema1".organization (
	id smallint NOT NULL,
	"BIN" varchar,
	name varchar,
	CONSTRAINT organization_pk PRIMARY KEY (id)
ALTER TABLE "Schema1".organization OWNER TO ps;



