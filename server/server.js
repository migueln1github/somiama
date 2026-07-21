// Servidor Node/Express para alojar SOMIAMA en Plesk (sustituye a Netlify).
// Sirve el sitio ya compilado (carpeta dist/), procesa los 3 formularios
// enviando email por SMTP, y hace de intermediario OAuth para el panel /admin.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

// ---------- Envío de email (formularios) ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function enviarAviso(asunto, datos) {
  const cuerpo = Object.entries(datos)
    .map(([clave, valor]) => `${clave}: ${valor}`)
    .join('\n');
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || 'info@somiama.org',
    subject: asunto,
    text: cuerpo,
  });
}

function handlerFormulario(asunto) {
  return async (req, res) => {
    try {
      // El campo "bot-field" es un honeypot: si viene relleno, es un bot.
      if (req.body['bot-field']) {
        return res.redirect('/gracias');
      }
      await enviarAviso(asunto, req.body);
      res.redirect('/gracias');
    } catch (err) {
      console.error('Error enviando formulario:', err);
      res.status(500).send('Hubo un error enviando el formulario. Inténtalo de nuevo más tarde.');
    }
  };
}

app.post('/contacto', handlerFormulario('Nuevo mensaje de contacto — somiama.org'));
app.post('/hazte-socio', handlerFormulario('Nueva solicitud de alta de socio — somiama.org'));
app.post('/actividades/solicitud-aval', handlerFormulario('Nueva solicitud de aval científico — somiama.org'));

// ---------- OAuth de GitHub para el panel /admin (Decap CMS) ----------
app.get('/auth', (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = `${process.env.SITE_URL}/callback`;
  const authorizeUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo`;
  res.redirect(authorizeUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send('Falta el parámetro "code" de GitHub.');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    return res
      .status(401)
      .send(`Error autenticando con GitHub: ${data.error_description || data.error || 'sin access_token'}`);
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

  res.set('Content-Type', 'text/html');
  res.send(`
    <html><body>
    <script>
      (function() {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:success:${payload}',
            e.origin
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
    </body></html>
  `);
});

// Cualquier ruta no encontrada como archivo estático: dejar que Astro
// gestione sus propias páginas 404 si existieran, si no, mensaje simple.
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SOMIAMA escuchando en el puerto ${PORT}`);
});
