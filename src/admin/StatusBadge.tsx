export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: string | null }) {
  const scheduled = status === 'published' && publishedAt && new Date(publishedAt) > new Date();
  const [label, tone] = scheduled ? ['Programado', 'bg-blue-100 text-blue-800']
    : status === 'published' ? ['Publicado', 'bg-green-100 text-green-800']
    : status === 'archived' ? ['Archivado', 'bg-gray-200 text-gray-700']
    : ['Borrador', 'bg-amber-100 text-amber-900'];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${tone}`}>{label}</span>;
}
