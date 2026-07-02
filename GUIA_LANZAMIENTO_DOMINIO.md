Guia facil de lanzamiento de Plandem con dominio plandem.es

Objetivo
1. Dejar la app publicada en Render.
2. Conectar MongoDB Atlas.
3. Conectar dominio plandem.es con HTTPS.

Antes de empezar
1. Necesitas cuenta en GitHub, Render y MongoDB Atlas.
2. Si aun no tienes dominio propio, no hace falta tocar DNS: usa la URL publica de Render.
3. Ten a mano estos datos:
	- MONGODB_URI (cadena de Atlas)
	- SUPERADMIN_EMAIL (tu email de admin)
	- SUPERADMIN_PASSWORD (password nueva, fuerte y solo para admin)
	- JWT_SECRET (secreto largo y aleatorio para firmar sesiones)
	- CORS_ORIGINS (dominios permitidos, separados por coma)
	- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (envio de codigos OTP)
	- CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (fotos de perfil remotas)

Paso 1. Subir proyecto a GitHub (si aun no esta)
1. Crea un repositorio nuevo en GitHub.
2. Sube la carpeta completa del proyecto Portal-Eventos.
3. Importante: no subas archivo .env real.

Paso 2. Preparar MongoDB Atlas
1. Crea o abre tu cluster.
2. Ve a Database Access y crea un usuario de base de datos.
3. Ve a Network Access y añade IP 0.0.0.0/0 para inicio rapido.
4. Pulsa Connect > Drivers y copia la cadena.
5. Cambia USER, PASSWORD y nombre de base por los tuyos.

Paso 3. Desplegar en Render
1. En Render, pulsa New + Blueprint.
2. Conecta el repositorio de GitHub.
3. Render detecta render.yaml automaticamente.
4. En variables de entorno configura:
	- MONGODB_URI = tu cadena completa de Atlas
	- SUPERADMIN_EMAIL = jmv1985jmv@gmail.com
	- SUPERADMIN_PASSWORD = una password fuerte nueva
	- JWT_SECRET = cadena aleatoria larga (minimo 32 caracteres)
	- JWT_EXPIRES_IN = 7d
	- OTP_EMAIL_ENABLED = true
	- OTP_EXP_MINUTES = 10
	- OTP_MAX_ATTEMPTS = 5
	- SMTP_HOST = tu proveedor SMTP
	- SMTP_PORT = 587
	- SMTP_SECURE = false (true si usas 465)
	- SMTP_USER = usuario SMTP
	- SMTP_PASS = password SMTP
	- SMTP_FROM = remitente no-reply@tudominio
	- ALLOW_CONSOLE_OTP = false (obligatorio en produccion)
	- CORS_ORIGINS = la URL publica de Render, por ejemplo https://plandem-portal-eventos.onrender.com
	- CLOUDINARY_URL = cadena cloudinary://... (opcion recomendada)
	- CLOUDINARY_FOLDER = plandem/perfiles
	- CLOUDINARY_PROFILE_STORAGE_REQUIRED = false (modo gratuito, fallback local)
5. Inicia el deploy.

Paso 4. Verificar que arranco bien
1. Abre la URL publica que da Render (ejemplo: https://tu-servicio.onrender.com).
2. Prueba salud: /api/health
3. Registra o inicia sesion con SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD.
4. Para cuentas nuevas, verifica el email con el codigo OTP antes de hacer login.
5. Comprueba que puedes entrar a funciones de admin.

Paso 5. Conectar dominio plandem.es
1. Solo aplica si ya tienes dominio propio.
2. En Render: Settings > Custom Domains.
3. Añade estos dominios:
	- plandem.es
	- www.plandem.es
4. Render te mostrara registros DNS exactos (A, CNAME o ALIAS segun caso).
5. En tu proveedor de dominio crea exactamente esos registros.
6. Espera propagacion DNS (normalmente minutos, a veces hasta 24h).

Paso 6. HTTPS y redireccion
1. Cuando DNS valide, Render activa SSL automaticamente.
2. Deja un dominio principal:
	- recomendado: plandem.es como principal
	- redireccion: www.plandem.es -> plandem.es
3. Verifica:
	- https://plandem.es
	- https://www.plandem.es

Checklist final rapido
1. /api/health devuelve ok true.
2. Login admin funciona con tu email real.
3. Se pueden crear/editar eventos.
4. El dominio carga en HTTPS sin aviso de certificado.

Notas importantes
1. La carpeta uploads no es persistente en Render free.
2. Las fotos de perfil ahora se suben a Cloudinary si configuras sus variables de entorno.
3. Si no configuras Cloudinary y CLOUDINARY_PROFILE_STORAGE_REQUIRED=false, la subida sigue funcionando con almacenamiento local (puede perderse tras redeploy).
