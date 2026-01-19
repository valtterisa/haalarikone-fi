import { Link } from "@/i18n/routing";
import Image from "next/image";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
}

export default function Logo({
    className = "h-12 w-auto",
    width = 200,
    height = 80,
    priority = false,
}: LogoProps) {


    return <Link href={"/"} className="flex items-center w-fit"><Image
        src="/haalarikone-logo.png"
        alt="Haalarikone"
        width={width}
        height={height}
        className={className}
        priority={priority}
    />Haalarikone</Link>;
}

