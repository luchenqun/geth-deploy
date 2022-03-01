import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require("fs-extra")
const sleep = time => { return new Promise(resolve => setTimeout(resolve, time)); };
const cluster = require('cluster')

let test = async function (maxSleep) {
  maxSleep = maxSleep || 3000
  try {
    let config = await fs.readJson("./config.json")
    let nodesCount = config.pow + config.dpos
    let Web3 = require("web3");
    let randPort = parseInt(Math.random() * 10) % nodesCount
    const url = `http://127.0.0.1:${config.startHttpPort + randPort}`// 随机选择一个节点发送交易
    let web3 = new Web3(url);
    // web3.eth.transactionPollingTimeout = 0.1 // 交易0.1s没有出块就不管了
    console.log("\n连接的节点为：" + url)

    const myTokenBin = "0x60806040526002805460ff19168117905534801561001c57600080fd5b506040516107083803806107088339810160409081528151602080840151928401516060850151928501805190959490940193909291610061916000918701906100d3565b5082516100759060019060208601906100d3565b50600280543361010090810261010060a860020a031960ff90961660ff199093168317959095169490941791829055600a0a919091026004819055919004600160a060020a03166000908152600360205260409020555061016e9050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061011457805160ff1916838001178555610141565b82800160010185558215610141579182015b82811115610141578251825591602001919060010190610126565b5061014d929150610151565b5090565b61016b91905b8082111561014d5760008155600101610157565b90565b61058b8061017d6000396000f3006080604052600436106100985763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166306fdde03811461009d578063095ea7b31461012757806318160ddd1461015f57806323b872dd14610186578063313ce567146101b057806370a08231146101db57806395d89b41146101fc578063a9059cbb14610211578063dd62ed3e14610235575b600080fd5b3480156100a957600080fd5b506100b261025c565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100ec5781810151838201526020016100d4565b50505050905090810190601f1680156101195780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561013357600080fd5b5061014b600160a060020a03600435166024356102ea565b604080519115158252519081900360200190f35b34801561016b57600080fd5b50610174610350565b60408051918252519081900360200190f35b34801561019257600080fd5b5061014b600160a060020a0360043581169060243516604435610356565b3480156101bc57600080fd5b506101c561042f565b6040805160ff9092168252519081900360200190f35b3480156101e757600080fd5b50610174600160a060020a0360043516610438565b34801561020857600080fd5b506100b2610453565b34801561021d57600080fd5b5061014b600160a060020a03600435166024356104ad565b34801561024157600080fd5b50610174600160a060020a0360043581169060243516610534565b6000805460408051602060026001851615610100026000190190941693909304601f810184900484028201840190925281815292918301828280156102e25780601f106102b7576101008083540402835291602001916102e2565b820191906000526020600020905b8154815290600101906020018083116102c557829003601f168201915b505050505081565b336000818152600560209081526040808320600160a060020a038716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a350600192915050565b60045490565b600160a060020a03831660009081526003602052604081205482111561037857fe5b600160a060020a03841660009081526005602090815260408083203384529091529020548211156103a557fe5b600160a060020a0380851660008181526005602090815260408083203384528252808320805488900390558383526003825280832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060019392505050565b60025460ff1681565b600160a060020a031660009081526003602052604090205490565b60018054604080516020600284861615610100026000190190941693909304601f810184900484028201840190925281815292918301828280156102e25780601f106102b7576101008083540402835291602001916102e2565b336000908152600360205260408120548211156104c657fe5b33600081815260036020908152604080832080548790039055600160a060020a03871680845292819020805487019055805186815290519293927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a350600192915050565b600160a060020a039182166000908152600560209081526040808320939094168252919091522054905600a165627a7a7230582069b9bcaaa189f26441a3086ad230c7a20431d51a835956966423fc76a4ce75d10029"
    const myTokenAbiStr = "[{\"constant\":true,\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"guy\",\"type\":\"address\"},{\"name\":\"wad\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"src\",\"type\":\"address\"},{\"name\":\"dst\",\"type\":\"address\"},{\"name\":\"wad\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"name\":\"\",\"type\":\"uint8\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"src\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"dst\",\"type\":\"address\"},{\"name\":\"wad\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"src\",\"type\":\"address\"},{\"name\":\"guy\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"n\",\"type\":\"string\"},{\"name\":\"s\",\"type\":\"string\"},{\"name\":\"d\",\"type\":\"uint8\"},{\"name\":\"supply\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"}]";

    // 获取所有keystore下面的账号(必须保住有一个账号)
    let accounts = await web3.eth.getAccounts()
    if (accounts.lenght == 0) {
      console.log("keystore 下面没有账号")
    }

    const account1 = accounts[0]; // 账号用来部署合约数据
    const account2 = accounts[1] || "0xf5b6d59af9ff6ca8cbad8b955c3a329ece886533";  // 随机一个账号
    const from = accounts[0];

    const myTokenAbi = JSON.parse(myTokenAbiStr);

    // 燃料消耗限制
    let options = {
      "gas": 8000000,
      "gasPrice": 2000000000,
      "from": from
    };

    // 返回的公用结果
    let ret;

    // // 查看账号含有的代币数量
    // const balanceOfAccounts = async function () {
    //   for (let account of accounts) {
    //     let balanceOfMethod = contract.methods["balanceOf"].apply(contract.methods, [account]);
    //     let balance = await balanceOfMethod.call({ "from": account });
    //     balance > 0 && console.log(`账号 ${account} 含有的代币数量：${balance}`);
    //   }
    // }

    // // 实例化合约
    // let contract = new web3.eth.Contract(myTokenAbi);

    // // 部署合约
    // ret = await contract.deploy({ data: myTokenBin, arguments: ["HelloWorld", "HW", 0, "10000000"] }).send(options)
    // contract.options.address = ret._address
    // console.log(`合约部署成功，地址为：${ret._address}\n`);

    // // 查看代币名称
    // let nameMethod = contract.methods["name"].apply(contract.methods, []);
    // let name = await nameMethod.call({ "from": from });
    // console.log(`代币名称：${name}`);

    // // 查看代币符号
    // let symbolMethod = contract.methods["symbol"].apply(contract.methods, []);
    // let symbol = await symbolMethod.call({ "from": from });
    // console.log(`代币符号：${symbol}`);

    // // 查看小数点位
    // let decimalsMethod = contract.methods["decimals"].apply(contract.methods, []);
    // let decimals = await decimalsMethod.call({ "from": from });
    // console.log(`小数点位：${decimals}`);

    // // 查看总供应量
    // let totalSupplyMethod = contract.methods["totalSupply"].apply(contract.methods, []);
    // let totalSupply = await totalSupplyMethod.call({ "from": from });
    // console.log(`代币总供应量：${totalSupply}\n`);

    // // 查看账号含有的代币数量
    // console.log("=======================查看账号含有的代币数量=======================");
    // await balanceOfAccounts();
    // console.log();

    // // 测试代币转账
    // const transferValue = 10000;
    // console.log(`测试账号 ${account1} 给账号 ${account2} 转数量为 ${transferValue} 的代币`)
    // let transferMethod = contract.methods["transfer"].apply(contract.methods, [account2, transferValue]);
    // options.from = account1;
    // ret = await transferMethod.send(options);
    // console.log(`blockNumber: ${ret.blockNumber}, blockHash: ${ret.blockHash}`);
    // console.log();

    // // 查看账号含有的代币数量
    // console.log("=======================查看账号含有的代币数量=======================");
    // await balanceOfAccounts();
    // console.log();

    // 测试原生转币
    console.log(`测试账号 ${account1} 给账号 ${account2} 转数量为 1 的原生币`)
    web3.eth.sendTransaction({
      from,
      to: account2,
      value: 1,
      // gas: 8000000,
      // gasPrice: 2000000000,
    }) // 这里不等待上链，因为很多交易同时发送，nonce如果一致，需要等待很长时间才能返回
    await sleep(100) // 等待100ms让上面的交易上链
    let balance = await web3.eth.getBalance(account2)
    console.log(`账号 ${account2} 原生币数量为 ${balance}`)

    // 验证多节点高度与世界树是否一致
    let stateRoot = ""
    let maxBlockNumber = -1
    let maxHttpPort = -1
    console.log(`总节点数目为${nodesCount}个`)
    for (let index = 0; index < nodesCount; index++) {
      const httpPort = config.startHttpPort + index
      let web3 = new Web3(`http://127.0.0.1:${httpPort}`);
      let blockNumber = await web3.eth.getBlockNumber()
      let block = await web3.eth.getBlock(blockNumber)
      console.log(`节点${index + 1} http port 为 ${httpPort} 的当前区块高度为 ${blockNumber}，世界树为 ${block.stateRoot}`)
      if (blockNumber > maxBlockNumber) {
        maxBlockNumber = blockNumber
        maxHttpPort = httpPort
        stateRoot = block.stateRoot
      }
    }

    console.log(`区块最高高度为 ${maxBlockNumber}，对应的世界树为 ${stateRoot}`)

    let perSleep = 100
    let curSleep = 0
    while (true) {
      let ret = true
      let successCount = 0
      for (let index = 0; index < nodesCount; index++) {
        const httpPort = config.startHttpPort + index
        if (maxHttpPort == httpPort) {
          continue
        }
        let web3 = new Web3(`http://127.0.0.1:${httpPort}`);
        let blockNumber = await web3.eth.getBlockNumber()
        let block = await web3.eth.getBlock(blockNumber)
        if (blockNumber < maxBlockNumber) {
          ret = false
          break
        } else if (blockNumber == maxBlockNumber) {
          if (stateRoot != block.stateRoot) {
            console.log(`世界树不一致，直接退出。 ${blockNumber}期望为${stateRoot}，实际为 ${maxBlockNumber}:${block.stateRoot}`)
            return false
          }
        } else {
          successCount++ // 已经同步到前面去了
          if (successCount == nodesCount - 1) {
            return true
          }
        }
      }
      if (ret) {
        console.log("节点区块同步完毕")
        return ret
      } else {
        await sleep(perSleep)
        curSleep += perSleep
        if (curSleep > maxSleep) {
          console.log(`已等待${curSleep}毫秒还是没同步，同步失败`)
          return false
        }
      }
    }

  } catch (error) {
    // console.error("error", error)
  }
  return false

};

(async () => {
  const numCPUs = require('os').cpus().length
  console.log("numCPUs", numCPUs)
  if (cluster.isMaster) {
    console.log("cluster.Master")
    let successCount = 0
    let failCount = 0
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork()
      worker.on('message', (success) => {
        console.log("workd ret", success)
        if (success) {
          successCount++
        } else {
          failCount++
        }
        if (successCount + failCount == numCPUs) {
          console.log("all finished", "successCount", successCount, "failCount", failCount)
        }
        worker.kill()
      })
    }
    cluster.on('exit', function (worker, code, signal) {
      console.log('worker ' + worker.process.pid + ' died')
    })
  } else {
    try {
      let count = 100     // 执行多少次
      let maxSleep = 3000 // 每次等待多久(单位ms)让链同步区块
      let success = true
      console.log("cluster.Worker")
      console.log("start....")
      while (count > 0) {
        success = await test(maxSleep)
        if (!success) {
          break
        }
        count--
      }
      console.log("end....")
      process.send(success)
    } catch (error) {
      process.send(false)
    }
  }
})()