// Paso 2: GitHub redirige aquí de vuelta con un código. Lo cambiamos por un
// token de acceso y se lo pasamos al panel /admin mediante postMessage,
// siguiendo el protocolo que espera Decap CMS para el backend "github".
exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    return { statusCode: 400, body: 'Falta el parámetro "code" de GitHub.' };
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    return {
      statusCode: 401,
      body: `Error autenticando con GitHub: ${data.error_description || data.error || 'sin access_token'}`,
    };
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

  const html = `
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
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  };
};
