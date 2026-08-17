import { Link } from '@/i18n/routing';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function Logo({
  className = 'h-9 w-auto',
  width = 160,
  height = 64,
  priority = false,
}: LogoProps) {
  return (
    <Link href="/" className="flex w-fit items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
      <Image
        src="/haalarikone-logo.png"
        alt="Haalarikone"
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
      Haalarikone
    </Link>
  );
}
