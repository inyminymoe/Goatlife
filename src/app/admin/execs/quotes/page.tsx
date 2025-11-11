export const dynamic = 'force-dynamic';

import ExecQuotesAdmin from '@/components/admin/ExecQuotesAdmin';

export default function Page() {
  return (
    <main className="bg-grey-100 rounded-[5px] px-[25px] py-5 mb-5 col-span-2">
      <ExecQuotesAdmin />
    </main>
  );
}
