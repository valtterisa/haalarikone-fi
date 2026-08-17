type ColorAtmosphereProps = {
  hexes: string[];
};

export function ColorAtmosphere({ hexes }: ColorAtmosphereProps) {
  const swatches = hexes.filter(Boolean).slice(0, 28);
  if (swatches.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-[0.18] dark:opacity-[0.12]"
    >
      <div className="flex h-full w-full">
        {swatches.map((hex, i) => (
          <span key={`${hex}-${i}`} className="h-full min-w-0 flex-1" style={{ backgroundColor: hex }} />
        ))}
      </div>
      <div className="absolute inset-0 bg-card/88 dark:bg-card/82" />
    </div>
  );
}
