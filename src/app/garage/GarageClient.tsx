'use client'

import Link from 'next/link'

interface GarageClientProps {
    vehicles: any[]
}

export default function GarageClient({ vehicles }: GarageClientProps) {
    return (
        <>
            <div className="v2-header">
                <Link href="/" className="v2-link">
                    ← Home
                </Link>
                <h1 className="v2-title">
                    <span className="v2-text-white">GRID</span>
                    <span className="v2-text-accent">PASS</span>
                </h1>
                <div style={{ width: '40px' }} />
            </div>

            <div className="v2-content">
                <div className="flex-header">
                    <h2 className="v2-heading-2">Garage</h2>
                    <Link href="/garage/add" className="v2-btn v2-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                        + Add
                    </Link>
                </div>

                {vehicles.length === 0 ? (
                    <div className="v2-card garage-empty">
                        <div className="empty-icon">🏎️</div>
                        <h3 className="v2-heading-3">No Vehicles</h3>
                        <p className="v2-text-secondary v2-mb-4">Start building your dream garage collection.</p>
                        <Link href="/garage/add" className="v2-btn v2-btn-primary">
                            Add Vehicle
                        </Link>
                    </div>
                ) : (
                    <div className="vehicle-grid">
                        {vehicles.map((vehicle) => (
                            <Link key={vehicle.id} href={`//garage/${vehicle.id}`} className="v2-card vehicle-card">
                                <div className="vehicle-image-placeholder">
                                    <span className="vehicle-year">{vehicle.year}</span>
                                </div>
                                <div className="vehicle-info">
                                    <h3 className="vehicle-name">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                                    <p className="vehicle-detail">{vehicle.trim || 'Base Model'}</p>
                                </div>
                                <div className="vehicle-arrow">→</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .flex-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--v2-space-4);
                    border-left: 3px solid var(--v2-accent-primary);
                    padding-left: var(--v2-space-2);
                }

                .garage-empty {
                    text-align: center;
                    padding: var(--v2-space-6) var(--v2-space-4);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .vehicle-grid {
                    display: grid;
                    gap: var(--v2-space-3);
                }

                .vehicle-card {
                    display: flex;
                    align-items: center;
                    padding: var(--v2-space-3);
                    gap: var(--v2-space-3);
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .vehicle-card:hover {
                    border-color: var(--v2-accent-primary);
                    transform: translateX(4px);
                }

                .vehicle-image-placeholder {
                    width: 60px;
                    height: 60px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--v2-border);
                    border-radius: var(--v2-radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: var(--v2-text-tertiary);
                    font-family: var(--v2-font-racing);
                    font-size: 1.2rem;
                }

                .vehicle-info {
                    flex: 1;
                    min-width: 0;
                }

                .vehicle-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--v2-text-primary);
                    margin: 0 0 0.25rem 0;
                    font-family: var(--v2-font-racing);
                    font-style: italic;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .vehicle-detail {
                    font-size: var(--v2-text-sm);
                    color: var(--v2-text-secondary);
                    margin: 0;
                }

                .vehicle-arrow {
                    color: var(--v2-text-tertiary);
                    font-weight: bold;
                    transition: transform 0.2s;
                }

                .vehicle-card:hover .vehicle-arrow {
                    color: var(--v2-accent-primary);
                    transform: translateX(4px);
                }
            `}</style>
        </>
    )
}
