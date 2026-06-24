import { MODES, LANG_MODES } from "../config/jarvis";

export default function Sidebar({ mode, setMode, lang, setLang, onClear }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-arc">
          <span className="logo-icon" aria-hidden="true">🤖</span>
        </div>
        <h1>ERZA</h1>
        <p>AI Chatbot</p>
      </div>

      <div className="sidebar-section">
        <span className="section-label">MODES</span>
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            className={`mode-btn ${mode === key ? "active" : ""}`}
            style={{ "--mode-color": val.color }}
            onClick={() => setMode(key)}
          >
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-section">
        <span className="section-label">LANGUAGE</span>
        {Object.entries(LANG_MODES).map(([key, val]) => (
          <button
            key={key}
            className={`mode-btn ${lang === key ? "active" : ""}`}
            style={{ "--mode-color": val.color }}
            onClick={() => setLang(key)}
          >
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">BN</div>
        <div>
          <p className="profile-name">Bikash Nahak</p>
          <p className="profile-goal">Frontend Developer</p>
        </div>
      </div>

      <button className="clear-btn" onClick={onClear}>
        🗑 Clear Chat
      </button>
    </aside>
  );
}
