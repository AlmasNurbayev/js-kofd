// const playwright = require('playwright');



// async function main() {
//     // Open a Chromium browser. We use headless: false
//     // to be able to watch what's going on.
//     const browser = await playwright.chromium.launch({
//         headless: false
//     });
//     // Open a new page / tab in the browser.
//     const page = await browser.newPage({
//         bypassCSP: true, // This is needed to enable JavaScript execution on GitHub.
//     });
//     // Tell the tab to navigate to the JavaScript topic page.
//     await page.goto('https://cabinet.kofd.kz/auth/login');
//     // Pause for 10 seconds, to see what's going on.

//     await page.fill('input[name="iin"]', "800727301256");
//     await page.fill('input[name="password"]', "Aw31415926!");
//     await page.click('button[class="btn-primary"]');
//     await page.waitForTimeout(2000);
//     await page.goto('https://cabinet.kofd.kz/cabinet/cashboxes/33812/operations');
//     await page.waitForTimeout(8000);

   

//     // Turn off the browser to clean up after ourselves.
//     //await browser.close();
// }

// main();

console.log('Hello1');

let axios = require('axios');
let data = JSON.stringify({
  "credentials": {
    "iin": "800727301256",
    "password": "Aw31415926!"
  },
  "organizationXin": "800727301256"
});

let config = {
  method: 'post',
  url: 'https://cabinet.kofd.kz/api/authenticate/byIinAndPassword',
  headers: { 
    'Connection': 'keep-alive', 
    'Content-Type': 'application/json', 
    'Locale': 'ru-KZ'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log('=================== start of responce');
  console.log(JSON.stringify(response.data));
  console.log('=================== end of responce');
  fs.writeFile('responce.txt', JSON.stringify(response.data),error2 => {});
})
.catch(function (error) {
    console.log('=================== start of error');
  console.log(error);
  console.log('=================== end of error');
  let fs = require('fs');
  fs.writeFile('error.txt', JSON.stringify(error),error2 => {});
});
  


// let get = {
//     method: 'get',
//     url: 'https://cabinet.kofd.kz/api/operations?skip=0&take=20&requireTotalCount=true&sort=%5B%7B%22selector%22%3A%22operationDate%22%2C%22desc%22%3Atrue%7D%5D&cashboxId=33812',
//     headers: { 
//       'Connection': 'keep-alive', 
//       'Content-Type': 'application/json', 
//       'Locale': 'ru-KZ'
//     },
//     data : data
//   };
  
  

//   axios(get)
//   .then(function (response) {
//     console.log(JSON.stringify(response.data));
//   })
//   .catch(function (error) {
//     console.log(error);
//   });