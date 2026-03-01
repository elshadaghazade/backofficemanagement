import Link from "next/link";
import type { FC } from "react";

const Logo: FC = () => {
    return (
        <div className="mb-8 text-center">
            <Link href={'/'}>
                <span className="inline-flex items-center gap-2">
                    <span className="size-8 rounded-lg bg-violet-500 grid place-items-center text-foreground font-bold text-sm">B</span>
                    <span className="text-foreground font-semibold tracking-wide text-lg">Back Office Management</span>
                </span>
            </Link>
        </div>
    );
}

export default Logo;