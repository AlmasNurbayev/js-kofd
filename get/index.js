const fs = require('fs');
const { getJWT, getData, getQuery } = require('./api');

const queryAllKassa = `select organization.bin, organization.name_org, organization.password_kofd, kassa.*  FROM "public".organization
join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
const queryAllOrganization = `select * FROM "public".organization`;

const myFunc = async () => {
  const res = await Promise.all([getQuery(queryAllKassa), getQuery(queryAllOrganization)]);
  const listKassa = res[0].rows;
  const listOrg = res[1].rows;

  const arrJWT = [];
  for (let i = 0; i < listOrg.length; i++) {
    const el = listOrg[i];
    arrJWT.push(await getJWT(el.bin, el.password_kofd));
  }

  // тут дальше делай, что тебе нужно с async/await
};

(async () => {
  await myFunc();
})();
