import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ className, children }) {
  const lang = /language-(\w+)/.exec(className || "")?.[1] || "text";
  const code = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code-block">
      <div className="code-header">
        <span>{lang}</span>
        <button onClick={copy}>{copied ? "✅ Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={lang} PreTag="div">{code}</SyntaxHighlighter>
    </div>
  );
}

function SongPlayer({ query }) {
  const ytUrl      = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  const gaanaUrl   = `https://gaana.com/search/${encodeURIComponent(query)}`;
  const jiosaavnUrl= `https://www.jiosaavn.com/search/${encodeURIComponent(query)}`;

  return (
    <div className="song-player">
      <div className="song-now-playing">
        <div className="song-bars"><span/><span/><span/><span/><span/></div>
        <div className="song-info">
          <p className="song-title">{query}</p>
          <p className="song-hint">Choose a platform to play ↓</p>
        </div>
      </div>
      <div className="song-platforms">
        <a href={ytUrl} target="_blank" rel="noreferrer" className="platform-btn p-yt">
          <span className="p-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>
          </span>
          <span>YouTube</span>
        </a>
        <a href={spotifyUrl} target="_blank" rel="noreferrer" className="platform-btn p-sp">
          <span className="p-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </span>
          <span>Spotify</span>
        </a>
        <a href={jiosaavnUrl} target="_blank" rel="noreferrer" className="platform-btn p-jio">
          <span className="p-icon">🎶</span>
          <span>JioSaavn</span>
        </a>
        <a href={gaanaUrl} target="_blank" rel="noreferrer" className="platform-btn p-gaana">
          <span className="p-icon">🎵</span>
          <span>Gaana</span>
        </a>
      </div>
    </div>
  );
}

function MessageActions({ msg, onCopy, onBookmark, onRate }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="msg-actions">
      {/* Word & token count */}
      <span className="msg-stat">📊 {msg.words}w · {msg.tokens}t</span>
      <span className="msg-time">{msg.timestamp}</span>

      {/* Copy */}
      <button className="msg-action-btn" onClick={handleCopy} title="Copy message">
        {copied ? "✅" : "📋"}
      </button>

      {/* Bookmark */}
      <button
        className={`msg-action-btn ${msg.bookmarked ? "active-bookmark" : ""}`}
        onClick={onBookmark}
        title={msg.bookmarked ? "Remove bookmark" : "Bookmark"}
      >
        {msg.bookmarked ? "🔖" : "📌"}
      </button>

      {/* Rating — only for assistant */}
      {msg.role === "assistant" && (
        <>
          <button
            className={`msg-action-btn ${msg.rating === "up" ? "active-rate-up" : ""}`}
            onClick={() => onRate(msg.rating === "up" ? null : "up")}
            title="Good response"
          >👍</button>
          <button
            className={`msg-action-btn ${msg.rating === "down" ? "active-rate-down" : ""}`}
            onClick={() => onRate(msg.rating === "down" ? null : "down")}
            title="Bad response"
          >👎</button>
        </>
      )}
    </div>
  );
}

export default function ChatWindow({ messages, loading, onBookmark, onRate, onRegenerate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const bookmarkedCount = messages.filter(m => m.bookmarked).length;

  return (
    <div className="chat-window">
      {/* Bookmarks bar */}
      {bookmarkedCount > 0 && (
        <div className="bookmarks-bar">
          🔖 <span>{bookmarkedCount} bookmarked message{bookmarkedCount > 1 ? "s" : ""}</span>
          <button onClick={() => {
            const bookmarked = messages.filter(m => m.bookmarked).map(m => m.content).join("\n\n---\n\n");
            navigator.clipboard.writeText(bookmarked);
          }}>Copy All Bookmarks</button>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role} ${msg.bookmarked ? "msg-bookmarked" : ""}`}>
          <div className="message-avatar">
            {msg.role === "assistant" ? "E" : "BN"}
          </div>
          <div className="message-bubble">
            <div className="message-content">
              {msg.role === "assistant" ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                    {msg.content}
                  </ReactMarkdown>
                  {msg.youtubeQuery && <SongPlayer query={msg.youtubeQuery} />}
                </>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            <MessageActions
              msg={msg}
              onCopy={() => navigator.clipboard.writeText(msg.content)}
              onBookmark={() => onBookmark(msg.id)}
              onRate={(r) => onRate(msg.id, r)}
            />
          </div>
        </div>
      ))}

      {loading && (
        <div className="message assistant">
          <div className="message-avatar">E</div>
          <div className="message-bubble">
            <div className="message-content">
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate button */}
      {!loading && messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && (
        <div className="regenerate-row">
          <button className="regenerate-btn" onClick={onRegenerate}>
            🔄 Regenerate Response
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
