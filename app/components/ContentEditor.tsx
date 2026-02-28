import { Button } from "@heroui/react";
import { useCallback, useState, type FC } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ContentEditorPropsType {
    content: string;
}

const ContentEditor: FC<ContentEditorPropsType> = ({ content: _content }) => {

    const [content, setContent] = useState(_content);

    const saveContent = useCallback(() => {
        
    }, [content]);

    return (
        <div className="flex flex-col gap-[10px]">
        <ReactQuill theme="snow" value={content} onChange={setContent} />
        <Button onClick={saveContent} fullWidth variant="primary">SAVE</Button>
        </div>
    );
}

export default ContentEditor;