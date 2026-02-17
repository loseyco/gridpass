import { redirect } from 'next/navigation';

export default function LinkPage() {
    redirect('/command-center?action=link');
}
