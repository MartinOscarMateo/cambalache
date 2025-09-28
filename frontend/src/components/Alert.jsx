export default function Alert({ children }) {
  return (
    <div role="alert" className="mt-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {children}
    </div>
  );
}