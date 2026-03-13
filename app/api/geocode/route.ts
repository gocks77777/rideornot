import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // 타임아웃을 3초로 설정하여 외부 API 지연이 앱 전체 장애로 번지지 않도록 방어합니다.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  // 1차: Naver Search Local API (장소명 검색: "오송역", "청주대" 등)
  const searchId = process.env.NAVER_SEARCH_CLIENT_ID;
  const searchSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (searchId && searchSecret) {
    try {
      const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;

      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': searchId,
          'X-Naver-Client-Secret': searchSecret,
        },
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const results = data.items.map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''), // Strip HTML tags
            address: item.roadAddress || item.address || '',
            // Naver Search returns KATECH coords, need to convert
            lat: convertKatechToWGS84_Y(parseInt(item.mapy)),
            lng: convertKatechToWGS84_X(parseInt(item.mapx)),
          }));
          return NextResponse.json({ results });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Naver Search API timeout after 3s');
      } else {
        console.error('Naver Search error:', error);
      }
    }
  }

  // 2차 폴백: Naver Geocoding API (주소 검색)
  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const geocodeUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
      const response = await fetch(geocodeUrl, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();
        if (data.addresses && data.addresses.length > 0) {
          const results = data.addresses.map((addr: any) => ({
            title: addr.roadAddress || addr.jibunAddress || query,
            address: addr.jibunAddress || addr.roadAddress || '',
            lat: parseFloat(addr.y),
            lng: parseFloat(addr.x),
          }));
          return NextResponse.json({ results });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Naver Geocode API timeout after 3s');
      } else {
        console.error('Naver Geocode error:', error);
      }
    }
  }
  
  clearTimeout(timeoutId);
  return NextResponse.json({ results: [] });
}

// Naver Search Local API returns coordinates in KATECH (TM128) format
// These are simple approximate conversions to WGS84 (lat/lng)
function convertKatechToWGS84_X(mapx: number): number {
  // mapx is in 1/10,000,000 degree format from Naver Search
  return mapx / 10000000;
}

function convertKatechToWGS84_Y(mapy: number): number {
  // mapy is in 1/10,000,000 degree format from Naver Search
  return mapy / 10000000;
}
