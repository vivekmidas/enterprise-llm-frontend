export function Badge({
  children,
  className = 'bg-gray-100 text-gray-800',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
