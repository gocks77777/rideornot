import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  try {
    // Naver Directions5 API: start/goal format is "lng,lat"
    const start = `${startLng},${startLat}`;
    const goal = `${endLng},${endLat}`;

    const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;

    console.log('Directions API request:', url);
    console.log('Using key ID:', clientId);

    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Directions API error:', response.status, text);
      return NextResponse.json({ error: 'Directions API failed', status: response.status, detail: text, path: [] });
    }

    const data = await response.json();

    if (data.code === 0 && data.route?.trafast?.[0]) {
      const route = data.route.trafast[0];
      const path = route.path; // Array of [lng, lat]
      const summary = route.summary;

      return NextResponse.json({
        path: path, // [[lng, lat], [lng, lat], ...]
        distance: summary.distance, // meters
        duration: summary.duration, // milliseconds
        taxiFare: summary.taxiFare, // actual taxi fare from Naver!
        fuelPrice: summary.fuelPrice,
      });
    }

    return NextResponse.json({ path: [], error: 'No route found' });
  } catch (error) {
    console.error('Directions error:', error);
    return NextResponse.json({ path: [], error: 'Internal error' });
  }
}
