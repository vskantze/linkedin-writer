"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [post, setPost] = useState("");
  const [examples, setExamples] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.onstop = handleTranscribe;

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleTranscribe = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setTranscript(data.text);
  };

  const handleRewrite = async () => {
    setPost("");

    const res = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, examples }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setPost((prev) => prev + chunk);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-10 gap-6">
      <h1 className="text-3xl font-bold">Voice → LinkedIn Post</h1>
        
        <textarea
        placeholder='Paste 3–5 of your previous LinkedIn posts separated with "-----", here to train the tone of voice'
        value={examples}
        onChange={(e) => setExamples(e.target.value)}
        className="w-full max-w-xl p-3 border rounded"
        />

      {!recording ? (
        <button
          onClick={startRecording}
          className="px-6 py-2 bg-green-600 text-white rounded"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="px-6 py-2 bg-red-600 text-white rounded"
        >
          Stop Recording
        </button>
      )}

      {transcript && (
        <>
          <div className="max-w-xl p-4 border rounded bg-gray-100">
            <h2 className="font-semibold mb-2">Transcript</h2>
            <p>{transcript}</p>
          </div>

          <button
            onClick={handleRewrite}
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            Generate LinkedIn Post
          </button>
        </>
      )}

      {post && (
        <div className="max-w-xl p-4 border rounded bg-white whitespace-pre-line">
          <h2 className="font-semibold mb-2">LinkedIn Post</h2>
          {post}
        </div>
      )}
    </div>
  );
}