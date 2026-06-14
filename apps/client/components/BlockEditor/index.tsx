import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

export default function BlockNoteEditor({ setIssue }) {
  const editor = useCreateBlockNote();

  return (
    <BlockNoteView
      //@ts-ignore
      editor={editor}
      sideMenu={false}
      theme="light"
      onChange={() => {
        setIssue(editor.document);
      }}
    />
  );
}
