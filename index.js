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

  console.log("1");

  try {
      const response = await axios(config);
      console.log("2");
      console.log(typeof(response));
       let fs = require('fs');
       fs.writeFile('response-post.txt', String(response.data.data.jwt), error2 =>{});
      return String(response.data.data.jwt);
    }
    catch (error) {
      console.log("3");
       let fs = require('fs');
       fs.writeFile('error-post.txt', String(error), error2 =>{});
      return String(error);
    };
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

  let token = getJWT();
  console.log(typeof(token));
  let fs = require('fs');
  fs.writeFile('jwt.txt', String(token), error2 =>{});

  // const config = {
  //   method: "get",
  //   url: 'https://cabinet.kofd.kz/api/operations?skip=0&take=20&cashboxId=33812',
  //   headers: {
  //     "Content-Type": "application/json",
  //     'Authorization': token
  //   },
  //   data: JSON.stringify(data),
  //   httpsAgent: agent,
  // };



  // try {
  //   const res = await axios(config);
  //   console.log(res.data)

  // } catch (error) {
  //   console.log(error);
  //   let fs = require('fs');
  //   fs.writeFile('error-get.txt', JSON.stringify(error), error2 =>{});
  // }
}

console.log(getData());