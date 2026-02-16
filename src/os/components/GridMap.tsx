'use client'

import React from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface GridMapProps {
    label?: string
    markers?: Array<{ name: string, coordinates: [number, number] }> // [lon, lat]
    height?: number
}

export function GridMap({
    label,
    markers = [],
    height = 400
}: GridMapProps) {
    return (
        <div style={{ width: '100%', background: 'var(--v2-bg-secondary, #111)', borderRadius: '16px', padding: '1rem', overflow: 'hidden' }}>
            {label && <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#888' }}>{label}</div>}

            <div style={{ width: '100%', height }}>
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 100,
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#2a2a2a"
                                    stroke="#333"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#333", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {markers.map(({ name, coordinates }) => (
                        <Marker key={name} coordinates={coordinates}>
                            <circle r={4} fill="#ff4444" stroke="#fff" strokeWidth={1} />
                            <text
                                textAnchor="middle"
                                y={-10}
                                style={{ fontFamily: "system-ui", fill: "#fff", fontSize: "10px", fontWeight: "bold" }}
                            >
                                {name}
                            </text>
                        </Marker>
                    ))}
                </ComposableMap>
            </div>
        </div>
    )
}
