const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /\.local$/i,
  /\.internal$/i
];

function isSafeExternalHost(hostname) {
  return !PRIVATE_HOST_PATTERNS.some((re) => re.test(hostname));
}

function buildOfflineCS50Response(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  // CS50P Problem Set 4: Bitcoin Price Index (CoinCap v3)
  if (host.includes('coincap.io') && pathname.includes('/assets/bitcoin')) {
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        timestamp: Date.now(),
        data: {
          id: 'bitcoin',
          rank: '1',
          symbol: 'BTC',
          name: 'Bitcoin',
          supply: '19850000.0000000000000000',
          maxSupply: '21000000.0000000000000000',
          marketCapUsd: '1815000000000.0000000000000000',
          volumeUsd24Hr: '34200000000.0000000000000000',
          priceUsd: '91435.7681000000000000',
          changePercent24Hr: '1.8421000000000000',
          vwap24Hr: '90812.1100000000000000'
        }
      })
    };
  }

  // CS50P Legacy Problem Set 4: CoinDesk Current Price API
  if (host.includes('coindesk.com') && pathname.includes('currentprice')) {
    const rate = 91435.7681;
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        time: {
          updated: new Date().toUTCString(),
          updatedISO: new Date().toISOString()
        },
        disclaimer: 'Offline Shakopee CS50P Lab Fixture',
        chartName: 'Bitcoin',
        bpi: {
          USD: { code: 'USD', symbol: '&#36;', rate: '91,435.7681', description: 'United States Dollar', rate_float: rate },
          GBP: { code: 'GBP', symbol: '&pound;', rate: '71,920.1400', description: 'British Pound Sterling', rate_float: 71920.14 },
          EUR: { code: 'EUR', symbol: '&euro;', rate: '84,610.5200', description: 'Euro', rate_float: 84610.52 }
        }
      })
    };
  }

  // CS50P Lecture 4: iTunes Search API
  if (host === 'itunes.apple.com' && pathname.startsWith('/search')) {
    const term = (parsed.searchParams.get('term') || 'weezer').trim();
    const limit = Math.max(1, Math.min(25, parseInt(parsed.searchParams.get('limit') || '10', 10) || 10));
    const catalog = [
      { artistName: 'Weezer', trackName: 'Say It Ain\'t So', collectionName: 'Weezer (Blue Album)', trackTimeMillis: 258827 },
      { artistName: 'Weezer', trackName: 'Buddy Holly', collectionName: 'Weezer (Blue Album)', trackTimeMillis: 159733 },
      { artistName: 'Weezer', trackName: 'Island in the Sun', collectionName: 'Weezer (Green Album)', trackTimeMillis: 200307 },
      { artistName: 'Weezer', trackName: 'Undone - The Sweater Song', collectionName: 'Weezer (Blue Album)', trackTimeMillis: 305493 },
      { artistName: 'Weezer', trackName: 'Beverly Hills', collectionName: 'Make Believe', trackTimeMillis: 196267 }
    ];

    const lower = term.toLowerCase();
    let results = catalog
      .filter((item) => lower === 'weezer' || item.artistName.toLowerCase().includes(lower) || item.trackName.toLowerCase().includes(lower))
      .map((item, idx) => ({
        wrapperType: 'track',
        kind: 'song',
        artistId: 115234,
        trackId: 1440878790 + idx,
        artistName: item.artistName,
        trackName: item.trackName,
        collectionName: item.collectionName,
        trackTimeMillis: item.trackTimeMillis,
        primaryGenreName: 'Alternative',
        country: 'USA',
        currency: 'USD'
      }));

    if (results.length === 0) {
      results = [
        {
          wrapperType: 'track',
          kind: 'song',
          artistId: 999001,
          trackId: 9990001,
          artistName: term,
          trackName: `${term} (Lab Demo Track 1)`,
          collectionName: 'CS50P Offline Collection',
          trackTimeMillis: 210000,
          primaryGenreName: 'Pop',
          country: 'USA',
          currency: 'USD'
        },
        {
          wrapperType: 'track',
          kind: 'song',
          artistId: 999001,
          trackId: 9990002,
          artistName: term,
          trackName: `${term} (Lab Demo Track 2)`,
          collectionName: 'CS50P Offline Collection',
          trackTimeMillis: 195000,
          primaryGenreName: 'Pop',
          country: 'USA',
          currency: 'USD'
        }
      ];
    }

    const sliced = results.slice(0, limit);
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        resultCount: sliced.length,
        results: sliced
      })
    };
  }

  return null;
}

function withIsolationHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return withIsolationHeaders(
        Response.json({
          ok: true,
          service: 'shakopee-cs50p-ide',
          liveFetchEnabled: env.ALLOW_LIVE_CS50_API_FETCH === 'true'
        })
      );
    }

    if (url.pathname === '/api/cs50-fetch' && request.method === 'POST') {
      try {
        const payload = await request.json();
        const targetUrl = String(payload?.url || '');
        const method = String(payload?.method || 'GET').toUpperCase();
        const reqHeaders = payload?.headers || {};

        let parsedTarget;
        try {
          parsedTarget = new URL(targetUrl);
        } catch {
          return withIsolationHeaders(
            Response.json({ ok: false, error: `Invalid URL: ${targetUrl}` }, { status: 400 })
          );
        }

        if (!['http:', 'https:'].includes(parsedTarget.protocol) || !isSafeExternalHost(parsedTarget.hostname)) {
          return withIsolationHeaders(
            Response.json({ ok: false, error: 'Blocked URL protocol or private network host.' }, { status: 403 })
          );
        }

        // Only GET/HEAD permitted through the educational bridge
        if (!['GET', 'HEAD'].includes(method)) {
          return withIsolationHeaders(
            Response.json({ ok: false, error: 'Only GET/HEAD requests are supported in the lab proxy.' }, { status: 405 })
          );
        }

        const offlineMock = buildOfflineCS50Response(targetUrl);
        const allowLive = env.ALLOW_LIVE_CS50_API_FETCH === 'true';

        if (allowLive) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const upstream = await fetch(targetUrl, {
              method,
              headers: {
                'User-Agent': reqHeaders['User-Agent'] || 'Shakopee-CS50P-IDE/1.0',
                'Accept': reqHeaders['Accept'] || 'application/json, text/plain, */*'
              },
              signal: controller.signal
            });
            clearTimeout(timer);

            if (upstream.ok) {
              const text = await upstream.text();
              const outHeaders = {};
              upstream.headers.forEach((v, k) => {
                outHeaders[k] = v;
              });
              return withIsolationHeaders(
                Response.json({
                  ok: true,
                  source: 'live',
                  status: upstream.status,
                  headers: outHeaders,
                  body: text
                })
              );
            }
          } catch {
            // Fall through to CS50P offline fixture if upstream failed or timed out
          }
        }

        if (offlineMock) {
          return withIsolationHeaders(
            Response.json({
              ok: true,
              source: 'offline-fixture',
              status: offlineMock.status,
              headers: offlineMock.headers,
              body: offlineMock.body
            })
          );
        }

        return withIsolationHeaders(
          Response.json(
            {
              ok: false,
              error: allowLive
                ? `Unable to reach ${parsedTarget.hostname}`
                : 'External requests are disabled in strict offline lab mode.'
            },
            { status: 502 }
          )
        );
      } catch (err) {
        return withIsolationHeaders(
          Response.json({ ok: false, error: err?.message || 'Proxy error' }, { status: 500 })
        );
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withIsolationHeaders(assetResponse);
  }
};
