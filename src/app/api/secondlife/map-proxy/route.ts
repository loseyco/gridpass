import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for map tile images (keyed by region name)
const mapCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region') || 'Skinny Dip Islands'
  const gridX = searchParams.get('gridX')
  const gridY = searchParams.get('gridY')

  const cacheKey = `${region}_${gridX}_${gridY}`
  const cached = mapCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=43200, immutable',
      },
    })
  }

  // Build target candidate URLs
  const candidateUrls: string[] = []

  if (gridX && gridY) {
    candidateUrls.push(`https://map.secondlife.com/map-1-${gridX}-${gridY}-objects.jpg`)
  }

  const cleanRegionName = region.trim()
  const underscoreRegion = cleanRegionName.replace(/\s+/g, '_')
  const dashRegion = cleanRegionName.replace(/\s+/g, '-')
  const encodedRegion = encodeURIComponent(cleanRegionName)

  candidateUrls.push(
    `https://map.secondlife.com/map-1-${underscoreRegion}-objects.jpg`,
    `https://map.secondlife.com/map-1-${dashRegion}-objects.jpg`,
    `https://map.secondlife.com/map-1-${encodedRegion}-objects.jpg`,
    `https://s3.amazonaws.com/map-secondlife-com/map-1-${underscoreRegion}-objects.jpg`
  )

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      })

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const contentType = res.headers.get('content-type') || 'image/jpeg'

        mapCache.set(cacheKey, {
          buffer,
          contentType,
          timestamp: Date.now(),
        })

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=43200, immutable',
          },
        })
      }
    } catch (e) {
      console.warn(`[Map Proxy] Failed to fetch ${url}`, e)
    }
  }

  // SVG Fallback Graphic if no map tile found
  const fallbackSvg = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#171717"/>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#262626" stroke-width="1"/>
      </pattern>
      <rect width="256" height="256" fill="url(#grid)"/>
      <text x="128" y="120" font-family="monospace" font-size="12" fill="#ef4444" text-anchor="middle" font-weight="bold">${cleanRegionName.toUpperCase()}</text>
      <text x="128" y="140" font-family="sans-serif" font-size="10" fill="#a3a3a3" text-anchor="middle">Awaiting SL Map Sync</text>
    </svg>
  `

  return new NextResponse(fallbackSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  })
}
