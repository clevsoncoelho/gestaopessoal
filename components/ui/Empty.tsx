export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
        ✦
      </div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-2 text-xs text-slate-500">{text}</p>
    </div>
  );
}
