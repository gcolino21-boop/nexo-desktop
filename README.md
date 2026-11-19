# Nexo
Aplicación Electron para macOS Apple Silicon que agrupa cuentas web con sesiones independientes.

Incluye personalización, contadores basados en títulos, notificaciones de página, ahorro de memoria, restauración, bloqueo visual con contraseña y actualización desde GitHub Releases.

## Desarrollo
`npm ci` y `npm start`.

## Releases
El flujo de GitHub Actions construye una versión arm64 y publica un ZIP y su SHA-256. Incrementa la versión en package.json antes de publicar una actualización. El repositorio no contiene cuentas, cookies ni credenciales. Las sesiones permanecen en el equipo del usuario.

La firma es ad hoc, sin notarización Apple. El bloqueo de Nexo no cifra el almacenamiento local. Los contadores dependen del título de cada web; las notificaciones de service workers no están integradas. Los servicios deciden qué autenticación está permitida.
