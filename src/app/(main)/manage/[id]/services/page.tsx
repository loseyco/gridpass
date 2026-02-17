'use client'

import React, { useState, useEffect, use } from 'react'
import { getServices, createService, deleteService, Service } from '@/app/actions/org-services'
import { Plus, Trash, Tag, DollarSign, Loader2 } from 'lucide-react'

export default function ServicesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: orgId } = use(params)
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [addingService, setAddingService] = useState(false)

    useEffect(() => {
        loadServices()
    }, [])

    const loadServices = async () => {
        try {
            const data = await getServices(orgId)
            setServices(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setAddingService(true)
        const formData = new FormData(e.currentTarget)

        try {
            await createService(orgId, formData)
            await loadServices()
            setIsAdding(false)
        } catch (err) {
            alert('Failed to add service')
        } finally {
            setAddingService(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return
        try {
            await deleteService(orgId, id)
            // Optimistic update
            setServices(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            alert('Failed to delete service')
        }
    }

    return (
        <div className="services-page">
            <div className="header">
                <div>
                    <h1>Services & Products</h1>
                    <p>Manage the items available for booking on your site.</p>
                </div>
                <button className="add-btn" onClick={() => setIsAdding(true)}>
                    <Plus size={18} />
                    Add Service
                </button>
            </div>

            {isAdding && (
                <div className="add-card">
                    <h3>Add New Service</h3>
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label>Service Name</label>
                            <input name="name" placeholder="e.g. Basic Detail" required />
                        </div>
                        <div className="form-group">
                            <label>Price ($)</label>
                            <input name="price" type="number" step="0.01" placeholder="0.00" required />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea name="description" placeholder="What's included in this service?" rows={3} />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button type="submit" className="save-btn" disabled={addingService}>
                                {addingService ? <Loader2 className="animate-spin" size={16} /> : 'Save Service'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading-state"><Loader2 className="animate-spin" /></div>
            ) : services.length === 0 ? (
                <div className="empty-state">
                    <Tag size={48} />
                    <h3>No services yet</h3>
                    <p>Add your first service to start accepting bookings.</p>
                </div>
            ) : (
                <div className="services-list">
                    {services.map(service => (
                        <div key={service.id} className="service-card">
                            <div className="service-info">
                                <div className="service-header">
                                    <h3>{service.name}</h3>
                                    <div className="price-tag">
                                        <DollarSign size={14} />
                                        {service.price.toFixed(2)}
                                    </div>
                                </div>
                                <p>{service.description || 'No description provided.'}</p>
                            </div>
                            <div className="service-actions">
                                <button className="delete-btn" onClick={() => handleDelete(service.id)}>
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .services-page { max-width: 800px; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                h1 { font-size: 1.5rem; margin: 0; }
                p { color: #888; margin: 0; }
                
                .add-btn {
                    background: var(--v2-accent-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                }

                .add-card {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .form-group { margin-bottom: 1rem; }
                label { display: block; margin-bottom: 0.5rem; color: #ccc; font-size: 0.875rem; }
                input, textarea {
                    width: 100%;
                    padding: 0.75rem;
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 6px;
                    color: white;
                }

                .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
                .cancel-btn { background: transparent; border: 1px solid #333; color: #ccc; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
                .save-btn { background: white; color: black; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; }

                .services-list { display: flex; flex-direction: column; gap: 1rem; }
                .service-card {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .service-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
                .service-header h3 { margin: 0; font-size: 1.1rem; }
                .price-tag { 
                    background: rgba(255, 255, 255, 0.1); 
                    padding: 2px 8px; 
                    border-radius: 100px; 
                    font-size: 0.8rem; 
                    display: flex; 
                    align-items: center; 
                    color: #4ade80; 
                }
                .service-info p { font-size: 0.9rem; color: #888; }
                .delete-btn {
                    background: transparent;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: color 0.2s;
                }
                .delete-btn:hover { color: #ff4d4d; }
                
                .empty-state { text-align: center; padding: 4rem 0; color: #444; }
                .empty-state h3 { color: #fff; margin-top: 1rem; margin-bottom: 0.5rem; }
            `}</style>
        </div>
    )
}
