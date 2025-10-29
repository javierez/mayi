"use client";

import { useState, useRef } from "react";

export default function WhisperPlayground() {
  const [transcript, setTranscript] = useState("");
  const [jsonResponse, setJsonResponse] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedModel, setSelectedModel] = useState<"whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe">("gpt-4o-transcribe");
  const [useStreaming, setUseStreaming] = useState(false);
  const [prompt, setPrompt] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const startRecording = async () => {
    try {
      addLog("🎬 Starting recording...");

      // Reset state
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Get microphone access
      addLog("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      addLog("✅ Microphone access granted");

      // DIAGNOSTICS: Check if stream is actually working
      const audioTracks = stream.getAudioTracks();
      addLog(`🔍 Audio tracks found: ${audioTracks.length}`);
      audioTracks.forEach((track, i) => {
        addLog(`🔍 Track ${i}: ${track.label} - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
      });

      // Check what MediaRecorder supports
      addLog(`🔍 Checking supported formats...`);
      const formats = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      formats.forEach(format => {
        const supported = MediaRecorder.isTypeSupported(format);
        addLog(`  ${format}: ${supported ? '✅' : '❌'}`);
      });

      // Create MediaRecorder (browser will choose best format)
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      addLog(`🎙️ MediaRecorder created with mimeType: ${mediaRecorder.mimeType}`);
      addLog(`🔍 MediaRecorder state: ${mediaRecorder.state}`);

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        addLog(`📥 ondataavailable fired - data size: ${event.data.size} bytes, type: ${event.data.type}`);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          addLog(`📦 Collected ${event.data.size} bytes (total chunks: ${audioChunksRef.current.length})`);
        } else {
          addLog(`⚠️ WARNING: Received chunk with 0 bytes!`);
        }
      };

      mediaRecorder.onstart = () => {
        addLog(`✅ MediaRecorder started - state: ${mediaRecorder.state}`);
      };

      mediaRecorder.onerror = (event) => {
        addLog(`❌ MediaRecorder error: ${JSON.stringify(event)}`);
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        addLog(`🛑 Recording stopped - state: ${mediaRecorder.state}`);
        addLog(`📊 Total chunks: ${audioChunksRef.current.length}`);
        await processAudio();
      };

      // Start recording with timeslice
      addLog("🎙️ Starting MediaRecorder with 1000ms timeslice...");
      mediaRecorder.start(1000);
      setIsRecording(true);
      addLog("🔴 Recording started - waiting for data chunks...");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error("Full error:", error);
    }
  };

  const stopRecording = () => {
    addLog("🛑 Stopping recording...");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      addLog("✅ Stream stopped");
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      addLog("⚠️ No audio data to process");
      return;
    }

    try {
      setIsProcessing(true);
      addLog("🔄 Processing audio...");

      // Get the actual mimeType from MediaRecorder
      const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
      addLog(`📝 Using mimeType from MediaRecorder: ${mimeType}`);

      // Create blob with the actual mimeType
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      addLog(`📊 Audio blob size: ${audioBlob.size} bytes from ${audioChunksRef.current.length} chunks`);

      if (audioBlob.size < 100) {
        addLog("⚠️ Warning: Audio blob is suspiciously small, might be empty");
      }

      // Create audio URL for playback
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      addLog("🎵 Audio ready for playback");

      // Determine file extension from mime type
      let extension = "webm";
      if (mimeType.includes("mp4")) extension = "mp4";
      else if (mimeType.includes("ogg")) extension = "ogg";
      else if (mimeType.includes("wav")) extension = "wav";

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob, `recording.${extension}`);
      formData.append("model", selectedModel);
      formData.append("language", "es");

      // Response format depends on model
      if (selectedModel === "whisper-1") {
        formData.append("response_format", "verbose_json");
        formData.append("timestamp_granularities", "word,segment");
      } else {
        formData.append("response_format", "json");
      }

      // Add prompt if provided
      if (prompt.trim()) {
        formData.append("prompt", prompt.trim());
      }

      // Add streaming flag
      if (useStreaming && selectedModel !== "whisper-1") {
        formData.append("stream", "true");
      }

      addLog(`📤 Sending ${audioBlob.size} bytes to Whisper API (${selectedModel}) as ${extension}...`);

      // Send to API
      const response = await fetch("/api/whisper/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const data = await response.json();
      addLog("✅ Transcription received");

      // Store full JSON response
      setJsonResponse(data);

      if (data.text) {
        addLog(`💾 Transcript: "${data.text}"`);
        setTranscript(data.text);

        // Log segments if available
        if (data.segments) {
          addLog(`📝 Received ${data.segments.length} segments`);
          data.segments.forEach((segment: { start: number; end: number; text: string }) => {
            addLog(`  [${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] ${segment.text}`);
          });
        }
      } else {
        addLog("⚠️ No transcript in response");
      }

    } catch (error) {
      addLog(`❌ Processing error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearTranscript = () => {
    setTranscript("");
    setJsonResponse(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const downloadJson = () => {
    if (!jsonResponse) return;

    const blob = new Blob([JSON.stringify(jsonResponse, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whisper-transcript-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("📥 JSON downloaded");
  };

  const copyJson = async () => {
    if (!jsonResponse) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonResponse, null, 2));
      addLog("📋 JSON copied to clipboard");
    } catch (error) {
      addLog(`❌ Failed to copy: ${error}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">OpenAI Whisper Transcription Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          {/* Settings */}
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  disabled={isRecording || isProcessing}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="gpt-4o-transcribe">gpt-4o-transcribe (Recommended)</option>
                  <option value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe (Faster)</option>
                  <option value="whisper-1">whisper-1 (Legacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Prompt (Optional)
                  <span className="text-xs text-gray-500 ml-2">Help model with context</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isRecording || isProcessing}
                  placeholder="e.g., This is a conversation about AI technology..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              {selectedModel !== "whisper-1" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useStreaming"
                    checked={useStreaming}
                    onChange={(e) => setUseStreaming(e.target.checked)}
                    disabled={isRecording || isProcessing}
                    className="w-4 h-4"
                  />
                  <label htmlFor="useStreaming" className="text-sm">
                    Enable streaming transcription
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            <div className="space-y-3">
              {isRecording && (
                <div className="flex items-center justify-center gap-3 p-4 bg-red-100 rounded-lg">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-lg font-semibold text-red-700">
                    Recording: {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-100 rounded-lg">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                  <span className="text-lg font-semibold text-blue-700">
                    Processing...
                  </span>
                </div>
              )}
              <button
                onClick={startRecording}
                disabled={isRecording || isProcessing}
                className="w-full rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRecording ? "🔴 Recording..." : "▶️ Start Recording"}
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                ⏹️ Stop Recording
              </button>
              <button
                onClick={clearLogs}
                className="w-full rounded-lg bg-gray-600 px-4 py-3 text-white font-medium hover:bg-gray-700"
              >
                🗑️ Clear Logs
              </button>
              <button
                onClick={clearTranscript}
                className="w-full rounded-lg bg-gray-600 px-4 py-3 text-white font-medium hover:bg-gray-700"
              >
                🗑️ Clear Transcript
              </button>
            </div>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Audio Playback</h2>
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Transcript */}
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            <div className="min-h-[200px] rounded bg-gray-50 p-4">
              {transcript || <span className="text-gray-400">Transcript will appear here after recording...</span>}
            </div>
          </div>

          {/* JSON Response */}
          {jsonResponse && (
            <div className="rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">JSON Response</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyJson}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white font-medium hover:bg-blue-700"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={downloadJson}
                    className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white font-medium hover:bg-green-700"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto rounded bg-gray-900 p-4 font-mono text-xs text-green-400">
                <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="h-[600px] overflow-y-auto rounded bg-black p-4 font-mono text-xs text-green-400">
            {logs.length === 0 ? (
              <div className="text-gray-500">Logs will appear here...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-lg font-semibold mb-2">📝 Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click "Start Recording" to begin</li>
          <li>Allow microphone access when prompted</li>
          <li>Speak in Spanish (the model is configured for "es")</li>
          <li>Click "Stop Recording" when done</li>
          <li>Wait for the audio to be processed by Whisper</li>
          <li>The transcript will appear once processing is complete</li>
        </ol>
      </div>

      {/* Configuration Info */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-lg font-semibold mb-2">⚙️ Current Configuration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Model:</strong> {selectedModel}
          </div>
          <div>
            <strong>Language:</strong> es (Spanish)
          </div>
          <div>
            <strong>Response Format:</strong> {selectedModel === "whisper-1" ? "verbose_json" : "json"}
          </div>
          <div>
            <strong>Audio Format:</strong> Browser default (auto-detected)
          </div>
          <div>
            <strong>Streaming:</strong> {useStreaming && selectedModel !== "whisper-1" ? "Enabled" : "Disabled"}
          </div>
          <div>
            <strong>Prompt:</strong> {prompt ? "Custom" : "None"}
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-lg font-semibold mb-2">📚 Model Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>gpt-4o-transcribe:</strong> Higher quality, supports prompts and streaming
          </div>
          <div>
            <strong>gpt-4o-mini-transcribe:</strong> Faster and cheaper, supports prompts and streaming
          </div>
          <div>
            <strong>whisper-1:</strong> Legacy model with word/segment timestamps, no streaming
          </div>
        </div>
      </div>

      {/* Comparison Note */}
      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-lg font-semibold mb-2">ℹ️ Note: Batch Transcription</h3>
        <p className="text-sm">
          This Whisper playground processes <strong>complete audio files</strong> (batch transcription).
          Record your audio, stop, and then it processes the entire file at once. The newer GPT-4o models
          support streaming results as they process.
        </p>
      </div>
    </div>
  );
}
