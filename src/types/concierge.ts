export type ConciergeTaskType =
    'Sourcing' |
    'Logistics' |
    'Maintenance' |
    'Travel' |
    'Detailing' |
    'Storage' |
    'Driving' |
    'Sales' |
    'Event' |
    'Other';

export type ConciergeTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type BillingMethod = 'Fixed' | 'Hourly' | 'Commission' | 'Reimbursement';

export type InvoiceStatus = 'Unbilled' | 'Invoiced' | 'Paid';

export interface ConciergeTask {
    id: string;
    collection_id: string;
    vehicle_id?: string | null;
    type: ConciergeTaskType;
    status: ConciergeTaskStatus;
    title: string;
    description?: string | null;
    scheduled_date?: string | null;
    completed_date?: string | null;

    // Billing
    billing_method: BillingMethod;
    estimated_cost?: number | null;
    actual_cost?: number | null;
    client_price?: number | null;
    commission_rate?: number | null;
    hours_logged?: number | null;
    hourly_rate?: number | null;
    invoice_status: InvoiceStatus;

    attachments?: string[] | null;
    assigned_to?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;

    // Optional joined fields
    vehicle?: {
        id: string;
        year: number;
        make: string;
        model: string;
    } | null;
}
