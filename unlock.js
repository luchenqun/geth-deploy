import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require("fs-extra")
const Web3 = require("web3");
let unlock = async function () {
  try {

    let config = await fs.readJson("./config.json")
    let nodesCount = config.commonNode + config.authorityNode
    for (let index = 0; index < nodesCount; index++) {
      const url = `http://127.0.0.1:${config.startRpcPort + index}`
      let web3 = new Web3(url);
      let accounts = await web3.eth.getAccounts()
      if (accounts.lenght == 0) {
        console.log("keystore 下面没有账号")
      }
      for (const address of accounts) {
        web3.eth.personal.unlockAccount(address, "", 24 * 3600)
      }
    }
  } catch (error) {
    console.log(error)
  }
};

(async () => {
  await unlock()
})()






