const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const envPath = path.join(root, '.env');
const force = process.argv.includes('--force');

function randomHex(size = 48) {
  return crypto.randomBytes(size).toString('hex');
}

function randomPassword(length = 24) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

if (fs.existsSync(envPath) && !force) {
  console.log('Ya existe .env. No se sobreescribe. Usa --force para regenerar.');
  process.exit(0);
}

const generated = {
  PORT: '3000',
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/plandem',
  SUPERADMIN_EMAIL: 'admin@plandem.com',
  SUPERADMIN_PASSWORD: randomPassword(26),
  JWT_SECRET: randomHex(48),
  JWT_EXPIRES_IN: '7d',
  OTP_EMAIL_ENABLED: 'true',
  OTP_EXP_MINUTES: '10',
  OTP_MAX_ATTEMPTS: '5',
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: 'no-reply@plandem.es',
  ALLOW_CONSOLE_OTP: 'true',
  CORS_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
  CLOUDINARY_URL: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  CLOUDINARY_FOLDER: 'plandem/perfiles',
  CLOUDINARY_PROFILE_STORAGE_REQUIRED: 'true'
};

const lines = Object.entries(generated).map(([k, v]) => `${k}=${v}`);
fs.writeFileSync(envPath, `${lines.join('\n')}\n`, 'utf8');

const resumenPath = path.join(root, 'admin', 'SEGURIDAD_GENERADA_LOCAL.txt');
const resumen = [
  'Configuracion local de seguridad generada automaticamente.',
  '',
  'Archivo creado: .env',
  'Importante: no compartas ni subas este archivo.',
  '',
  `SUPERADMIN_EMAIL=${generated.SUPERADMIN_EMAIL}`,
  `SUPERADMIN_PASSWORD=${generated.SUPERADMIN_PASSWORD}`,
  '',
  'Para entorno local sin SMTP, OTP se muestra en logs del servidor.',
  'Para produccion debes configurar SMTP y poner ALLOW_CONSOLE_OTP=false.'
].join('\n');
fs.writeFileSync(resumenPath, `${resumen}\n`, 'utf8');

console.log('OK: .env generado con seguridad base.');
console.log(`Credenciales locales escritas en ${path.relative(root, resumenPath)}.`);
