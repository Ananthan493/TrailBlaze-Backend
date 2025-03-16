import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple base64 encoded PNG for certificate seal
const sealData = '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';

// Create directories if they don't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the PNG file
const filePath = path.join(publicDir, 'certificate-seal.png');
fs.writeFileSync(filePath, Buffer.from(sealData, 'base64'));

console.log('Certificate seal created at:', filePath);
