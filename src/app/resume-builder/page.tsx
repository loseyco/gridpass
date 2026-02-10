import { Metadata } from 'next';
import ResumeBuilder from './ResumeBuilder';

export const metadata: Metadata = {
    title: 'Professional Racing Resumes | GridPass',
    description: 'Stop sending PDFs. Build a live, professional racing resume that gets you hired by top teams. Custom built for $20 for a limited time.',
    openGraph: {
        title: 'Get Hired in Motorsports with a Pro Resume',
        description: 'Stop sending PDFs. Build a live, professional racing resume that gets you hired by top teams.',
        url: 'https://gridpass.app/resume-builder',
        siteName: 'GridPass',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: 'https://gridpass.app/og-resume.png',
                width: 1200,
                height: 630,
                alt: 'GridPass Professional Racing Resumes',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Get Hired in Motorsports with a Pro Resume',
        description: 'Stop sending PDFs. Build a live, professional racing resume that gets you hired by top teams.',
        images: ['https://gridpass.app/og-resume.png'],
        creator: '@pjlosey',
    },
};

export default function ResumeBuilderPage() {
    return <ResumeBuilder />;
}
