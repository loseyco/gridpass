'use client'
import React from 'react'

interface Service {
    id?: string
    name: string
    description?: string
    price: number
    currency?: string
    features: string[]
    is_featured?: boolean
}

interface GridServiceCardProps {
    services?: Service[]
    onSelect?: (serviceId: string) => void
}

export function GridServiceCard({ services = [], onSelect }: GridServiceCardProps) {
    if (!services || services.length === 0) {
        return <div className="v2-text-secondary">No services available</div>
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            margin: '2rem 0'
        }}>
            {services.map((service, index) => (
                <div
                    key={service.id || index}
                    style={{
                        background: service.is_featured ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#1a1a1a',
                        border: service.is_featured ? '2px solid #667eea' : '1px solid #333',
                        borderRadius: '12px',
                        padding: '2rem',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: onSelect ? 'pointer' : 'default',
                        boxShadow: service.is_featured ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none'
                    }}
                    onClick={() => onSelect && service.id && onSelect(service.id)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = service.is_featured
                            ? '0 12px 32px rgba(102, 126, 234, 0.4)'
                            : '0 8px 24px rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = service.is_featured
                            ? '0 8px 24px rgba(102, 126, 234, 0.3)'
                            : 'none'
                    }}
                >
                    {service.is_featured && (
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: '#ffd700',
                            color: '#000',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            Popular
                        </div>
                    )}

                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: service.is_featured ? '#fff' : '#fff'
                    }}>
                        {service.name}
                    </div>

                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: service.is_featured ? '#fff' : '#667eea'
                    }}>
                        ${service.price}
                        <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#888' }}>
                            {service.currency !== 'USD' ? ` ${service.currency}` : ''}
                        </span>
                    </div>

                    {service.description && (
                        <div style={{
                            color: service.is_featured ? 'rgba(255,255,255,0.9)' : '#aaa',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {service.description}
                        </div>
                    )}

                    {service.features && service.features.length > 0 && (
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            color: service.is_featured ? '#fff' : '#ccc'
                        }}>
                            {service.features.map((feature, i) => (
                                <li key={i} style={{
                                    marginBottom: '0.75rem',
                                    paddingLeft: '1.5rem',
                                    position: 'relative',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        color: service.is_featured ? '#ffd700' : '#667eea',
                                        fontWeight: 'bold'
                                    }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    )
}
