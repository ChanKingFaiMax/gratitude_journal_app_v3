import QRCode from 'qrcode';

const host = 'cmpptoc-anonymous-8081.exp.direct';

// exp:// protocol (standard Expo Go)
await QRCode.toFile('expo-qr-exp.png', `exp://${host}`, { width: 512, margin: 2 });
console.log('exp:// QR saved -> expo-qr-exp.png');

// exps:// protocol (HTTPS variant)
await QRCode.toFile('expo-qr-exps.png', `exps://${host}`, { width: 512, margin: 2 });
console.log('exps:// QR saved -> expo-qr-exps.png');
