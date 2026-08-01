import ClientPage from './client-page.tsx';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [{ ticketId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
