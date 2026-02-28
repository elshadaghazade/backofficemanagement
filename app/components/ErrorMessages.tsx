import { ErrorMessage } from "@heroui/react";
import { FC, memo } from "react";

interface ErrorMessagesPropsType {
    messages?: string[];
}

const ErrorMessages: FC<ErrorMessagesPropsType> = ({ messages }) => {
    if (!messages?.length) {
        return <></>;
    }

    if (messages.length === 1) {
        return <ErrorMessage>{messages[0]}</ErrorMessage>
    }
    
    return (
        <ul className="list-disc list-inside pl-2 leading-none text-[#f00]">
            {messages.map((message, i) => (
                <li key={`ermsg${message}${i}`}><ErrorMessage>{message}</ErrorMessage></li>
            ))}
        </ul>
    );
}

export default memo(ErrorMessages);