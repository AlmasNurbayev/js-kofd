const fs = require('fs');
const { getJWT, getData, getQuery } = require('./api');

const queryAllKassa = `select organization.bin, organization.name_org, organization.password_kofd, kassa.*  FROM "public".organization
join "public".kassa on "public".kassa.id_organization  = "public".organization.id`;
const queryAllOrganization = `select * FROM "public".organization`;

const myFunc = async () => {
  const listKassa = (await getQuery(queryAllKassa)).rows;
  const listOrg = (await getQuery(queryAllOrganization)).rows;

  for (let i = 0; i < listOrg.length; i++) {
    const el = listOrg[i];
    const jwt = await getJWT(el.bin, el.password_kofd);
    if (!jwt) {
      console.error('Не удалось получить JWT');
    }
    el['jwt'] = jwt;
  }

  // тут дальше делай, что тебе нужно с async/await
};

(async () => {
  await myFunc();
})();
