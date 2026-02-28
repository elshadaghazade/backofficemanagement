import { memo, type FC } from "react";

const Footer: FC = () => {
    return (
        <p className="mt-6 text-center text-xs text-foreground-quaternary">
          &copy; Copyright 2026
        </p>
    );
}

export default memo(Footer);