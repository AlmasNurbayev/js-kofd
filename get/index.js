const axios = require("axios");
const https = require("https");
const fs = require("fs");
//const { resolve } = require("path");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const errorAr = [];

async function getJWT(iin, pass, kassa_id) {
  const data = {
    credentials: {
      iin: iin,
      password: pass,
    },
    organizationXin: iin,
  };

  const config = {
    method: "post",
    url: "https://cabinet.kofd.kz/api/authenticate/byIinAndPassword",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(data),
    httpsAgent: agent,
    timeout: 2000
  };

  //console.log("1");

  try {
    const response = await axios(config);
    //      console.log("2");
    console.log(typeof response);
    fs.writeFile(
      "get/response-post.txt",
      JSON.stringify(response.data),
      (error2) => {}
    );
    if (response.data.data == null) {
      writeError(JSON.stringify(response.data.error), "getJWT");
    }
    return response.data.data.jwt;
  } catch (error) {
    writeError(error, "getJWT");
    return String(error);
  }
}
//config.headers = {'Authorization': `Bearer ${tokenStr}`}

async function getData(iin, pass, kassa_id) {
  const token = "Bearer " + (await getJWT(iin, pass, kassa_id));
  fs.writeFile("get/jwt.txt", String(token), (error2) => {});

  const config = {
    method: "get",
    url: `https://cabinet.kofd.kz/api/operations?skip=0&take=2&cashboxId=${kassa_id}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    httpsAgent: agent,
    timeout: 2000
  };

  try {
    const res = await axios(config);
    //console.log(res.data);
    if (res.data.error) {
      writeError(JSON.stringify(res.data.error), "getData");
    }
    fs.writeFile("get/response-get.txt", JSON.stringify(res.data), (error2) => {});
    return res.data;
  } catch (error) {
    writeError(error, "getData");
  }
}

function writeError(error, point) {
  errorAr.push({
    date: new Date(),
    text: String(error),
    point: point,
  });
  fs.writeFile("get/errors.txt", JSON.stringify(errorAr), (error2) => {});
}

// запускать либо так
// (async () => {
//   console.log(await getData("800727301256", "Aw31415926!", "33812"));
// })();

// либо так
 getData("800727301256", "Aw31415926!", "33812").then(res => {
   fs.writeFile("get/response.txt", JSON.stringify(res), (error2) => {});
   console.log(res); // if res.error == constain error
 })
 .catch(err => {
    console.log("4");
    console.log(err);
 })
