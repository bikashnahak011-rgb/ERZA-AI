import { useState, useRef, useCallback } from "react";
import { MODES } from "../config/jarvis";

const SUGGESTIONS = [
  "Teach me React hooks",
  "What is the MERN stack?",
  "Explain CSS Flexbox",
  "Create a JavaScript quiz",
  "Debug my code",
  "Make a study plan",
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function InputBar({ onSend, loading, mode, lang }) {
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState("chat");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const onSendRef = useRef(onSend);        // ← always keep latest onSend
  onSendRef.current = onSend;              // update every render
  const activeMode = MODES[mode];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) { onSend(text); setText(""); }
    }
  };

  // ── Voice ────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) { setMicError("Your browser doesn't support voice input. Try Chrome!"); return; }
    if (isListening) return;

    const rec = new SpeechRecognition();
    rec.lang = lang === "hinglish" ? "hi-IN" : "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    recognitionRef.current._final = "";

    setMicError(""); setTranscript(""); setIsListening(true);

    rec.onresult = (e) => {
      let interim = "", final = "";
      for (const r of e.results) {
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(final || interim);
      if (final) recognitionRef.current._final = final;
    };

    rec.onerror = (e) => {
      setIsListening(false); setTranscript("");
      if (e.error === "no-speech") setMicError("No speech detected. Try again!");
      else if (e.error === "not-allowed") setMicError("Mic permission denied. Please allow microphone access.");
      else setMicError("Voice error: " + e.error);
    };

    rec.onend = () => {
      setIsListening(false);
      const final = recognitionRef.current?._final || "";
      setTranscript("");
      if (final.trim()) {
        onSendRef.current(final.trim());   // ← use ref, never stale
      }
    };

    rec.start();
  }, [isListening, lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript("");
  }, []);

  return (
    <div className="input-area">

      {/* Suggestions */}
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion-chip" onClick={() => onSend(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      {/* Mode Toggle */}
      <div className="input-mode-toggle">
        <button
          className={`imt-btn ${inputMode === "chat" ? "imt-active" : ""}`}
          onClick={() => { setInputMode("chat"); stopListening(); setMicError(""); }}
        >
          💬 Chat
        </button>
        <button
          className={`imt-btn ${inputMode === "voice" ? "imt-active" : ""}`}
          onClick={() => setInputMode("voice")}
        >
          🎤 Voice
        </button>
      </div>

      {/* ── CHAT MODE ── */}
      {inputMode === "chat" && (
        <form className="input-bar" onSubmit={handleSubmit}>
          <span className="mode-indicator" style={{ color: activeMode.color }}>
            {activeMode.icon} {activeMode.label}
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ERZA anything... (${activeMode.label} Mode)`}
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || !text.trim()} className="send-btn">
            {loading ? <span className="send-loading"><span/><span/><span/></span> : "Send ➤"}
          </button>
        </form>
      )}

      {/* ── VOICE MODE ── */}
      {inputMode === "voice" && (
        <div className="voice-area">
          <div className={`voice-orb-wrap ${isListening ? "voice-listening" : ""}`}>
            <button
              className={`voice-orb ${isListening ? "voice-orb-active" : ""}`}
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
            >
              {isListening ? (
                <>
                  <span className="voice-ripple" />
                  <span className="voice-ripple voice-ripple-2" />
                  <span className="voice-ripple voice-ripple-3" />
                  🛑
                </>
              ) : "🎤"}
            </button>
          </div>

          <p className="voice-label">
            {loading ? "ERZA is thinking..." : isListening ? "Listening... speak now!" : "Tap mic to speak"}
          </p>

          {/* Live transcript */}
          {transcript && (
            <div className="voice-transcript">
              <span className="voice-transcript-label">YOU SAID</span>
              <p>"{transcript}"</p>
            </div>
          )}

          {micError && <p className="mic-error">⚠️ {micError}</p>}

          {/* Sound wave bars when listening */}
          {isListening && (
            <div className="voice-waves">
              {[...Array(7)].map((_, i) => (
                <span key={i} style={{ "--wi": i }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
