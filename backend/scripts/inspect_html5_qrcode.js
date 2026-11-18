const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./Frontend/node_modules/html5-qrcode/package.json', 'utf8'));
console.log('html5-qrcode version:', pkg.version);

// Check html5-qrcode.js
const src = fs.readFileSync('./Frontend/node_modules/html5-qrcode/html5-qrcode.min.js', 'utf8');
console.log('Includes BarcodeDetector?', src.includes('BarcodeDetector'));
console.log('Includes useBarCodeDetectorIfSupported?', src.includes('useBarCodeDetectorIfSupported'));
console.log('Includes qrbox?', src.includes('qrbox'));
