import { Metadata } from 'next';
import { getMyServices } from '@/app/actions/services';
import { ServiceManager } from './ServiceManager';

export const metadata: Metadata = {
    title: 'My Services | GridPass Dashboard',
};

export default async function DashboardServicesPage() {
    const services = await getMyServices();

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <ServiceManager initialServices={services} />
        </div>
    );
}
