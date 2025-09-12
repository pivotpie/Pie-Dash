// Netlify Function: ppqProxy
// Proxies requests to PPQ.AI without exposing the API key to the client.

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.PPQ_API_KEY;
  const baseUrl = process.env.PPQ_API_BASE_URL || 'https://api.ppq.ai';

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing server env var PPQ_API_KEY' }),
    };
  }

  try {
    const requestBody = event.body ? JSON.parse(event.body) : {};

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await upstream.text();

    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
      body: responseText,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error', detail: err?.message || String(err) }),
    };
  }
};
