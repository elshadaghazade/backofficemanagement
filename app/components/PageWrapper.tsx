import type { FC, ReactNode } from "react";
import Logo from "./Logo";
import Footer from "./Footer";

interface PageWrapperPropsType {
    children: ReactNode;
    logo?: ReactNode;
    footer?: ReactNode;
}

const PageWrapper: FC<PageWrapperPropsType> = ({ 
    children,
    logo=<Logo />,
    footer=<Footer /> 
}) => {
    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">

            <div className="pointer-events-none fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />

            <div className="relative w-[75%] flex flex-col flex-wrap items-center justify-center">
                {logo}
                {children}
                {footer}
            </div>
        </main>
    );
}

export default PageWrapper;