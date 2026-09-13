/**
 * 静态站构建脚本 —— 给托管平台用的。
 *
 * 这个站是纯手写 HTML，本来不需要构建。但部分平台（如帽子云）
 * 只有在仓库里看到 package.json 才肯把它当成可部署的项目，
 * 所以补一个最小构建：把源文件原样拷到 dist/，不做任何加工。
 *
 * 零依赖，只用 Node 内置模块，Node 12 以上都能跑。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// 根目录下的单文件（存在才拷）
const FILES = ['ai-model-test.html', 'index.html', 'config.js'];
// 需要整体拷贝的目录
const DIRS = ['data'];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, f));
}
for (const dir of DIRS) {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) copyDir(src, path.join(DIST, dir));
}

console.log('构建完成，dist/ 内容：' + fs.readdirSync(DIST).join('、'));
