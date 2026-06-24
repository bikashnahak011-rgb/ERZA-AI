import { useState, useCallback } from "react";
import Groq from "groq-sdk";
import { buildSystemPrompt, MODES } from "../config/jarvis";

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });

const detectCommand = (text) => {
  const t = text.toLowerCase().trim();

  // Time — catch: "time", "what time", "time kya hai", etc.
  if (/\b(time|what.?s the time|current time|time now|what time is it|time batao|time kya hai|time bolo|abhi time kya hai)\b/.test(t)) {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    const replies = [
      `Hey Bikash! 🕐 It's **${time}** right now. Time flies when you're coding, bro!`,
      `🕐 The time is **${time}**. Now stop procrastinating and get back to it! 😄`,
      `Current time is **${time}** bro! ⏰ Hope you're making the most of it!`,
    ];
    return { type: "time", reply: replies[Math.floor(Math.random() * replies.length)] };
  }

  // Date — catch: "date", "aaj ki date", "today", etc.
  if (/\b(date|today|what.?s the date|today.?s date|current date|date kya hai|aaj ki date|aaj kya date hai)\b/.test(t)) {
    const date = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const replies = [
      `📅 Today is **${date}**. Another day, another chance to level up, Bikash!`,
      `Hey bro! 📅 It's **${date}** today. Make it count!`,
      `📅 **${date}** — hope you're being productive today, Bikash! 🙌`,
    ];
    return { type: "date", reply: replies[Math.floor(Math.random() * replies.length)] };
  }

  // Play song
  const playMatch = t.match(/^(?:play(?:\s+me)?|chalao|baja(?:o)?|play\s+song)\s+(.+)$/);
  if (playMatch) {
    const query = playMatch[1].trim();
    const replies = [
      `Bro, great taste! 🎵 Opening **"${query}"** on YouTube right now. Enjoy the vibes! 🔥`,
      `Aye Bikash! 🎶 Playing **"${query}"** — sit back and vibe! Hit that button below! 🎧`,
      `Ooh nice pick! 🎵 **"${query}"** coming right up! Click below to jam! 🚀`,
      `Let's gooo! 🎶 **"${query}"** — absolute banger choice Bikash! Opening it now! 🔥`,
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    return { type: "youtube", query, reply };
  }

  return null;
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const countTokens = (text) => Math.ceil(text.length / 4);

const makeMsg = (role, content, extra = {}) => ({
  role, content, id: Date.now() + Math.random(),
  words: countWords(content),
  tokens: countTokens(content),
  timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  bookmarked: false,
  rating: null,
  ...extra,
});

export default function useJarvis() {
  const [messages, setMessages] = useState([
    makeMsg("assistant", `Online and fully operational, Bikash! 👊\n\nI'm **ERZA** — your upgraded AI assistant, now running on a more powerful model with smarter reasoning.\n\n**Available Modes:** ${Object.values(MODES).map(m => `${m.icon} ${m.label}`).join(" · ")}\n\n💡 **Quick Commands:**\n- 🕐 *"What time is it?"*\n- 📅 *"What's today's date?"*\n- 🎵 *"Play Believer"*\n\nWhat are we crushing today?`),
  ]);
  const [mode, setMode] = useState("general");
  const [lang, setLang] = useState("english");
  const [loading, setLoading] = useState(false);

  // ── Core API call ──────────────────────────────────────
  const callAI = useCallback(async (text, historyOverride = null) => {
    const modeLabel = MODES[mode].label;
    const langTag = lang === "hinglish"
      ? `[HINGLISH MODE — STRICT]\nYou MUST reply in Hinglish: Hindi words in Roman script mixed with English.\nEXAMPLE: "Bhai, yeh ek bahut important concept hai. Basically, React mein har component ka apna state hota hai."\nRULES: NEVER use Devanagari. Mix Hindi+English in EVERY sentence. Casual desi tone.\nIF YOU WRITE PURE ENGLISH = WRONG. MIX KARO BHAI.`
      : `[ENGLISH ONLY MODE]\nEvery word must be in English. No Hindi. No Devanagari. Pure English only.`;

    const prompt = `${langTag}\n[Active Mode: ${modeLabel}]\n\nUser says: ${text}`;

    let history = (historyOverride || messages)
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content }));

    // Always read COMPLETE chat history - no limits

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        ...history,
        { role: "user", content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    });
    return result.choices[0].message.content;
  }, [mode, lang, messages]);

  // ── Send message ───────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = makeMsg("user", text);
    setMessages(prev => [...prev, userMsg]);

    const cmd = detectCommand(text);
    if (cmd) {
      setMessages(prev => [...prev, makeMsg("assistant", cmd.reply, { youtubeQuery: cmd.type === "youtube" ? cmd.query : undefined })]);
      return;
    }

    setLoading(true);
    try {
      const response = await callAI(text);
      setMessages(prev => [...prev, makeMsg("assistant", response)]);
    } catch (error) {
      const msg = error?.status === 429
        ? "⚠️ Too many requests, bro. Chill for a sec and try again!"
        : `⚠️ System error: ${error.message}`;
      setMessages(prev => [...prev, makeMsg("assistant", msg)]);
    } finally {
      setLoading(false);
    }
  }, [loading, callAI]);

  // ── Regenerate last response ───────────────────────────
  const regenerate = useCallback(async () => {
    if (loading) return;
    const msgs = [...messages];
    // Find last user message
    const lastUserIdx = msgs.map(m => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const lastUserText = msgs[lastUserIdx].content;
    // Remove last assistant message
    const lastAssistantIdx = msgs.map(m => m.role).lastIndexOf("assistant");
    if (lastAssistantIdx > lastUserIdx) msgs.splice(lastAssistantIdx, 1);

    setMessages(msgs);
    setLoading(true);
    try {
      const response = await callAI(lastUserText, msgs);
      setMessages(prev => [...prev, makeMsg("assistant", response)]);
    } catch (error) {
      setMessages(prev => [...prev, makeMsg("assistant", `⚠️ ${error.message}`)]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, callAI]);

  // ── Bookmark toggle ────────────────────────────────────
  const toggleBookmark = useCallback((id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, bookmarked: !m.bookmarked } : m));
  }, []);

  // ── Rate message ───────────────────────────────────────
  const rateMessage = useCallback((id, rating) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
  }, []);

  // ── Clear chat ─────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([makeMsg("assistant",
      lang === "hinglish"
        ? "Chat clear ho gaya bhai! Naya session start karte hain. Kya seekhna hai aaj? 🚀"
        : "Chat cleared! Ready for a fresh session, Bikash. What are we building today? 🚀"
    )]);
  }, [lang]);

  return { messages, mode, setMode, lang, setLang, loading, sendMessage, regenerate, toggleBookmark, rateMessage, clearChat };
}
