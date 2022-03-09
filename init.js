import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require("fs-extra")
const path = require("path")
const Web3 = require('web3');
const web3 = new Web3();
import account from './account.js';
const { privateToPublicKey } = account
const cwd = process.cwd()
const dir = path.join(cwd, "nodes");
const windows = process.platform == "win32"
const geth = windows ? "geth.exe" : "geth"
const script = path.join(dir, process.platform == "win32" ? "stopAll.vbs" : "stopAll.sh");
const sleep = time => {
  return new Promise(resolve => setTimeout(resolve, time));
};

// 固定一批私钥方便测试
const privateKeys = [
  "f78a036930ce63791ea6ea20072986d8c3f16a6811f6a2583b0787c45086f769", // 0x00000be6819f41400225702d32d3dd23663dd690
  "95e06fa1a8411d7f6693f486f0f450b122c58feadbcee43fbd02e13da59395d5", // 0x1111102dd32160b064f2a512cdef74bfdb6a9f96
  "322673135bc119c82300450aed4f29373c06926f02a03f15d31cac3db1ee7716", // 0x2222207b1f7b8d37566d9a2778732451dbfbc5d0
  "09100ba7616fcd062a5e507ead94c0269ab32f1a46fe0ec80056188976020f71", // 0x33333bffc67dd05a5644b02897ac245baed69040
  "5352cfb603f3755c71250f24aa1291e85dbc73a01e9c91e7568cd081b0be04db", // 0x4444434e38e74c3e692704e4ba275dae810b6392
  "f3d9247d078302fd876462e2036e05a35af8ca6124ba1a8fd82fc3ae89b2959d", // 0x55555d6c72886e5500a9410ca15d08a16011ed95
  "39cfe0662cdede90094bf079b339e09e316b1cfe02e92d56a4d6d95586378e38", // 0x666668f2a2e38e93089b6e6a2e37c854bb6db7de
  "a78e6fe4fe2c66a594fdd639b39bd0064d7cefbbebf43b57de153392b0f4e30c", // 0x77777295eee9b2b4da75ac0f2d3b14b20b5883da
  "7df4c6f61a6b83b3f8e0eb299033d016e077a51162427c1786c53a18cc3b5bd1", // 0x8888834da5fa77577e8a8e4479f51f7210a5f95e
  "75e4125b9c2bb9f203c637d9f4312471b741b6ac15760e36c18e437a035272d2", // 0x999992ab64f24f09aaa225b85556a48ab52ae7c6
  "0605636f02e29f93405e71c6923480d1c25cba3d0b102032947593b06c541c82", // 0xaaaaaccef17c7a366bd61aeef9a9d2cc5026d40a
  "318dedc70c1bf4942c0e4a885f2f059833912db4bc145216f23fceb492eff9d3", // 0xbbbbbd5877dc1891f273eb49abedc0e8fcc1fb1c
  "0c27877900e26e16061d04730addcd2aa5dbcb7e1e1721a5f9d7300a3beece3d", // 0xccccc39a07ebcc6f302edc2157604d1d86baba48
  "41601b4909dbe65ab4528ebdd691aa1c50d1e26ab8b87154e999b2691af9ad20", // 0xddddd5a2836f327c397f3e119ee77ebd00dd567b
  "03012804714caf41d1fa61c3677699b3dfa08adb9d89075cecd2eb4649669c19", // 0xeeeee5d1d01f99d760f9da356e683cc1f29f2f81
  "b5383875512d64281acfb81cc37a95b0ddc00b235a3aa60cf8b4be25a3ba8fe5", // 0xfffff01adb78f8951aa28cf06ceb9b8898a29f50
]

let init = async function () {
  try {
    // 读取配置文件
    let config = await fs.readJson("./config.json")
    let genesis = config.genesis
    let cliqueAddress = "";

    let startRpcPort = config.startRpcPort
    let startP2pPort = config.startP2pPort
    let cmd = config.cmd

    console.log("开始清理文件夹nodes")
    if (await fs.pathExists(script)) {
      await exec(script, { cwd: dir }) // 不管怎样先执行一下停止
      await sleep(300)
    }
    if (!fs.existsSync(geth)) {
      console.log("开始重新编译geth...")
      let make = await exec("go run build/ci.go install ./cmd/geth", { cwd: path.join(cwd, "..", "..") }) // 重新编译
      console.log("geth编译完毕", make)
    }

    await fs.emptyDir(dir)
    await fs.ensureDir(dir)
    console.log("文件夹nodes已清理完毕")

    let staticNodes = []
    let keystores = []
    for (let i = 0; i < privateKeys.length; i++) {
      let account = web3.eth.accounts.create();
      let privateKey = privateKeys[i] || account.privateKey.substr(2)
      let keystore = web3.eth.accounts.encrypt(privateKey, "");
      keystore.privateKey = privateKey
      genesis.alloc[keystore.address] = { balance: "900000000000000000000000000000" }
      keystores.push(keystore)
    }

    let nodesCount = config.commonNode + config.authorityNode
    for (let i = 0; i < nodesCount; i++) {
      let keystore = keystores[i]
      let privateKey = keystore.privateKey
      let keystoreDir = path.join(dir, `node${i + 1}`, `keystore`);
      let nodekeyDir = path.join(dir, `node${i + 1}`, `geth`);
      await fs.ensureDir(keystoreDir)
      for (let i = 0; i < privateKeys.length; i++) {
        await fs.writeJSON(path.join(keystoreDir, `${keystores[i].address}.json`), keystores[i], { spaces: 4 })
      }

      await fs.ensureDir(nodekeyDir)
      await fs.writeFile(path.join(nodekeyDir, `nodekey`), keystore.privateKey)
      if (i < config.authorityNode) {
        cliqueAddress += keystore.address
      }

      let publicKey = privateToPublicKey(privateKey)
      let port = config.startP2pPort + i
      let enode = `enode://${publicKey}@127.0.0.1:${port}`
      staticNodes.push(enode)
    }

    // 生成static-nodes.json文件
    for (let i = 0; i < nodesCount; i++) {
      let port = config.startP2pPort + i
      let nodes = staticNodes.filter(item => item.indexOf(String(port)) < 0)
      if (nodes.length > 0) {
        let staticNodesPath = path.join(dir, `node${i + 1}`, `static-nodes.json`)
        await fs.writeJson(staticNodesPath, nodes, { spaces: 4 })
      }
    }

    // 生成创世块配置文件
    // 设置出块节点
    genesis.timestamp = web3.utils.numberToHex(parseInt(new Date().getTime() / 1000))
    cliqueAddress = "0x" + "0".repeat(64) + cliqueAddress + "0".repeat(130)
    genesis.extraData = cliqueAddress

    await fs.writeJson(path.join(dir, "genesis.json"), genesis, { spaces: 4 })

    // 创建一个密码文件
    await fs.writeFile(path.join(dir, "pwd"), "")
    await fs.copy(geth, `./nodes/${geth}`)

    // 生成创世块
    for (let i = 0; i < nodesCount; i++) {
      let cmd = (windows ? "" : "./") + `${geth} --datadir ./node${i + 1} init ./genesis.json`
      const { stdout, stderr } = await exec(cmd, { cwd: dir });
      console.log(`================Begin init Node${i + 1}================\n${stdout}${stderr}=================End init Node${i + 1}=================\n`);
    }

    // 生成启动命令脚本
    let vbsStart = windows ? `set ws=WScript.CreateObject("WScript.Shell")\n` : `#!/bin/bash\n`
    let vbsStop = windows ? `set ws=WScript.CreateObject("WScript.Shell")\n` : `#!/bin/bash\n`
    for (let i = 1; i <= nodesCount; i++) {
      let httpPort = startRpcPort + i - 1
      let p2pPort = startP2pPort + i - 1
      let start1 = (windows ? "" : "#!/bin/bash\n nohup ./") + `${geth} --datadir ./node${i} --unlock ${keystores[i - 1].address} --password ./pwd ${cmd} --ws.port ${httpPort} --http.port ${httpPort} --port ${p2pPort} ${i <= config.authorityNode ? `--mine --miner.threads 1` : ''} >./node${i}/geth.log 2>&1 &`
      let start2 = (windows ? "" : "#!/bin/bash\n ./") + `${geth} --datadir ./node${i} --unlock ${keystores[i - 1].address} --password ./pwd ${cmd} --ws.port ${httpPort} --http.port ${httpPort} --port ${p2pPort} ${i <= config.authorityNode ? `--mine --miner.threads 1` : ''} console`
      let stop = windows ? `@echo off
for /f "tokens=5" %%i in ('netstat -ano ^| findstr 0.0.0.0:${httpPort}') do set PID=%%i
taskkill /F /PID %PID%` : `pid=\`netstat -anp|grep :::${httpPort} |awk '{printf $7}'|cut -d/ -f1\`;
kill -15 $pid`
      let startPath = path.join(dir, `start${i}.` + (windows ? "bat" : "sh"));
      let stopPath = path.join(dir, `stop${i}.` + (windows ? "bat" : "sh"));
      await fs.writeFile(startPath, windows ? start2 : start1)
      await fs.writeFile(stopPath, stop)

      if (windows) {
        vbsStart += `ws.Run ".\\start${i}.bat",0\n`
        vbsStop += `ws.Run ".\\stop${i}.bat",0\n`
      } else {
        vbsStart += `./start${i}.sh\n`
        vbsStop += `./start${i}.sh\n`

        await fs.chmod(startPath, 0o777);
        await fs.chmod(stopPath, 0o777);
      }
    }
    // 生成总的启动脚本
    let startAllPath = path.join(dir, `startAll.` + (windows ? "vbs" : "sh"));
    let stopAllPath = path.join(dir, `stopAll.` + (windows ? "vbs" : "sh"));
    await fs.writeFile(startAllPath, vbsStart)
    await fs.writeFile(stopAllPath, vbsStop)
    if (!windows) {
      await fs.chmod(startAllPath, 0o777);
      await fs.chmod(stopAllPath, 0o777);
    }
  } catch (error) {
    console.log("error", error)
  }
}

init()
