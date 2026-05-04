import { Suspense } from 'react';
import EditEventPage from './client-page';

export function generateStaticParams() {
    return [{ id: '_' }];
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#021313]" />}>
            <EditEventPage />
        </Suspense>
    );
}
