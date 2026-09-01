export function FlagSe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
      <path fill="#005293" d="M0 0h640v480H0z" />
      <path fill="#FECB00" d="M176 0v192H0v96h176v192h96V288h368v-96H272V0z" />
    </svg>
  );
}
