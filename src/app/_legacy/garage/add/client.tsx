'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VehicleForm from '@/components/profile/VehicleForm';
import { addVehicle } from '@/app/actions/garage';
import { toast } from 'sonner';

export default function AddVehicleClient({ userId }: { userId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const collectionId = searchParams.get('collection_id');

    const handleSubmit = async (data: any) => {
        try {
            if (collectionId) {
                data.collection_id = collectionId;
            }
            await addVehicle(data);
            toast.success('Vehicle added successfully');
            if (collectionId) {
                router.push(`/collections/${collectionId}`);
            } else {
                router.push('/dashboard/vehicles');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add vehicle');
        }
    };

    return (
        <div>
            <Link
                href={collectionId ? `/collections/${collectionId}` : "/dashboard/vehicles"}
                className="flex items-center text-neutral-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Link>

            <h1 className="text-3xl font-black text-white mb-8">Add New Vehicle</h1>

            <div className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                <VehicleForm
                    userId={userId}
                    onSubmit={handleSubmit}
                    onCancel={() => router.back()}
                    submitLabel="Add Vehicle"
                />
            </div>
        </div>
    );
}
