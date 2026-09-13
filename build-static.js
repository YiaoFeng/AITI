/**
 * 静态站构建脚本 —— 给托管平台用的。
 *
 * 这个站是纯手写 HTML，本来不需要构建。但部分平台（如帽子云）
 * 只有在仓库里看到 package.json 才肯把它当成可部署的项目，
 * 所以补一个最小构建：把源文件原样拷到产物目录，不做任何加工。
 *
 * 产物目录必须是 build/ 而不是 dist/ —— 帽子云构建镜像的最后一步是
 * `COPY --from=build /src/build /`，写死读 build/，放 dist/ 会报
 * "/src/build": not found
 *
 * 这里是**整目录递归拷贝**，不是写死文件清单：以后新增测试只要新建
 * 一个目录（自带 index.html），构建自动带上，不用回来改这个脚本。
 * 只排除开发用的文件（.git / build / node_modules / 说明文档 / 构建脚本自己）。
 *
 * 零依赖，只用 Node 内置模块，Node 12 以上都能跑。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'build');

// 不发布的目录（按目录名匹配）
const SKIP_DIRS = new Set(['.git', 'build', 'node_modules']);
// 不发布的文件（按文件名匹配）
const SKIP_FILES = new Set(['.gitignore', 'build-static.js', 'package.json']);
// 不发布的扩展名
const SKIP_EXT = new Set(['.log', '.md', '.zip']);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      copyDir(s, d);
    } else {
      if (SKIP_FILES.has(name)) continue;
      if (SKIP_EXT.has(path.extname(name).toLowerCase())) continue;
      fs.copyFileSync(s, d);
    }
  }
}

/** 统计产物里的页面，构建日志里打出来，方便一眼确认新测试进去了没 */
function listPages(dir, base = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = base ? base + '/' + name : name;
    if (fs.statSync(p).isDirectory()) out.push(...listPages(p, rel));
    else if (name === 'index.html') out.push(rel);
  }
  return out;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(ROOT, OUT);

console.log('构建完成，build/ 顶层：' + fs.readdirSync(OUT).join('、'));
console.log('页面清单：');
for (const p of listPages(OUT)) console.log('  /' + p.replace(/index\.html$/, ''));
