Guia de lanzamiento con dominio propio (Plandem)

Paso 1. Subir el proyecto a GitHub
1. Crea un repositorio nuevo en GitHub.
2. Sube esta carpeta completa del proyecto.
3. Verifica que no se haya subido el archivo .env.

Paso 2. Preparar MongoDB Atlas
1. Crea una cuenta en MongoDB Atlas.
2. Crea un cluster (Shared, suficiente para empezar).
3. En Database Access crea un usuario y guarda usuario y password.
4. En Network Access permite 0.0.0.0/0 para pruebas iniciales.
5. Copia la cadena de conexion y sustituye usuario/password.

Paso 3. Desplegar en Render
1. En Render selecciona New + Blueprint.
2. Conecta tu repositorio de GitHub.
3. Render detectara render.yaml automaticamente.
4. En Environment variables añade MONGODB_URI con tu cadena de Atlas.
5. Confirma que SUPERADMIN_EMAIL sea jmv1985jmv@gmail.com.
6. Lanza el deploy.

Paso 4. Validar aplicacion en internet
1. Abre la URL publica de Render.
2. Comprueba salud en /api/health.
3. Inicia sesion con el superadmin configurado.
4. Verifica acceso al panel de promotores.

Paso 5. Conectar dominio propio
1. Compra o usa tu dominio (Cloudflare, Namecheap, GoDaddy, etc.).
2. En Render entra al servicio y abre Settings > Custom Domains.
3. Añade dominio principal (por ejemplo plandem.es) y subdominio www.
4. Copia los registros DNS que te da Render.
5. En tu proveedor DNS crea esos registros exactos.
6. Espera propagacion (5 minutos a 24 horas).

Paso 6. SSL y redireccion
1. Render activa SSL automaticamente al validar DNS.
2. Activa redireccion de www a dominio principal (o al reves) segun prefieras.
3. Verifica que todo responde en https.

Paso 7. Checklist final
1. SUPERADMIN_EMAIL correcto.
2. Contraseña del superadmin cambiada por una definitiva y robusta.
3. MongoDB Atlas con backup/monitorizacion basica.
4. Prueba publicar evento y flujo de promotores.

Notas importantes
1. La carpeta uploads en Render no es persistente en plan basico.
2. Para produccion real, mueve imagenes/videos a almacenamiento externo (Cloudinary, S3, etc.).
3. Si quieres, el siguiente paso es integrar Cloudinary para no perder archivos multimedia al redeploy.
