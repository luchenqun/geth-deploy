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



