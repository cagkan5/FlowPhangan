export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  if (!name) return new Response('Missing name', { status: 400 });

  const key = env.GOOGLE_PLACES_KEY;
  if (!key) return new Response('API key not configured', { status: 503 });

  try {
    // Step 1: Find place and get photo reference
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
      `input=${encodeURIComponent(name + ' Koh Phangan')}&inputtype=textquery&fields=photos&key=${key}`
    );
    const data = await searchRes.json();
    const ref = data?.candidates?.[0]?.photos?.[0]?.photo_reference;
    if (!ref) return new Response('Not found', { status: 404 });

    // Step 2: Proxy the photo (follow Google's redirect, return image bytes)
    const photoRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${key}`
    );
    if (!photoRes.ok) return new Response('Photo fetch failed', { status: 502 });

    return new Response(photoRes.body, {
      status: 200,
      headers: {
        'Content-Type': photoRes.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
