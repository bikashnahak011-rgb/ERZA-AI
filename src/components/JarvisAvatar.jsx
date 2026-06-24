import { useEffect, useState, useRef, useCallback } from "react";
import { LANG_MODES } from "../config/jarvis";

const IDLE = {
  english: [
    "Hey Bikash! Ready to crush some code today? 🚀",
    "I'm ERZA — always here whenever you need me! 😊",
    "Every expert was once a beginner. Keep going! 💪",
    "Ask me anything — no question is too small! 🤖",
    "You're doing amazing, Bikash. Stay consistent! ⚡",
    "Let's build something awesome together today! 🛠️",
    "Full Stack Dev mode: ACTIVATED for Bikash! 🎯",
    "Need a code review? Just ask! I got your back. 🔍",
  ],
  hinglish: [
    "Kya haal hai Bikash bhai! Aaj kuch coding karte hain? 🚀",
    "Main ERZA hoon, hamesha yahan hoon tere liye! 😊",
    "Bhai, har expert pehle beginner tha. Chalta reh! 💪",
    "Kuch bhi pooch, koi bhi sawaal chota nahi hota! 🤖",
    "Tu bahut accha kar raha hai Bikash. Consistent reh! ⚡",
    "Aaj kuch mast banate hain saath mein! 🛠️",
    "Full Stack Dev banna hai? Main hoon na tere saath! 🎯",
    "Code review chahiye? Bol bhai, main ready hoon! 🔍",
  ],
};

const THINKING = {
  english: [
    "Hmm, let me think about that... 🤔",
    "Processing at full power! ⚡",
    "Running diagnostics... almost there! 🔄",
    "Great question! Calculating best response... 🧠",
  ],
  hinglish: [
    "Ek second bhai, soch raha hoon... 🤔",
    "Full power pe processing ho raha hoon! ⚡",
    "Bas ek second... best answer dhoondh raha hoon! 🔄",
    "Wah, mast sawaal! Theek se samjhata hoon! 🧠",
  ],
};

const LISTEN_LABEL = {
  english: "Listening... speak now! 🎤",
  hinglish: "Sun raha hoon... bol bhai! 🎤",
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const stripMarkdown = (t) => t.replace(/[#*`_~>\[\]!]/g, "").replace(/\n+/g, " ").trim();
const stripEmoji = (t) => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function JarvisAvatar({ loading, lastMessage, lang = "english", open, onClose, onSend }) {
  const [speech, setSpeech] = useState(IDLE.english[0]);
  const [fade, setFade] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });

  const panelRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const spokenRef = useRef("");

  // ── Eye tracking on mouse move ──────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onMove = (e) => {
      const r = panel.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.28;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = 3;
      setEyePos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Speak ───────────────────────────────────────────────
  const speak = useCallback((text) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const clean = stripEmoji(stripMarkdown(text)).slice(0, 200);
    if (!clean) return;

    const utt = new SpeechSynthesisUtterance(clean);
    utt.volume = 1;

    const voices = synth.getVoices();

    if (lang === "hinglish") {
      // Hindi MALE voice
      utt.rate = 0.95;
      utt.pitch = 0.85;
      utt.lang = "hi-IN";
      const hindiMale =
        voices.find(v => v.lang === "hi-IN" && v.name.toLowerCase().includes("male")) ||
        voices.find(v => v.lang === "hi-IN") ||
        voices.find(v => v.lang.startsWith("hi"));
      if (hindiMale) utt.voice = hindiMale;
    } else {
      // English MALE voice
      utt.rate = 1.0;
      utt.pitch = 0.85;
      utt.lang = "en-US";
      const maleVoice =
        voices.find(v => v.name.includes("Google UK English Male")) ||
        voices.find(v => v.name.includes("Microsoft David")) ||
        voices.find(v => v.name.includes("Microsoft Mark")) ||
        voices.find(v => v.name.includes("Alex")) ||
        voices.find(v => v.name.includes("Daniel")) ||
        voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("male")) ||
        voices.find(v => v.lang.startsWith("en"));
      if (maleVoice) utt.voice = maleVoice;
    }

    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    synth.speak(utt);
  }, [lang]);

  // ── Change speech bubble ────────────────────────────────
  const changeSpeech = useCallback((text, autoSpeak = false) => {
    setFade(false);
    setTimeout(() => {
      setSpeech(text);
      setFade(true);
      if (autoSpeak) speak(text);
    }, 300);
  }, [speak]);

  // Preload voices
  useEffect(() => {
    const synth = synthRef.current;
    if (synth?.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => synth.getVoices();
    }
    synth?.getVoices();
  }, []);

  // Speak AI reply
  useEffect(() => {
    if (!lastMessage || loading) return;
    if (spokenRef.current === lastMessage) return;
    spokenRef.current = lastMessage;
    const preview = lastMessage.slice(0, 100) + (lastMessage.length > 100 ? "..." : "");
    changeSpeech(preview, true);
  }, [lastMessage, loading, changeSpeech]);

  // Thinking bubble
  useEffect(() => {
    if (!loading) return;
    changeSpeech(rand(THINKING[lang]), false);
  }, [loading, lang, changeSpeech]);

  // Idle rotation
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => changeSpeech(rand(IDLE[lang]), false), 6000);
    return () => clearInterval(t);
  }, [lang, loading, changeSpeech]);

  // ── Voice input ─────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) { setMicError("Browser doesn't support voice input."); return; }
    if (isListening) return;
    const rec = new SpeechRecognition();
    rec.lang = lang === "hinglish" ? "hi-IN" : "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    recognitionRef.current._final = "";

    setMicError(""); setTranscript(""); setIsListening(true);
    changeSpeech(LISTEN_LABEL[lang], false);

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
      else if (e.error === "not-allowed") setMicError("Mic permission denied.");
      else setMicError("Error: " + e.error);
      changeSpeech(rand(IDLE[lang]), false);
    };

    rec.onend = () => {
      setIsListening(false);
      const final = recognitionRef.current?._final || "";
      setTranscript("");
      if (final.trim()) { changeSpeech(final.slice(0, 80), false); onSend(final.trim()); }
      else changeSpeech(rand(IDLE[lang]), false);
    };

    rec.start();
  }, [isListening, lang, changeSpeech, onSend]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const activeLang = LANG_MODES[lang];

  return (
    <>
      {open && <div className="avatar-backdrop" onClick={onClose} />}
      <aside className={`avatar-panel ${open ? "avatar-open" : ""}`} ref={panelRef}>
        <button className="avatar-close-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="avatar-title">
          <span className="avatar-title-text">ERZA</span>
          <span className="avatar-status-dot" />
          <span className="avatar-status-label">ONLINE</span>
        </div>

        <div className="lang-badge" style={{ borderColor: activeLang.color, color: activeLang.color }}>
          {activeLang.icon} {activeLang.label} Mode
        </div>

        {/* ── Beautiful Girl Avatar ── */}
        <div className="girl-scene">
          <div className={`girl-avatar ${isSpeaking ? "girl-speaking" : ""} ${isListening ? "girl-listening" : ""} ${loading ? "girl-thinking" : ""}`}>

            {/* Glow aura */}
            <div className="girl-aura" />

            {/* Head */}
            <div className="girl-head">
              {/* Hair back */}
              <div className="girl-hair-back" />
              {/* Face */}
              <div className="girl-face">
                {/* Eyes */}
                <div className="girl-eyes">
                  <div className="girl-eye">
                    <div className="girl-eyeball">
                      <div className="girl-pupil" style={{ transform: `translate(${eyePos.x}px, ${eyePos.y}px)` }} />
                      <div className="girl-eye-shine" />
                    </div>
                    <div className="girl-lash girl-lash-l" />
                  </div>
                  <div className="girl-eye">
                    <div className="girl-eyeball">
                      <div className="girl-pupil" style={{ transform: `translate(${eyePos.x}px, ${eyePos.y}px)` }} />
                      <div className="girl-eye-shine" />
                    </div>
                    <div className="girl-lash girl-lash-r" />
                  </div>
                </div>
                {/* Nose */}
                <div className="girl-nose" />
                {/* Mouth */}
                <div className={`girl-mouth ${isSpeaking ? "girl-mouth-open" : ""}`}>
                  <div className="girl-lips-top" />
                  <div className="girl-lips-bottom" />
                  {isSpeaking && <div className="girl-mouth-inner" />}
                </div>
                {/* Blush */}
                <div className="girl-blush girl-blush-l" />
                <div className="girl-blush girl-blush-r" />
              </div>
              {/* Hair front */}
              <div className="girl-hair-front" />
              {/* Hair side strands */}
              <div className="girl-hair-strand girl-hair-strand-l" />
              <div className="girl-hair-strand girl-hair-strand-r" />
            </div>

            {/* Neck */}
            <div className="girl-neck" />

            {/* Body/Shoulders */}
            <div className="girl-body">
              <div className="girl-outfit" />
              {/* Sound waves when speaking */}
              {isSpeaking && (
                <div className="girl-sound-waves">
                  <span /><span /><span /><span /><span />
                </div>
              )}
            </div>

            {/* Floating particles */}
            <div className="girl-particles">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="girl-particle" style={{ "--gi": i }} />
              ))}
            </div>
          </div>

          {/* Name tag */}
          <div className="girl-nametag">
            <span>✨ ERZA AI</span>
          </div>
        </div>

        {/* Live transcript */}
        {(isListening || transcript) && (
          <div className="transcript-box">
            <span className="transcript-label">YOU SAID:</span>
            <p>{transcript || "..."}</p>
          </div>
        )}

        {/* Speech Bubble */}
        <div className={`speech-bubble ${fade ? "speech-visible" : "speech-hidden"}`}>
          <div className="speech-arrow" />
          <p>{speech}</p>
        </div>

        {/* Mic button */}
        <button
          className={`mic-btn ${isListening ? "mic-active" : ""}`}
          onClick={isListening ? stopListening : startListening}
          disabled={loading}
        >
          {isListening ? (
            <><span className="mic-ripple" /><span className="mic-ripple mic-ripple-2" />🛑 Stop Listening</>
          ) : (
            <>🎤 Talk to ERZA</>
          )}
        </button>

        {micError && <p className="mic-error">{micError}</p>}

        {/* Stats */}
        <div className="avatar-stats">
          <div className="stat-item">
            <span className="stat-label">STATUS</span>
            <span className="stat-value" style={{ color: loading ? "#f59e0b" : isListening ? "#f87171" : isSpeaking ? "#a78bfa" : "#34d399" }}>
              {loading ? "THINKING" : isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : "READY"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">VOICE</span>
            <span className="stat-value" style={{ color: activeLang.color }}>
              {lang === "hinglish" ? "HINDI ♂" : "ENGLISH ♂"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">LANG</span>
            <span className="stat-value" style={{ color: activeLang.color }}>{activeLang.label.toUpperCase()}</span>
          </div>
        </div>

        <div className="scan-lines" />
      </aside>
    </>
  );
}
