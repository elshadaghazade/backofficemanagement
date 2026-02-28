import { Card } from "@heroui/react";
import { type FC, memo } from "react";

interface AuthCardHeaderPropsType {
    title: string;
    description: string;
}

const AuthCardHeader: FC<AuthCardHeaderPropsType> = ({ title, description }) => {
    return (
        <Card.Header className="pb-2">
            <div>
                <Card.Title className="text-foreground text-2xl font-semibold tracking-tight">
                    {title}
                </Card.Title>
                <Card.Description className="text-white/40 mt-1 text-sm">
                    {description}
                </Card.Description>
            </div>
        </Card.Header>
    );
}

export default memo(AuthCardHeader);