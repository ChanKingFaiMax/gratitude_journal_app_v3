#!/usr/bin/env node
import QRCode from "qrcode";

// 使用当前的开发服务器URL
const devServerUrl = "https://8081-iciwneqzv87oralz1pk4w-a949f156.sg1.manus.computer";

// 生成QR码
await QRCode.toFile("expo-preview-qr.png", devServerUrl, { 
  width: 512,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

console.log(`✅ QR code saved to expo-preview-qr.png`);
console.log(`📱 Scan this QR code with your device camera to open the app in Expo Go`);
console.log(`🔗 Dev Server URL: ${devServerUrl}`);
