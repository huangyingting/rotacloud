import { redirect } from 'next/navigation';

export default async function NumericAccountIdAliasPage({
  params,
}: {
  params: Promise<{ accountId: string; slug: string[] }>;
}) {
  const { slug } = await params;
  const first = slug?.[0] || 'dashboard';
  const validAppRoutes = new Set([
    'dashboard',
    'calendar',
    'rotas',
    'employees',
    'locations',
    'roles',
    'groups',
    'documents',
    'memos',
    'leave',
    'attendance',
    'terminals',
    'availability',
    'budgets',
    'reports',
    'settings',
    'activity',
    'deleted-shifts',
  ]);

  const aliasMap: Record<string, string> = {
    'past-employees': '/app/employees',
    'leave-embargoes': '/app/leave',
    toil: '/app/leave',
    'repeating-patterns': '/app/availability',
  };

  if (aliasMap[first]) {
    redirect(aliasMap[first]);
  }
  if (validAppRoutes.has(first)) {
    redirect(`/app/${first}`);
  }
  redirect('/app/dashboard');
}
