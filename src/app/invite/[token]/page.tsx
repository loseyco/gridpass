import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{
        token: string;
    }>;
}

export default async function InvitePage(props: Props) {
    const params = await props.params;
    const token = params.token;

    // Redirect to new unified entry point
    redirect(`/join?token=${token}`);
}
