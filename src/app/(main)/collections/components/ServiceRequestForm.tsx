'use client';

import { useState } from 'react';
import { createConciergeTask } from '../concierge-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Vehicle {
    id: string;
    name: string;
}

export default function ServiceRequestForm({ collectionId, vehicles }: { collectionId: string, vehicles: Vehicle[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [taskType, setTaskType] = useState('Maintenance');

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        // Append collection_id manually since it's a prop
        formData.append('collection_id', collectionId);

        try {
            const res = await createConciergeTask(formData);

            if (res?.error) {
                toast.error(res.error);
                if (res.fields) {
                    console.error(res.fields);
                }
            } else {
                toast.success('Request submitted!');
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-xl font-bold text-white mb-4">Request Service</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Service Type</Label>
                    <select
                        name="type"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Sourcing">Sourcing (Acquisition)</option>
                        <option value="Logistics">Logistics (Transport)</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Travel">Travel / Concierge</option>
                        <option value="Detailing">Detailing</option>
                        <option value="Storage">Storage</option>
                        <option value="Driving">Driving / Chauffeur</option>
                        <option value="Sales">Sales / Consignment</option>
                        <option value="Event">Event Management</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Vehicle (Optional)</Label>
                    <select
                        name="vehicle_id"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">None / General Collection</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">Title / Subject</Label>
                <Input id="title" name="title" placeholder={
                    taskType === 'Sourcing' ? "e.g. Find 1967 Mustang GT500" :
                        taskType === 'Logistics' ? "e.g. Transport Ferrari to Monterey" :
                            "e.g. Annual Service"
                } required className="bg-neutral-900 border-neutral-800" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Details / Requirements</Label>
                <Textarea id="description" name="description" placeholder="Provide specific details about your request..." className="min-h-[100px] bg-neutral-900 border-neutral-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Requested Date</Label>
                    <div className="relative">
                        <Input type="date" name="scheduled_date" className="bg-neutral-900 border-neutral-800 pl-10" />
                        <Calendar className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="billing_method">Billing Preference</Label>
                    <select
                        name="billing_method"
                        defaultValue="Fixed"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Fixed">Fixed Price</option>
                        <option value="Hourly">Hourly Rate</option>
                        <option value="Commission">Commission %</option>
                    </select>
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Submit Request
            </Button>
        </form>
    );
}
