import { createRequire } from "module";
const require = createRequire(import.meta.url);
const WebSocket = require("ws");
const axios = require("axios");
const Web3 = require("web3");
const web3 = new Web3();
const account = web3.eth.accounts.privateKeyToAccount("0xb6574c96fb846fe7fe012d89893321952259ba5490dbe8dcdb658612adac87b2");
const address = account.address;
const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

(async () => {
  const ws = new WebSocket("ws://127.0.0.1:8546");
  const unconfirmedTxs = `http://127.0.0.1:26657/num_unconfirmed_txs`;
  const TxPoolId = 0;
  const TxId = 1;
  const NonceId = 3;
  const ChainId = 4;

  let txpool = {
    method: "txpool_status",
    jsonrpc: "2.0",
    id: TxPoolId,
    params: [],
  };

  let txRaw = {
    method: "eth_sendRawTransaction",
    jsonrpc: "2.0",
    id: TxId,
    params: [],
  };

  let nonce = {
    jsonrpc: "2.0",
    id: NonceId,
    method: "eth_getTransactionCount",
    params: [address, "latest"],
  };

  let chainId = {
    jsonrpc: "2.0",
    id: ChainId,
    method: "eth_chainId",
    params: [],
  };

  const txpoolStr = JSON.stringify(txpool);
  const nonceStr = JSON.stringify(nonce);
  let startNonce = -1;
  let sendNonce = -1;
  let reply = 0;
  let totalSend = 0;
  let curChainId = -1;
  let errorCount = 0;
  const startTime = parseInt(new Date().getTime() / 1000);
  const maxGap = 10 * 60; // 压测10分钟
  const maxPending = 2000; // 当交易池待上链交易最大数值

  ws.on("open", function open() {
    console.log("connected");
    ws.send(JSON.stringify(chainId));
  });

  ws.on("close", function close() {
    console.log("disconnected");
  });

  ws.on("message", async (data) => {
    data = JSON.parse(data.toString());
    if (data.error) {
      console.log(data.error);
      errorCount++;
      if (errorCount % 100 == 0) {
        ws.close();
      }
    }
    // if (reply % 1000 == 0) {
    //   console.log("reply", reply);
    // }

    if (data.id == TxPoolId) {
      let pending = parseInt(data.result.pending);
      let unTxs = await axios.get(unconfirmedTxs);
      pending = unTxs.data.result.total;
      let send = 0;
      pending != maxPending && console.log(`Unconfirmed Txs ${pending}`);
      if (pending >= maxPending - 100) {
        await sleep(1000);
      }
      // 塞满交易池
      while (maxPending - pending > 0) {
        const transaction = await account.signTransaction({
          gas: 21000,
          gasPrice: 875000000,
          from: address,
          to: "0x00000be6819f41400225702d32d3dd23663dd690",
          value: 1,
          chainId: curChainId,
          nonce: sendNonce,
        });
        txRaw.params[0] = transaction.rawTransaction;
        ws.send(JSON.stringify(txRaw));
        pending++;
        sendNonce++;
        send++;
        totalSend++;
        if (send % 500 == 0) {
          ws.send(nonceStr);
        }
      }
      ws.send(txpoolStr);
    } else if (data.id == NonceId) {
      const nonce = parseInt(data.result);
      if (startNonce < 0) {
        startNonce = nonce;
        sendNonce = nonce;
        ws.send(txpoolStr);
      } else {
        const endTime = parseInt(new Date().getTime() / 1000);
        const gapTime = endTime - startTime;
        const count = nonce - startNonce;
        const tps = parseInt(count / gapTime);
        const replyTps = parseInt(reply / gapTime);
        console.log(`Total Send ${totalSend}, Send Reply ${reply}, Cached Txs ${totalSend - reply}, Tx Reply ${count}, Spend ${gapTime}s, Reply TPS ${replyTps}, TPS ${tps}`);

        // 达到压测时间了，我们结束吧
        if (endTime - startTime > maxGap) {
          ws.close();
        }
      }
    } else if (data.id == ChainId) {
      curChainId = parseInt(data.result);
      ws.send(nonceStr);
    } else {
      // 交易回来的回执不处理
      reply++;
    }
  });
})();
