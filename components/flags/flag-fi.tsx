export function FlagFi({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#003580" d="M0 174v132h640V174z" />
      <path fill="#003580" d="M175.4 0h132v480h-132z" />
    </svg>
  );
}
