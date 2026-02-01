'use client';

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LiveMapProps {
    data: { code: string, count: number }[];
}

export default function LiveMap({ data }: LiveMapProps) {
    // Basic color scale
    const colorScale = scaleLinear<string>()
        .domain([0, Math.max(...data.map(d => d.count), 1)])
        .range(["#262626", "#6366f1"]); // Neutral-800 to Indigo-500

    return (
        <div className="w-full h-[400px] overflow-hidden rounded-xl bg-neutral-900 border border-white/5 relative">
            <h3 className="absolute top-4 left-6 text-lg font-bold text-white z-10 flex items-center gap-2">
                User Locations
                <span className="text-xs font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                    {data.reduce((a, b) => a + b.count, 0)} Tracked
                </span>
            </h3>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120,
                    center: [0, 20]
                }}
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo) => {
                            // Find data for this country (using ISO A2 or Name - keeping it simple for now)
                            // GeoJSON usually has ISO A3 or Name. Our 'country' from Vercel is usually ISO A2 (US, GB).
                            // This might need a lookup map, but let's try direct map or just visualize bubbles later.
                            // For now, let's just color based on match.
                            // The topojson usually has `properties.ISO_A2` or similar.

                            // Let's assume user just wants to see the map first.

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#262626"
                                    stroke="#404040"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#404040", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>

                {/* Render markers for known countries if available (simplified) */}
                {/* For MVP, let's just show the map. Color integration requires consistent ISO codes. */}
            </ComposableMap>

            {/* Overlay for "No Data" if empty */}
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-neutral-500 text-sm">Waiting for Geo-Data...</p>
                </div>
            )}
        </div>
    );
}
