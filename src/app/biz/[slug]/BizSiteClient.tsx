'use client'
import React from 'react'
import { GridRenderer } from '@/os/core/GridRenderer'
import { AUTO_DETAILER_TEMPLATE } from '@/os/apps/templates/auto-detailer-template'
import { submitBooking } from '@/app/actions/org-bookings'

interface BizSiteClientProps {
    org: any
}

export default function BizSiteClient({ org }: BizSiteClientProps) {
    // Select template based on site_template field
    let schema = org.site_schema

    // If no custom schema, use template
    if (!schema || Object.keys(schema).length === 0) {
        if (org.site_template === 'auto_detailer') {
            schema = AUTO_DETAILER_TEMPLATE
        } else {
            // Default fallback
            schema = AUTO_DETAILER_TEMPLATE
        }
    }

    // Replace template variables with actual data
    const processedSchema = replaceTemplateVars(schema, org)

    const handleBookingSubmit = async (bookingData: any) => {
        try {
            await submitBooking(bookingData)
            // Success is handled in the component itself
        } catch (error) {
            console.error('Booking submission error:', error)
            alert('Failed to submit booking. Please try again.')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
            <GridRenderer
                schema={processedSchema}
                data={{
                    ...org,
                    // Ensure array data is properly passed
                    org_services: org.org_services || [],
                    org_gallery: org.org_gallery || [],
                    org_hours: org.org_hours || [],
                    org_social_links: org.org_social_links || []
                }}
            />
        </div>
    )
}

// Helper to replace {{variable}} placeholders in schema
function replaceTemplateVars(schema: any, data: any): any {
    if (typeof schema === 'string') {
        return schema.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match
        })
    }

    if (Array.isArray(schema)) {
        return schema.map(item => replaceTemplateVars(item, data))
    }

    if (typeof schema === 'object' && schema !== null) {
        const result: any = {}
        for (const key in schema) {
            result[key] = replaceTemplateVars(schema[key], data)
        }
        return result
    }

    return schema
}
