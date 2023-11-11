import { createRequire } from "module";
import { stringify } from "smol-toml";
import account from "./account.js";

const require = createRequire(import.meta.url);

const yargs = require("yargs");
let argv = yargs
  .option("n", {
    alias: "nohup",
    demandOption: false,
    default: true,
    describe: "启动脚本是否是nohup",
    type: "bool",
  })
  .option("c", {
    alias: "console",
    demandOption: false,
    default: false,
    describe: "启动脚本是否是console",
    type: "bool",
  })
  .option("s", {
    alias: "start",
    demandOption: false,
    default: false,
    describe: "是否初始化立即启动",
    type: "bool",
  })
  .option("u", {
    alias: "unlock",
    demandOption: false,
    default: false,
    describe: "是否启动之后立即解锁所有账号",
    type: "bool",
  })
  .option("v", {
    alias: "validators",
    demandOption: false,
    default: 4,
    describe: "Number of validators to initialize the testnet with (default 4)",
    type: "number",
  })
  .option("cn", {
    alias: "commonNode",
    demandOption: false,
    default: 0,
    describe: "Number of common node to initialize the testnet with (default 0)",
    type: "number",
  })
  .option("m", {
    alias: "mine",
    demandOption: false,
    default: true,
    describe: "是否启动之后开启挖矿",
    type: "bool",
  })
  .boolean(["n", "c", "s", "u", "m"]).argv;

const isNohup = argv.nohup;
const isConsole = argv.console;
const isStart = argv.start;
const isUnlock = argv.unlock;
const isMine = argv.mine;
const commonNode = argv.commonNode;
const validators = argv.validators;
const platform = argv.platform ? argv.platform : process.platform;

const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const Web3 = require("web3");
const exec = util.promisify(require("child_process").exec);
const web3 = new Web3();
const { privateToPublicKey } = account;
const cwd = process.cwd();
const dir = path.join(cwd, "nodes");
const geth = platform == "win32" ? "geth.exe" : "geth";
const scriptStop = path.join(dir, platform == "win32" ? "stopAll.vbs" : "stopAll.sh");
const scriptStart = path.join(dir, platform == "win32" ? "startAll.vbs" : "startAll.sh");
const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

console.log(JSON.stringify(argv));

let init = async function () {
  try {
    // 读取配置文件
    let config = await fs.readJson("./config.json");
    let genesis = config.genesis;
    let cliqueAddress = "";
    let cmd = config.cmd;

    const toml = config.toml;
    const privateKeys = config.privateKeys;
    const nodesCount = commonNode + validators;
    const startRpcPort = toml.Node.HTTPPort;
    const startWSPort = toml.Node.WSPort;
    const startP2pPort = toml.Node.P2P.ListenAddr;
    const startAuthPort = toml.Node.AuthPort;

    if (privateKeys.length < nodesCount) {
      throw "配置文件里面的私钥个数必须大于节点个数";
    }

    console.log("开始清理文件夹nodes");
    if (await fs.pathExists(scriptStop)) {
      console.log("尝试停止nodes目录下面的geth节点");
      await exec(scriptStop, { cwd: dir }); // 不管怎样先执行一下停止
      await sleep(300);
    }
    if (!fs.existsSync(geth)) {
      console.log("开始重新编译geth...");
      let make = await exec("go run build/ci.go install ./cmd/geth", { cwd: path.join(cwd, "..", "..") }); // 重新编译
      console.log("geth编译完毕", make);
    }

    await fs.emptyDir(dir);
    await fs.ensureDir(dir);
    console.log("文件夹nodes已清理完毕");

    let staticNodes = [];
    let keystores = [];
    for (let i = 0; i < privateKeys.length; i++) {
      let account = web3.eth.accounts.create();
      let privateKey = privateKeys[i] || account.privateKey.substr(2);
      let keystore = web3.eth.accounts.encrypt(privateKey, "");
      keystore.privateKey = privateKey;
      genesis.alloc[keystore.address] = { balance: "900000000000000000000000000000" };
      keystores.push(keystore);
    }

    for (let i = 0; i < nodesCount; i++) {
      let keystore = keystores[i];
      let privateKey = keystore.privateKey;
      let keystoreDir = path.join(dir, `node${i + 1}`, `keystore`);
      let nodekeyDir = path.join(dir, `node${i + 1}`, `geth`);
      await fs.ensureDir(keystoreDir);
      for (let i = 0; i < privateKeys.length; i++) {
        await fs.writeJSON(path.join(keystoreDir, `${keystores[i].address}.json`), keystores[i], { spaces: 4 });
      }

      await fs.ensureDir(nodekeyDir);
      await fs.writeFile(path.join(nodekeyDir, `nodekey`), keystore.privateKey);
      if (i < validators) {
        cliqueAddress += keystore.address;
      }

      let publicKey = privateToPublicKey(privateKey);
      let port = startP2pPort + i;
      let enode = `enode://${publicKey}@127.0.0.1:${port}`;
      staticNodes.push(enode);
    }

    // 生成config.toml文件
    for (let i = 0; i < nodesCount; i++) {
      let cfg = JSON.parse(JSON.stringify(toml));
      cfg.Node.DataDir = cfg.Node.DataDir + (i + 1);
      cfg.Node.HTTPPort = startRpcPort + i;
      cfg.Node.WSPort = startWSPort + i;
      cfg.Node.AuthPort = startAuthPort + i;
      cfg.Node.P2P.ListenAddr = ":" + (startP2pPort + i);
      let nodes = staticNodes.filter((item) => item.indexOf(String(startP2pPort + i)) < 0);
      if (nodes.length > 0) {
        cfg.Node.P2P.StaticNodes = nodes;
      }
      await fs.writeFile(path.join(dir, `config${i + 1}.toml`), stringify(cfg));
    }

    // 生成创世块配置文件
    // 设置出块节点
    genesis.timestamp = web3.utils.numberToHex(parseInt(new Date().getTime() / 1000));
    cliqueAddress = "0x" + "0".repeat(64) + cliqueAddress + "0".repeat(130);
    genesis.extraData = cliqueAddress;

    await fs.writeJson(path.join(dir, "genesis.json"), genesis, { spaces: 4 });

    // 创建一个密码文件
    await fs.writeFile(path.join(dir, "pwd"), "");
    await fs.copy(geth, `./nodes/${geth}`);

    // 生成创世块
    let psInits = [];
    for (let i = 0; i < nodesCount; i++) {
      let cmd = (platform == "win32" ? "" : "./") + `${geth} --datadir ./node${i + 1} init ./genesis.json`;
      psInits.push(exec(cmd, { cwd: dir }));
      // const { stdout, stderr } = await exec(cmd, { cwd: dir });
      // console.log(`================Begin init Node${i + 1}================\n${stdout}${stderr}=================End init Node${i + 1}=================\n`);
    }
    await Promise.all(psInits);
    console.log("所有节点初始化完毕");

    // 生成启动命令脚本
    let vbsStart = platform == "win32" ? `set ws=WScript.CreateObject("WScript.Shell")\n` : `#!/bin/bash\n`;
    let vbsStop = platform == "win32" ? `set ws=WScript.CreateObject("WScript.Shell")\n` : `#!/bin/bash\n`;
    for (let i = 1; i <= nodesCount; i++) {
      let httpPort = startRpcPort + i - 1;
      let start, stop;
      if (platform == "win32") start = `${geth} --datadir ./node${i} --config ./config${i}.toml --unlock ${keystores[i - 1].address} --miner.etherbase ${keystores[i - 1].address} --password ./pwd ${cmd} ${i <= validators && isMine ? `--mine` : ""}` + (isConsole ? " console" : "");
      else start = "#!/bin/bash\n" + (isNohup ? "nohup " : "") + "./" + `${geth} --datadir ./node${i} --config ./config${i}.toml --unlock ${keystores[i - 1].address} --miner.etherbase ${keystores[i - 1].address} --password ./pwd ${cmd} ${i <= validators && isMine ? `--mine` : ""}` + (isConsole ? " console" : "") + (isNohup ? ` >./geth${i}.log 2>&1 &` : "");

      if (platform == "linux") stop = `pid=\`netstat -anp | grep :::${httpPort} | awk '{printf $7}' | cut -d/ -f1\`;\nif [ "$pid" != "" ]; then kill -15 $pid; fi`;
      if (platform == "win32") stop = `@echo off\nfor /f "tokens=5" %%i in ('netstat -ano ^ | findstr 0.0.0.0:${httpPort}') do set PID=%%i\ntaskkill /F /PID %PID%`;
      if (platform == "darwin") stop = `pid=\`lsof -i :${httpPort} | grep geth | grep LISTEN | awk '{printf $2}'|cut -d/ -f1\`;\nif [ "$pid" != "" ]; then kill -15 $pid; fi`;

      let startPath = path.join(dir, `start${i}.` + (platform == "win32" ? "bat" : "sh"));
      let stopPath = path.join(dir, `stop${i}.` + (platform == "win32" ? "bat" : "sh"));
      await fs.writeFile(startPath, start);
      await fs.writeFile(stopPath, stop);

      if (platform == "win32") {
        vbsStart += `ws.Run ".\\start${i}.bat",0\n`;
        vbsStop += `ws.Run ".\\stop${i}.bat",0\n`;
        if (i == 1) {
          vbsStart += "timeout /t 1 >nul\n";
        }
      } else {
        vbsStart += `./start${i}.sh\n`;
        vbsStop += `./stop${i}.sh\n`;
        if (i == 1) {
          vbsStart += "sleep 1\n"; // 这里休眠1s是等待p2p端口打开并初始化，否则节点可能没有互连
        }

        await fs.chmod(startPath, 0o777);
        await fs.chmod(stopPath, 0o777);
      }
    }
    // 生成总的启动脚本
    let startAllPath = path.join(dir, `startAll.` + (platform == "win32" ? "vbs" : "sh"));
    let stopAllPath = path.join(dir, `stopAll.` + (platform == "win32" ? "vbs" : "sh"));
    await fs.writeFile(startAllPath, vbsStart);
    await fs.writeFile(stopAllPath, vbsStop);
    if (!(platform == "win32")) {
      await fs.chmod(startAllPath, 0o777);
      await fs.chmod(stopAllPath, 0o777);
    }

    if (isStart) {
      console.log("启动文件夹nodes下面所有节点");
      await exec(scriptStart, { cwd: dir }); // 不管怎样先执行一下停止
    }

    if (isStart && isUnlock) {
      console.log("解锁文件夹nodes下面所有节点账户");
      // await sleep(300);
      // for (let index = 0; index < nodesCount; index++) {
      //   const url = `http://127.0.0.1:${startRpcPort + index}`;
      //   let web3 = new Web3(url);
      //   let accounts = await web3.eth.getAccounts();
      //   for (const address of accounts) {
      //     web3.eth.personal.unlockAccount(address, "", 24 * 3600);
      //   }
      // }
    }
  } catch (error) {
    console.log("error", error);
  }
};

init();
