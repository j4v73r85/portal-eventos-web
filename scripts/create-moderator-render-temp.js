const base = process.env.RENDER_BASE_URL || 'https://plandem-portal-eventos.onrender.com';
const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
const adminPassword = process.env.ADMIN_PASSWORD || '';
const modName = (process.env.MOD_NAME || 'PlandemM1').trim();
const modEmail = (process.env.MOD_EMAIL || 'plandemm1@plandem.local').trim().toLowerCase();
const modPassword = process.env.MOD_PASSWORD || 'DUDU2510';

if (!adminEmail || !adminPassword) {
  console.error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD para autenticar en Render.');
  process.exit(1);
}

(async () => {
  const loginRes = await fetch(`${base}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  const loginText = await loginRes.text();
  if (!loginRes.ok) {
    console.error(`LOGIN_RENDER_ERROR ${loginRes.status} ${loginText}`);
    process.exit(1);
  }

  const loginData = JSON.parse(loginText);
  const token = loginData.token;
  if (!token) {
    console.error('No se recibió token de sesión.');
    process.exit(1);
  }

  const createRes = await fetch(`${base}/api/admin/usuarios-promotor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nombre: modName,
      email: modEmail,
      password: modPassword,
      tipoPerfil: 'MODERADOR',
      promotorAprobado: false
    })
  });
  const createText = await createRes.text();
  console.log(`CREATE_STATUS ${createRes.status}`);
  console.log(`CREATE_BODY ${createText}`);

  const checkRes = await fetch(`${base}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: modEmail, password: modPassword })
  });
  const checkText = await checkRes.text();
  console.log(`CHECK_STATUS ${checkRes.status}`);
  console.log(`CHECK_BODY ${checkText}`);

  if (!checkRes.ok) {
    process.exit(1);
  }
})();
