import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const elliptic = require("elliptic");
const secp256k1 = new elliptic.ec("secp256k1"); // eslint-disable-line

const formatPrivateKey = privateKey => {
  if (typeof privateKey != "string") {
    console.error("privateKey shold is string")
    return ""
  }
  // remove "0x"
  privateKey = privateKey.toLowerCase()
  if (privateKey.startsWith("0x")) {
    privateKey = privateKey.substr(2)
  }
  if (privateKey.length != 64) {
    console.error("privateKey length is error")
    return ""
  }
  return privateKey
}

export default  {
  privateToPublicKey : (privateKey) => {
    privateKey = formatPrivateKey(privateKey)
    const buffer = Buffer.from(privateKey, 'hex')
    const ecKey = secp256k1.keyFromPrivate(buffer);
    const publicKey = ecKey.getPublic(false, 'hex').slice(2);
    return publicKey
  }
};