## 背景
在测试p2p广播消息的时候，我需要创建至少16个节点，来验证消息的广播。创建多节点，需要经历如下几个步骤：
* 配置genesis.json文件
* 根据genesis.json创建创世块
* 启动节点
* 找到各个节点的enode，使用RPC命令admin_addPeer将节点互联起来
整个过程非常繁琐费力而且容易出错。为了简化此操作，我写了一套脚本，将上面所有的操作都自动化。无论搭建多少个节点(以我搭建32个为例，太多节点机器性能不够无法运转了)，让你能在不到一分钟内完成上面所有的操作。

## 注意
注意：目前只支持windows/linux系统。如果需要其他系统的，需要做一下适配。

## 使用步骤
* 安装Node.js，安装v14.x版本。
* 在项目目录执行npm install安装依赖。
* 将你编译好的geth重命名为geth.exe放到项目根目录。
* config.default.json为蓝本，将内容复制一份到新建的文件config.json里面。你更新一下配置。genesis中extraData与alloc我会进行覆盖。配置文件字段见后续说明。
* 执行 npm run init 初始化。
* 执行 npm run start 启动所有节点。
* 执行 npm run stop 停止所有节点。

## config.json
```js
{
  "pow": 0, // pow节点的个数
  "dpos": 4, // dpos节点的个数(目前为clique节点个数)
  "startHttpPort": 40000, // 节点开始的http rpc端口
  "startP2pPort": 30000,   // 节点开始的p2p端口
  "cmd": " --ipcdisable --gcmode archive --cache.snapshot 0 --networkid 1337 --nodiscover --http.api eth,net,web3,personal,admin,miner,txpool,clique,debug --log.debug --verbosity 5 --dev.period 0 --allow-insecure-unlock --mine --miner.threads 1 --log.debug "， // 命令的一部分，拼接到命令 ${geth} --datadir ./node${i} --syncmode full ${cmd} --http --http.corsdomain "*" --http.addr 0.0.0.0 --http.port ${httpPort} --port ${p2pPort} --unlock "0" --password ./pwd --consensus ${i <= config.dpos ? 'dpos' : 'pow'} >./node${i}/geth.log 2>&1 中。其中 ${cmd} 就是此处设置的cmd
  "genesis": {
    "config": {
      "chainId": 11338,
      "homesteadBlock": 0,
      "eip150Block": 0,
      "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "eip155Block": 0,
      "eip158Block": 0,
      "byzantiumBlock": 0,
      "constantinopleBlock": 0,
      "petersburgBlock": 0,
      "istanbulBlock": 0,
      "clique": {
        "period": 0,
        "epoch": 30000
      }
    },
    "nonce": "0x0",
    "timestamp": "0x612883a3",
    "extraData": "0x00000000000000000000000000000000000000000000000000000000000000009ae5c0f24355ca814c0c99d7ee9637ec005fae18b3b1a10f515740ecf805c31c5c612935d60ba5eb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "gasLimit": "0x47b76000000",
    "difficulty": "0x1",
    "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "alloc": {},
    "number": "0x0",
    "gasUsed": "0x0",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "baseFeePerGas": null
  }
}
```



