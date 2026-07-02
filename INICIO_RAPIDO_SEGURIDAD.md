Inicio rapido (sin conocimientos tecnicos)

1) Abre terminal en la carpeta del proyecto.
2) Ejecuta:
   npm run secure:setup
3) Ejecuta:
   npm run secure:check
4) Ejecuta:
   npm run dev

Que hace esto:
- Crea un .env seguro automaticamente.
- Genera password de superadmin fuerte.
- Prepara JWT y politicas base.
- Valida que no falte nada critico.

Importante:
- En local, si no hay SMTP, el codigo OTP aparece en logs del servidor.
- En produccion, debes usar SMTP real y ALLOW_CONSOLE_OTP=false.

Datos creados automaticamente:
- Credenciales locales en admin/SEGURIDAD_GENERADA_LOCAL.txt
- Nunca subas ese archivo a internet.
