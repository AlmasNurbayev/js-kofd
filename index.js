const axios = require("axios");
const https = require("https");

const errorAr = [];

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
//      console.log("2");
      console.log(typeof(response));
      let fs = require('fs');
      fs.writeFile('response-post.txt', JSON.stringify(response.data), error2 =>{});
      if (response.data.data == null) {
        writeError(JSON.stringify(response.data.error), 'getJWT');  
      }
      return String(response.data.data.jwt);
     }
    catch (error) {
      writeError(error, 'getJWT');
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

  let token = "Bearer " + await getJWT();
  console.log(token);
  let fs = require('fs');
  fs.writeFile('jwt.txt', String(token), error2 =>{});

  const config = {
    method: "get",
    url: 'https://cabinet.kofd.kz/api/operations?skip=0&take=40&cashboxId=33812',
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
      "Host": "cabinet.kofd.kz",
      "Connection": "keep-alive"
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
  };

  try {
    const res = await axios(config);
    console.log(res.data)
    if (res.data.error) {
      writeError(JSON.stringify(res.data.error), 'getData');  
    }
    let fs = require('fs');
    fs.writeFile('response-get.txt', JSON.stringify(res.data), error2 =>{});

  } catch (error) {
    writeError(error, 'getData');
  }
}


function writeError(error, point) {
  errorAr.push({
   date: new Date(),
   text: String(error),
   point: point
  });
  let fs = require('fs');
  fs.writeFile('errors.txt', JSON.stringify(errorAr), error2 =>{});
}

console.log(getData());