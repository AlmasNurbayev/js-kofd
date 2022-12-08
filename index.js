const axios = require("axios");
const https = require("https");

async function getJWT() {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const data = {
    credentials: {
      iin: "800727301256",
      password: "Aw31415926!",
    },
    organizationXin: "800727301256",
  };

  const config = {
    method: "post",
    url: "https://cabinet.kofd.kz/api/authenticate/byIinAndPassword",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
  };

  axios(config)
    .then(function (response) {
      let fs = require('fs');
      fs.writeFile('responce.txt', JSON.stringify(response.data.data.jwt), error2 =>{});
      return JSON.stringify(response.data.data.jwt);
    })
    .catch(function (error) {
      return error;
    });
}
//config.headers = {'Authorization': `Bearer ${tokenStr}`}

async function getData() {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const data = {
    credentials: {
      iin: "800727301256",
      password: "Aw31415926!",
    },
    organizationXin: "800727301256",
  };

  let token = `Bearer ${getJWT()}`;
  console.log(token);
  const config = {
    method: "get",
    url: 'https://cabinet.kofd.kz/api/operations?skip=0&take=20&requireTotalCount=true&sort=[{"selector":"operationDate","desc":true}]&cashboxId=33812',
    headers: {
      "Content-Type": "application/json",
      'Authorization': token
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
  };



  try {
    const res = await axios(config);
    console.log(res.data)

  } catch (error) {
    console.log(error);
  }
}

console.log(getData());