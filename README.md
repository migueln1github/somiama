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

## Área de socios (pendiente)

La página `/area-socios` es un placeholder. Para activarla de verdad con [Clerk](https://clerk.com):

1. Crear una cuenta gratuita en clerk.com (hasta ~10.000 usuarios sin coste)
2. Crear una "aplicación" ahí dentro, y copiar la clave pública
3. Yo integro el componente de login/perfil de Clerk en esa página — avísame cuando tengas la cuenta creada y lo hacemos

## Formularios (contacto, hazte socio, solicitud de aval)

Estos formularios están maquetados pero no envían nada todavía — les falta un backend. Opciones sencillas y gratuitas para volumen bajo: **Netlify Forms** (si despliegas en Netlify, es literalmente añadir un atributo al `<form>`) o **Formspree**. Dímelo cuando llegue el momento y lo conecto.

## Las 4 herramientas clínicas

- `/herramientas/apache2` — ya modernizada, con la lógica de puntuación completa
- `/herramientas/sofa`, `/saps2`, `/saps3` — de momento son una página de aviso; se construyen siguiendo el mismo patrón que APACHE II en cuanto confirmemos las tablas de puntuación de cada escala

## Despliegue

Cualquier proveedor de hosting estático sirve (Netlify, Vercel, Cloudflare Pages). Recomiendo Netlify por la integración directa con Decap CMS descrita arriba.

```
npm run build
```

Genera el sitio final en `dist/`, listo para subir.
