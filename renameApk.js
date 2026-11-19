const fs = require('fs');
const path = require('path');

const input = process.argv[2] || process.env.APK_PATH;
if (!input) {
  console.error('用法: node renameApk.js <apk-path>');
  process.exit(2);
}

const oldPath = path.resolve(input);
if (!fs.existsSync(oldPath) || !oldPath.toLowerCase().endsWith('.apk')) {
  console.error(`❌ APK 文件不存在或扩展名不正确：${oldPath}`);
  process.exit(1);
}

const newPath = path.join(path.dirname(oldPath), '发布站.apk');
if (path.resolve(oldPath) === path.resolve(newPath)) {
  console.log('✅ APK 已经是发布站.apk');
  process.exit(0);
}

if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
fs.renameSync(oldPath, newPath);
console.log(`✅ APK 已重命名为：${newPath}`);
