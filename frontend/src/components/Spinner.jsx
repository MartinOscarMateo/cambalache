export default function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.25" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" />
      </svg>
      <span>{label}</span>
    </div>
  );
}