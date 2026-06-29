Guia facil de lanzamiento de Plandem con dominio plandem.es

Objetivo
1. Dejar la app publicada en Render.
2. Conectar MongoDB Atlas.
3. Conectar dominio plandem.es con HTTPS.

Antes de empezar
1. Necesitas cuenta en GitHub, Render y MongoDB Atlas.
2. Necesitas acceso al panel DNS del dominio plandem.es.
3. Ten a mano estos 3 datos:
	- MONGODB_URI (cadena de Atlas)
	- SUPERADMIN_EMAIL (tu email de admin)
	- SUPERADMIN_PASSWORD (password nueva, fuerte y solo para admin)

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
5. Inicia el deploy.

Paso 4. Verificar que arranco bien
1. Abre la URL publica que da Render (ejemplo: https://tu-servicio.onrender.com).
2. Prueba salud: /api/health
3. Registra o inicia sesion con SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD.
4. Comprueba que puedes entrar a funciones de admin.

Paso 5. Conectar dominio plandem.es
1. En Render: Settings > Custom Domains.
2. Añade estos dominios:
	- plandem.es
	- www.plandem.es
3. Render te mostrara registros DNS exactos (A, CNAME o ALIAS segun caso).
4. En tu proveedor de dominio crea exactamente esos registros.
5. Espera propagacion DNS (normalmente minutos, a veces hasta 24h).

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
2. Si redeployas, los archivos subidos pueden perderse.
3. Siguiente mejora recomendada: mover imagenes/videos a Cloudinary o S3.
