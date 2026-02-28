import { usePutContentMutation } from "@/store/api/dashboardApi";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState, type FC } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ContentEditorPropsType {
    content: string;
}

const ContentEditor: FC<ContentEditorPropsType> = ({ content: _content }) => {

    const [content, setContent] = useState(_content);
    const [putContent, { isSuccess: contentSaved }] = usePutContentMutation();

    const saveContent = useCallback(() => {
        putContent({ content });
    }, [content]);

    useEffect(() => {
        
    }, [contentSaved]);

    return (
        <div className="flex flex-col gap-[10px]">
        <ReactQuill theme="snow" value={content} onChange={setContent} />
        <Button onClick={saveContent} fullWidth variant="primary">SAVE</Button>
        </div>
    );
}

export default ContentEditor;