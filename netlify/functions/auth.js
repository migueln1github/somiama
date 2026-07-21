// Paso 1 del login del panel /admin: redirige a GitHub para que el
// webmaster autorice el acceso al repositorio.
export const handler = async (event) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.URL; // Netlify la define sola en producción
  const redirectUri = `${siteUrl}/callback`;

  const authorizeUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo`;

  return {
    statusCode: 302,
    headers: { Location: authorizeUrl },
  };
};
