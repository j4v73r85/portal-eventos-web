const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envPath = path.join(root, '.env');

function parseEnv(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith('#'))
    .reduce((acc, line) => {
      const idx = line.indexOf('=');
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

if (!fs.existsSync(envPath)) {
  console.log('Falta .env. Ejecuta: npm run secure:setup');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const required = [
  'MONGODB_URI',
  'SUPERADMIN_EMAIL',
  'SUPERADMIN_PASSWORD',
  'JWT_SECRET',
  'CORS_ORIGINS'
];

const missing = required.filter((k) => !env[k] || env[k].trim() === '');
if (missing.length > 0) {
  console.log(`Faltan variables en .env: ${missing.join(', ')}`);
  process.exit(1);
}

if ((env.SUPERADMIN_PASSWORD || '').length < 16) {
  console.log('SUPERADMIN_PASSWORD demasiado corta (minimo recomendado 16).');
  process.exit(1);
}

if ((env.JWT_SECRET || '').length < 32) {
  console.log('JWT_SECRET demasiado corto (minimo recomendado 32).');
  process.exit(1);
}

const otpEnabled = (env.OTP_EMAIL_ENABLED || 'true') !== 'false';
const allowConsoleOtp = (env.ALLOW_CONSOLE_OTP || 'false') === 'true';

if (otpEnabled && !allowConsoleOtp) {
  const smtpRequired = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const smtpMissing = smtpRequired.filter((k) => !env[k] || env[k].trim() === '');
  if (smtpMissing.length > 0) {
    console.log(`Faltan datos SMTP para OTP real: ${smtpMissing.join(', ')}`);
    process.exit(1);
  }
}

console.log('OK: chequeo de seguridad local superado.');
process.exit(0);
