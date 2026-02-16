export const AUTO_DETAILER_TEMPLATE = {
    component: 'Container',
    props: { className: 'v2-content', style: { padding: 0, maxWidth: '100%', margin: '0 auto', background: '#0a0a0a', minHeight: '100vh', color: '#fff' } },
    children: [
        // Hero Section
        {
            component: 'Container',
            props: {
                style: {
                    background: 'linear-gradient(to bottom, #111 0%, #050505 100%)',
                    padding: '6rem 2rem',
                    textAlign: 'center',
                    borderBottom: '1px solid #222',
                    position: 'relative',
                    overflow: 'hidden'
                }
            },
            children: [
                // Background Glow (Simulated)
                {
                    component: 'Container',
                    props: {
                        style: {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '600px',
                            height: '600px',
                            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }
                    }
                },
                {
                    component: 'Container',
                    props: {
                        children: '{{name}}',
                        style: { fontSize: '4rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }
                    }
                },
                {
                    component: 'Container',
                    props: {
                        children: '{{description}}',
                        style: { fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', position: 'relative', zIndex: 1 }
                    }
                },
                {
                    component: 'Container',
                    props: {
                        style: { marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }
                    },
                    children: [
                        {
                            component: 'BookingButton', // Custom component we might need or just use the form link
                            props: {
                                children: 'Book Appointment',
                                style: { background: '#dc2626', color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }
                            }
                        }
                    ]
                }
            ]
        },

        // Services Section
        {
            component: 'Container',
            props: { style: { padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' } },
            children: [
                {
                    component: 'Container',
                    props: {
                        children: 'Our Services',
                        style: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }
                    }
                },
                {
                    component: 'Container',
                    props: {
                        children: 'Professional auto detailing packages tailored to your needs.',
                        style: { textAlign: 'center', color: '#71717a', marginBottom: '3rem', fontSize: '1.1rem' }
                    }
                },
                {
                    component: 'GridServiceCard',
                    bind: 'org_services'
                }
            ]
        },

        // Gallery Section
        {
            component: 'Container',
            props: { style: { padding: '4rem 2rem', background: '#111', borderTop: '1px solid #222', borderBottom: '1px solid #222' } },
            children: [
                {
                    component: 'Container',
                    props: {
                        style: { maxWidth: '1200px', margin: '0 auto' }
                    },
                    children: [
                        {
                            component: 'Container',
                            props: {
                                children: 'Recent Work',
                                style: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }
                            }
                        },
                        {
                            component: 'GridGallery',
                            props: { columns: 3 },
                            bind: 'org_gallery'
                        }
                    ]
                }
            ]
        },

        // Booking Section
        {
            component: 'Container',
            props: {
                style: {
                    padding: '6rem 2rem',
                    background: '#0a0a0a',
                    maxWidth: '800px',
                    margin: '0 auto'
                }
            },
            children: [
                {
                    component: 'Container',
                    props: {
                        children: 'Ready to Transform Your Vehicle?',
                        style: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }
                    }
                },
                {
                    component: 'GridBookingForm',
                    props: { orgId: '{{org_id}}' },
                    bind: 'org_services'
                }
            ]
        },

        // Footer / Info
        {
            component: 'Container',
            props: { style: { padding: '4rem 2rem', background: '#050505', borderTop: '1px solid #222' } },
            children: [
                {
                    component: 'Container',
                    props: {
                        style: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }
                    },
                    children: [
                        // Contact Info
                        {
                            component: 'Container',
                            children: [
                                { component: 'Container', props: { children: 'Contact', style: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' } } },
                                { component: 'Container', props: { children: '📍 {{location}}', style: { color: '#a1a1aa', marginBottom: '0.5rem' } } },
                                { component: 'Container', props: { children: '📞 {{phone}}', style: { color: '#a1a1aa', marginBottom: '0.5rem' } } },
                                { component: 'Container', props: { children: '✉️ {{contact_email}}', style: { color: '#a1a1aa', marginBottom: '0.5rem' } } },
                            ]
                        },
                        // Hours
                        {
                            component: 'Container',
                            children: [
                                { component: 'Container', props: { children: 'Hours', style: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' } } },
                                { component: 'GridBusinessHours', bind: 'org_hours' }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
