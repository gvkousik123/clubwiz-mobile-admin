import { Suspense } from 'react';
import TicketDetailPage from './client-page';

export function generateStaticParams() {
    return [{ ticketId: '_' }];
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#021313]" />}>
            <TicketDetailPage />
        </Suspense>
    );
}
