export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-body">This module is ready for implementation.</p>
    </div>
  )
}
