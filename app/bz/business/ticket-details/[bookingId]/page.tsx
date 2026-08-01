import ClientPage from './client-page.tsx';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [{ bookingId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
