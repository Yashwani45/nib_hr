const fs = require('fs');
const path = require('path');

const zxingPath = path.resolve(__dirname, '../../Frontend/node_modules/html5-qrcode/esm/third_party/zxing-js.umd.js');
const cjsZxing = path.resolve(__dirname, '../../Frontend/node_modules/html5-qrcode/cjs/third_party/zxing-js.umd.js');

console.log('esm zxing exists:', fs.existsSync(zxingPath));
console.log('cjs zxing exists:', fs.existsSync(cjsZxing));
