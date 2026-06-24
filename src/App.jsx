import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import JarvisAvatar from "./components/JarvisAvatar";
import MobileBar from "./components/MobileBar";
import useJarvis from "./hooks/useJarvis";

export default function App() {
  const { messages, mode, setMode, lang, setLang, loading, sendMessage, regenerate, toggleBookmark, rateMessage, clearChat } = useJarvis();

  const handleSetLang = (newLang) => { setLang(newLang); setTimeout(clearChat, 0); };
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant")?.content || "";

  return (
    <div className="app">
      <Sidebar mode={mode} setMode={setMode} lang={lang} setLang={handleSetLang} onClear={clearChat} />
      <main className="main">
        <ChatWindow messages={messages} loading={loading} mode={mode} onBookmark={toggleBookmark} onRate={rateMessage} onRegenerate={regenerate} />
        <InputBar onSend={sendMessage} loading={loading} mode={mode} lang={lang} />
      </main>
      <JarvisAvatar loading={loading} lastMessage={lastAssistantMsg} lang={lang} open={false} onClose={() => {}} onSend={sendMessage} />
      <MobileBar
        mode={mode} setMode={setMode}
        lang={lang} setLang={handleSetLang}
        onClear={clearChat}
        loading={loading}
        lastMessage={lastAssistantMsg}
        onSend={sendMessage}
      />
    </div>
  );
}
