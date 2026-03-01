import { usePutContentMutation } from "@/store/api/dashboardApi";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState, type FC } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from "react-toastify";

interface ContentEditorPropsType {
    content: string;
}

const ContentEditor: FC<ContentEditorPropsType> = ({ content: _content }) => {

    const [content, setContent] = useState(_content);
    const [putContent, { isSuccess: contentSaved, isLoading: contentSaving }] = usePutContentMutation();

    const saveContent = useCallback(() => {
        putContent({ content });
    }, [content]);

    useEffect(() => {
        if (contentSaved) {
            toast.success('Content saved', {
                autoClose: 7000,
                position: 'top-right'
            })
        }
    }, [contentSaved]);

    return (
        <div className="flex flex-col gap-[10px]">
            <ReactQuill
                theme="snow"
                className="w-full"
                value={content}
                onChange={setContent}
                placeholder="Welcome page content here..."
            />
            <Button isDisabled={contentSaving} onClick={saveContent} fullWidth variant="primary">SAVE</Button>
        </div>
    );
}

export default ContentEditor;