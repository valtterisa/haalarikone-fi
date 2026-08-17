import { cn } from '@/lib/utils';

function Digit({
  digit,
  hex,
  missing,
  className,
}: {
  digit: string;
  hex?: string;
  missing?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card',
        missing ? 'border-dashed border-foreground/30' : 'border-border',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-4 sm:w-5',
          missing ? 'border-r border-dashed border-foreground/25 bg-muted' : 'border-r border-border',
        )}
        style={missing || !hex ? undefined : { backgroundColor: hex }}
      />
      <span
        className={cn(
          'block py-5 pl-7 pr-5 font-display text-6xl font-bold leading-none tracking-tight sm:py-7 sm:pl-9 sm:pr-6 sm:text-8xl',
          missing ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {digit}
      </span>
    </div>
  );
}

export function NotFoundMark({ hexes }: { hexes: string[] }) {
  const left = hexes[0] ?? '#65a30d';
  const right = hexes[Math.min(8, Math.max(hexes.length - 1, 0))] ?? '#be123c';

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3" aria-hidden>
      <Digit digit="4" hex={left} className="-rotate-2" />
      <Digit digit="0" missing className="rotate-1" />
      <Digit digit="4" hex={right} className="rotate-2" />
    </div>
  );
}
