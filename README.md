# somiama-web

Sitio de SOMIAMA. Astro (sitio estático) + Decap CMS (panel de edición) + Leaflet (mapa) + Clerk (área de socios) + un pequeño servidor Node/Express propio, alojado en el Plesk de SOMIAMA.

## Cómo probarlo en local

Necesitas Node.js instalado (v18 o superior).

```
npm install
npm run dev
```

Abre `http://localhost:4321`.

## Estructura

```
src/
layouts/BaseLayout.astro # navegación + footer, comunes a todo el sitio
pages/ # una página por ruta del sitemap acordado
data/
noticias-items/.json # una noticia por archivo (las gestiona Decap CMS)
ofertas-items/.json # una oferta de trabajo por archivo
servicios-items/*.json # un Servicio de Medicina Intensiva por archivo
public/
admin/ # panel de Decap CMS
server/
server.js # servidor Node/Express: sirve el sitio, formularios y login de /admin
.github/workflows/
build-and-deploy.yml # compila el sitio en GitHub Actions y lo publica en la rama "deploy"

## Cómo editar los textos de la web

Cada página vive en un archivo `.astro` dentro de `src/pages/` (por ejemplo, `src/pages/sociedad.astro` para la página "Sociedad"). Para cambiar un texto:

1. Edita el archivo en GitHub (icono del lápiz)
2. Cambia el texto que está entre etiquetas como `<p>...</p>` o `<li>...</li>` — no toques lo que hay dentro de `style="..."`, eso es diseño, no contenido
3. "Commit changes"
4. Esto dispara la compilación sola en GitHub Actions (pestaña "Actions" del repo)
5. En Plesk: **Hosting y DNS → Git → Pull ahora**, y luego **Herramientas de desarrollo → Node.js → Reiniciar app**

El orden de las pestañas del menú se controla en `src/layouts/BaseLayout.astro`, en el array `nav` al principio del archivo — basta con reordenar esas líneas.

## Poner en marcha el panel de administración (Decap CMS)

El panel vive en `/admin`, con el backend "github" directo de Decap CMS: una función propia en `server/server.js` hace de intermediario OAuth con GitHub (rutas `/auth` y `/callback`).

Pasos para activarlo (o para moverlo a un dominio nuevo, como el día del cambio a `somiama.org` definitivo):

1. En `public/admin/config.yml`, ajusta:
   - `repo:` con tu usuario/repo real de GitHub
   - `base_url:` con la URL real del sitio (en `https://`, una vez tengáis certificado SSL válido)
2. Crea una **OAuth App** de GitHub: github.com → tu foto de perfil → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - **Homepage URL**: la URL real del sitio
   - **Authorization callback URL**: `https://tudominio.com/callback`
   - Copia el **Client ID**, y genera y copia un **Client Secret**
3. En Plesk → **Herramientas de desarrollo → Node.js → Variables de entorno**, añade `OAUTH_CLIENT_ID` y `OAUTH_CLIENT_SECRET`
4. Reinicia la app Node.js

A partir de ahí, añadir una noticia, oferta o servicio del mapa es rellenar un formulario en `/admin` — cada guardado crea o modifica un archivo `.json` directamente en el repositorio.

**Importante**: `base_url` (en `config.yml`) y la "Authorization callback URL" (en la OAuth App de GitHub) deben coincidir **exactamente** con el protocolo real del sitio — `http://` o `https://` según corresponda. Un desajuste entre los dos hace que el login se quede colgado sin avisar del motivo.

## El mapa de servicios

Usa **Leaflet + OpenStreetMap** (gratuito, sin API key ni tarjeta de crédito, a diferencia de Google Maps). Cada entrada lleva **latitud/longitud fijas** guardadas en su ficha — nada de geocodificación en vivo desde el navegador (eso violaría la política de uso de Nominatim y podría acabar bloqueando el sitio).

Para añadir un servicio nuevo desde el panel: busca la dirección en Google Maps, clic derecho sobre el punto exacto → copia las coordenadas → pégalas en los campos "Latitud" y "Longitud" del formulario.

**Importante**: las coordenadas de los servicios públicos ya cargados son aproximadas (calculadas a partir de la dirección conocida de cada hospital, sin verificación en mapa real). Conviene comprobar cada una en Google Maps — son fáciles de ajustar desde el propio panel. Los hospitales privados siguen pendientes de añadir.

## Área de socios (Clerk)

La página `/area-socios` usa el SDK de [Clerk](https://clerk.com): login, registro y gestión de perfil/contraseña, a través de las páginas alojadas por el propio Clerk ("Account Portal") — sin componentes propios de login que puedan romperse con futuras actualizaciones de Clerk.

Configuración:
1. Cuenta en [clerk.com](https://clerk.com) (gratis hasta ~10.000 usuarios), crea una aplicación, copia la **Publishable key** en **API Keys**
2. En Plesk → Node.js → Variables de entorno, añade `PUBLIC_CLERK_PUBLISHABLE_KEY` con esa clave (es pública, no pasa nada si se ve en el navegador)
3. **Importante**: esta variable se usa **al compilar** el sitio (`npm run build`), no al ejecutarlo — como la compilación la hace GitHub Actions, la clave debe estar también como **secreto del repositorio** en GitHub (Settings → Secrets and variables → Actions → `PUBLIC_CLERK_PUBLISHABLE_KEY`), y el workflow (`.github/workflows/build-and-deploy.yml`) ya está preparado para leerla de ahí
4. En el panel de Clerk, autoriza el dominio real donde vive el sitio (Configure → Domains)

**Aviso de seguridad**: esta integración protege el contenido *en el navegador* (oculta la sección hasta comprobar que hay sesión), pero el HTML de esa página se genera igual para todo el mundo — no es una barrera a nivel de servidor. Suficiente para ocultar actas/documentos internos de poco valor sensible a curiosos casuales; si en el futuro se sube algo realmente sensible, habría que verificar la sesión también en `server/server.js` antes de servir ese contenido.

## Formularios (contacto, hazte socio, solicitud de aval)

Los 3 formularios los procesa `server/server.js`: identifica cuál es por un campo oculto `form-name` (mismo patrón que usa Netlify Forms, por si algún día se quisiera volver a esa plataforma), envía un email por SMTP, y sirve la página `/gracias` como respuesta.

Variables de entorno necesarias (Plesk → Node.js → Variables de entorno), con los datos de vuestro buzón de correo (pestaña **Correo** de Plesk):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` si el puerto es 465), `SMTP_USER`, `SMTP_PASS`
- `CONTACT_EMAIL` — a qué dirección llegan los avisos (ej. `info@somiama.org`)

Llevan un campo oculto "honeypot" anti-spam (invisible para personas, pero que atrapa a los bots).

## Las 4 herramientas clínicas

- `/herramientas/apache2`, `/sofa`, `/saps2`, `/saps3` — las 4 modernizadas con su lógica de puntuación completa. SAPS III usa la ecuación general/global de mortalidad (no las variantes regionales específicas).

## Despliegue (autoalojado en Plesk)

### Cómo funciona
- `.github/workflows/build-and-deploy.yml` compila el sitio automáticamente en GitHub (gratis, vía GitHub Actions) cada vez que hay un cambio en `main` — incluidos los cambios hechos desde `/admin` — y publica el resultado ya compilado en una rama `deploy`.
- `server/server.js` es un servidor Node/Express que sirve el sitio, procesa los 3 formularios, y hace de intermediario OAuth para `/admin`.
- Plesk, con su extensión **Git**, se conecta a la rama `deploy` y se actualiza solo.

### Configuración en Plesk
1. **Hosting y DNS → Git**: conecta el repositorio (`https://github.com/tu-usuario/tu-repo.git`), rama **`deploy`** (no `main`)
2. **Herramientas de desarrollo → Node.js**: activa Node.js para el dominio, con `server.js` como archivo de arranque
3. Variables de entorno (ver secciones de arriba): `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL`
4. Pulsa **"Instalación de NPM"** dentro del panel de Node.js (no la acción de despliegue de Git, que no encuentra `npm`)
5. Reinicia la app tras cualquier cambio de variables

### El día del cambio de dominio (de `pruebas.somiama.org` a `somiama.org` definitivo)
Hay que repetir, con el dominio nuevo: emitir certificado SSL, actualizar `base_url` en `config.yml`, `SITE_URL`, y la "Authorization callback URL" de la OAuth App de GitHub. Son los mismos pasos ya probados en el subdominio de pruebas.
