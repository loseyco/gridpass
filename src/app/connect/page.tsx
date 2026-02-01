import { redirect } from 'next/navigation';

export default function ConnectPage() {
    redirect('/command-center?action=link');
}
