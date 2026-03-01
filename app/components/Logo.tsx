import { Breadcrumbs } from "@heroui/react";
import Link from "next/link";
import type { FC } from "react";

interface LogoPropsType {
    breadcrumb?: boolean;
}

const Logo: FC<LogoPropsType> = ({
    breadcrumb
}) => {
    return (
        <div className="mb-8 text-center">
            <Link href={'/'}>
                <span className="inline-flex items-center gap-2">
                    <span className="size-8 rounded-lg bg-violet-500 grid place-items-center text-foreground font-bold text-sm">B</span>
                    <span className="text-foreground font-semibold tracking-wide text-lg">Back Office Management</span>
                </span>
            </Link>
            {breadcrumb ? (
                <div className="flex justify-center items-center mt-[20px]">
                    <Breadcrumbs separator=" | ">
                        <Breadcrumbs.Item href="#"></Breadcrumbs.Item>
                        <Breadcrumbs.Item href="/">Dashboard</Breadcrumbs.Item>
                        <Breadcrumbs.Item href="/dashboard/users">Users</Breadcrumbs.Item>
                        <Breadcrumbs.Item href="/dashboard/users/sessions">Sessions</Breadcrumbs.Item>
                        <Breadcrumbs.Item href="#"></Breadcrumbs.Item>
                    </Breadcrumbs>
                </div>
            ) : ''}
        </div>
    );
}

export default Logo;