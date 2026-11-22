# Nexo 2.1

Aplicación para macOS Apple Silicon que reúne cuentas web en sesiones independientes.

## Funciones

- Una sola instancia por carpeta de datos; al abrir otra copia actualizada se enfoca la ventana existente.
- Cinco cuentas iniciales: WhatsApp, Telegram, Gmail y dos Outlook. Las instalaciones existentes conservan su lista.
- Contadores específicos para indicadores accesibles de los cuatro servicios y respaldo por título. Un guion indica cifra desconocida. Dependen de la interfaz web, no son una API oficial ni garantizan el total de todos los chats o carpetas. Los avisos alternativos comunican aumentos de contador sin leer el texto de los mensajes; se limita la repetición de avisos por cuenta.
- Sonido y avisos por cuenta, No molestar manual o por horario semanal. Los horarios cruzan medianoche y siguen la hora local del Mac. No se reciben avisos con una cuenta suspendida. Las notificaciones de service workers no están integradas.
- Orden por arrastre; sin nuevos atajos de teclado.
- Panel de memoria por proceso y suspensión manual o automática. Las cifras son aproximadas y los procesos pueden compartirse entre cuentas.
- Exportar/importar configuración con esquema validado. No exporta cookies, sesiones, identificadores de partición ni contraseñas. En el mismo Mac se reutilizan las sesiones de cuentas coincidentes por nombre y URL. Antes de importar se conserva una copia de ajustes en la carpeta backups de la aplicación.
- Bloqueo visual con contraseña propia, sin cifrado de las sesiones del disco.
- Actualizaciones desde GitHub Releases con progreso, descarga de una versión fija y verificación SHA-256 y firma local. El instalador guarda la versión anterior; requiere una confirmación de interfaz operativa en 60 segundos. Si falla, intenta restaurar y abrir la versión anterior, conservando la copia fallida para diagnóstico. Las copias anteriores se guardan junto a Nexo.app con sufijo previous y fecha.

La firma es ad hoc, sin notarización de Apple. Las cuentas y sesiones permanecen en el equipo, no en este repositorio. Microsoft decide qué métodos de acceso están permitidos; el ajuste local cancela las claves de acceso no implementadas para ofrecer otras alternativas autorizadas.

## Desarrollo

`npm ci` y `npm start`. `npm test` comprueba horarios, importación, adaptadores y recuperación del instalador con aplicaciones simuladas. Los archivos integration-test se ejecutan con Electron y una carpeta NEXO_TEST_DATA separada de las cuentas reales.

## Publicación gratuita

El flujo de GitHub Actions construye una versión arm64 y publica el ZIP y su SHA-256. Incrementa package.json y package-lock.json para publicar una nueva versión. Se utilizan ejecutores estándar en un repositorio público.
