#!/usr/bin/env node
import QRCode from "qrcode";

// 使用开发服务器URL
const devUrl = "https://8081-i2w166ziqiezvc843dwot-1f5418d5.sg1.manus.computer";

await QRCode.toFile("expo-qr-code.png", devUrl, { width: 512 });
console.log(`✅ QR code saved to expo-qr-code.png`);
console.log(`Dev URL: ${devUrl}`);
