import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require("fs-extra")
const sleep = time => { return new Promise(resolve => setTimeout(resolve, time)); };
const Web3 = require("web3");
let simple = async function () {
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
      let from = accounts[0]
      let to = web3.eth.accounts.create().address
      // console.log(`测试账号 ${from} 给账号 ${to} 转数量为 1 的原生币`)
      web3.eth.sendTransaction({
        from,
        to,
        value: 1
      }) // 这里不等待上链，因为很多交易同时发送，nonce如果一致，需要等待很长时间才能返回
    }

    // 等待一段时间等上链
    await sleep(config.genesis.config.clique.period * 1000 + 100)

    let minBlockNumber = Number.MAX_SAFE_INTEGER
    let maxBlockNumber = -1
    let numbers = []
    for (let index = 0; index < nodesCount; index++) {
      const url = `http://127.0.0.1:${config.startRpcPort + index}`
      let web3 = new Web3(url);
      let blockNumber = await web3.eth.getBlockNumber()
      numbers.push(blockNumber)
      if (blockNumber < minBlockNumber) {
        minBlockNumber = blockNumber
      }
      if (blockNumber > maxBlockNumber) {
        maxBlockNumber = blockNumber
      }
    }

    if (maxBlockNumber > 0 && maxBlockNumber % 100 == 0) {
      console.log(JSON.stringify(numbers))
    }
    console.log(JSON.stringify(numbers))

    if (maxBlockNumber < 0) {
      return Number.MIN_SAFE_INTEGER
    } else {
      return maxBlockNumber - minBlockNumber
    }

  } catch (error) {
    return Number.MAX_SAFE_INTEGER
  }
};

(async () => {
  let count = 0
  while (true) {
    let gap = await simple()
    if (count % 100 == 0) {
      console.log("count = ", count)
    }
    if (gap == Number.MAX_SAFE_INTEGER || gap >= 10) {
      break
    }
    count++
  }
})()




