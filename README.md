# somiama-web

Andamiaje del nuevo sitio de SOMIAMA. Astro (sitio estático) + Decap CMS (panel de edición) + Leaflet (mapa) + Clerk (área de socios, pendiente de configurar).

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
  layouts/BaseLayout.astro    # navegación + footer, comunes a todo el sitio
  pages/                      # una página por ruta del sitemap acordado
  data/
    noticias-items/*.json     # una noticia por archivo (las gestiona Decap CMS)
    ofertas-items/*.json       # una oferta de trabajo por archivo
    servicios-items/*.json     # un Servicio de Medicina Intensiva por archivo
public/
  admin/                      # panel de Decap CMS
  herramientas/apache2/       # calculadora APACHE II ya modernizada
```

Las noticias y ofertas se ordenan solas por fecha (más reciente primero) — no hace falta reordenar nada a mano.

## Poner en marcha el panel de administración (Decap CMS)

El panel vive en `/admin`. Para que funcione de verdad (login y guardado de cambios) hace falta:

1. Subir este proyecto a un repositorio de GitHub
2. Desplegar el sitio en **Netlify** (tiene plan gratuito de sobra para este tráfico)
3. En Netlify: activar **Identity** (gestión de usuarios) y **Git Gateway** (para que el CMS pueda escribir en el repo)
4. Invitarte a ti mismo como único usuario con acceso desde Netlify Identity
5. Entrar en `tudominio.com/admin` con esas credenciales

A partir de ahí, añadir una noticia, oferta o servicio del mapa es rellenar un formulario — cada guardado crea o modifica un archivo `.json`, sin tocar código.

## El mapa de servicios

Usa **Leaflet + OpenStreetMap** (gratuito, sin API key ni tarjeta de crédito, a diferencia de Google Maps). Cada entrada lleva **latitud/longitud fijas** guardadas en su ficha — nada de geocodificación en vivo desde el navegador (eso violaría la política de uso de Nominatim y podría acabar bloqueando el sitio).

Para añadir un servicio nuevo desde el panel: busca la dirección en Google Maps, clic derecho sobre el punto exacto → copia las coordenadas → pégalas en los campos "Latitud" y "Longitud" del formulario.

**Importante**: las coordenadas de los 17 servicios ya cargados son aproximadas (calculadas por mí a partir de la dirección conocida de cada hospital, sin verificación en mapa real). Antes de publicar, conviene comprobar cada una en Google Maps — son fáciles de ajustar desde el propio panel.

## Área de socios (Clerk) — integrado, falta tu clave

La página `/area-socios` ya usa el SDK de [Clerk](https://clerk.com) de verdad (login + perfil + cambio de contraseña autogestionado). Solo falta que pongas tu clave:

1. Crea una cuenta gratuita en [clerk.com](https://clerk.com) (hasta ~10.000 usuarios sin coste)
2. Dentro, crea una "aplicación" y ve a **API Keys** → copia la **Publishable key** (empieza por `pk_test_...` o `pk_live_...`). Esta clave es pública, no pasa nada si se ve en el navegador.
3. En tu ordenador: copia `.env.example` como `.env` (sin `.example`) y pega tu clave ahí:
   ```
   PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_real
   ```
4. En Netlify (para que funcione también en producción, no solo en local): **Site settings → Environment variables → Add a variable**, con el mismo nombre y valor, y vuelve a desplegar.

**Cómo funciona ahora mismo**: en vez de intentar mostrar el formulario de login dentro de nuestra propia página (lo que dependía de un componente de Clerk que resultó frágil), la página enlaza directamente a las páginas de login y gestión de cuenta que aloja el propio Clerk ("Account Portal") — mismo resultado para el socio, pero sin ningún componente nuestro que pueda romperse con futuras actualizaciones de Clerk. Si no hay clave configurada, muestra un aviso en vez de romperse.

**Aviso importante de seguridad**: esta integración protege el contenido *en el navegador* (oculta la sección hasta comprobar que hay sesión), pero como el sitio es 100% estático, el HTML de esa página se genera igual para todo el mundo — no es una barrera a nivel de servidor. Para el uso previsto (ocultar actas/documentos internos de poco valor sensible a curiosos casuales) es suficiente y es el mismo compromiso que asumen la mayoría de sitios pequeños con Clerk sin backend propio. Si en el futuro se sube ahí algo realmente sensible, habría que añadir un adaptador de servidor (Netlify Functions) para verificar la sesión antes de servir el contenido — decidme si llegáis a ese punto y lo evaluamos.

## Formularios (contacto, hazte socio, solicitud de aval) — conectados con Netlify Forms

Los 3 formularios ya están conectados usando **Netlify Forms** — no hace falta ninguna cuenta ni servicio adicional, solo que el sitio esté desplegado en Netlify (que ya es la plataforma recomendada para todo lo demás). Netlify detecta los formularios automáticamente en el primer despliegue, sin configuración.

**Para recibir un aviso por email cada vez que alguien envía uno:**
1. En el panel de Netlify de tu sitio: **Site configuration → Forms → Form notifications**
2. **Add notification → Email notification**
3. Pon el email donde quieras recibirlos (ej. `info@somiama.org`) y elige "All form submissions" (o selecciona formulario por formulario si prefieres emails distintos para contacto / hazte socio / solicitud de aval)

Todos los envíos, aunque no actives el email, quedan igualmente guardados y consultables en **Site configuration → Forms** dentro del propio panel de Netlify.

El plan gratuito de Netlify incluye 100 envíos al mes — más que de sobra para el volumen de esta web. Cada formulario redirige a `/gracias` tras enviarse, y llevan un campo oculto "honeypot" anti-spam (invisible para personas, pero que atrapa a los bots).

## Las 4 herramientas clínicas — completas

- `/herramientas/apache2`, `/sofa`, `/saps2`, `/saps3` — las 4 modernizadas con su lógica de puntuación completa. SAPS III usa la ecuación general/global de mortalidad (no las variantes regionales específicas).

## Despliegue

Cualquier proveedor de hosting estático sirve (Netlify, Vercel, Cloudflare Pages). Recomiendo Netlify por la integración directa con Decap CMS descrita arriba.

```
npm run build
```

Genera el sitio final en `dist/`, listo para subir.
