// Server-side proxy to the Shopify Storefront API.
// The access token is read from Netlify environment variables and never reaches the browser.
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const publicToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN; // optional, server-side only
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'depper-store.myshopify.com';
  const version = process.env.SHOPIFY_API_VERSION || '2026-10';
  if (!publicToken && !privateToken) return json(500, { error: 'not_configured' });
  if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(domain)) return json(500, { error: 'Invalid SHOPIFY_STORE_DOMAIN.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON.' }); }
  if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 20000) {
    return json(400, { error: 'Invalid query.' });
  }
  const variables = body.variables && typeof body.variables === 'object' ? body.variables : {};

  const headers = { 'Content-Type': 'application/json' };
  if (privateToken) {
    headers['Shopify-Storefront-Private-Token'] = privateToken;
    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'];
    if (ip) headers['Shopify-Storefront-Buyer-IP'] = ip;
  } else {
    headers['X-Shopify-Storefront-Access-Token'] = publicToken;
  }

  try {
    const r = await fetch(`https://${domain}/api/${version}/graphql.json`, {
      method: 'POST', headers, body: JSON.stringify({ query: body.query, variables }),
    });
    return { statusCode: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: await r.text() };
  } catch (e) {
    return json(502, { error: 'Could not reach Shopify.' });
  }
};
