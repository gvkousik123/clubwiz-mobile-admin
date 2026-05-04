import { Suspense } from 'react';
import EditClubPage from './client-page';

export function generateStaticParams() {
    return [{ id: '_' }];
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#021313]" />}>
            <EditClubPage />
        </Suspense>
    );
}
