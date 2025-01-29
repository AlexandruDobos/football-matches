import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Quill's default CSS

const RichTextEditor = ({ description, setDescription }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
    });

    // Set the initial value
    quill.root.innerHTML = description;

    // Update the description state on change
    quill.on('text-change', () => {
      setDescription(quill.root.innerHTML);
    });
  }, [description, setDescription]);

  return <div ref={editorRef} style={{
    height: '300px', // Adjust the height here
    overflow: 'auto',
  }} />;
};

export default RichTextEditor;