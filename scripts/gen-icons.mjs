import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icon.svg');
await sharp(svg).resize(192, 192).png().toFile('public/pwa-192x192.png');
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512x512.png');
console.log('icons generated');
