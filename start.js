import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require("path")
const dir = path.join(process.cwd(), "nodes");
const script = path.join(dir, process.platform == "win32" ? "startAll.vbs" : "startAll.sh");

let start = async function () {
  try {
    const { stdout, stderr } = await exec(script, { cwd: dir })
    console.log(`${stdout}${stderr}`);
  } catch (error) {
    console.log("error", error.stderr)
  }
}

start()
