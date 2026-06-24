import { useState } from "react";
import { MODES, LANG_MODES } from "../config/jarvis";
import JarvisAvatar from "./JarvisAvatar";

export default function MobileBar({ mode, setMode, lang, setLang, onClear, loading, lastMessage, onSend }) {
  const [drawer, setDrawer] = useState(null); // "modes" | "lang" | "avatar" | null

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav className="mobile-nav">
        <button className="mnav-btn" onClick={() => setDrawer(d => d === "avatar" ? null : "avatar")}>
          <span className="mnav-orb">E</span>
          <span>ERZA</span>
        </button>
        <button className="mnav-btn" onClick={() => setDrawer(d => d === "modes" ? null : "modes")}>
          <span>{MODES[mode].icon}</span>
          <span>Mode</span>
        </button>
        <button className="mnav-btn" onClick={() => setDrawer(d => d === "lang" ? null : "lang")}>
          <span>{LANG_MODES[lang].icon}</span>
          <span>Lang</span>
        </button>
        <button className="mnav-btn mnav-clear" onClick={onClear}>
          <span>🗑</span>
          <span>Clear</span>
        </button>
      </nav>

      {/* ── Backdrop ── */}
      {drawer && <div className="mobile-backdrop" onClick={() => setDrawer(null)} />}

      {/* ── Modes Drawer ── */}
      {drawer === "modes" && (
        <div className="mobile-drawer">
          <div className="drawer-handle" />
          <p className="drawer-title">SELECT MODE</p>
          <div className="drawer-grid">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                className={`drawer-mode-btn ${mode === key ? "drawer-active" : ""}`}
                style={{ "--mc": val.color }}
                onClick={() => { setMode(key); setDrawer(null); }}
              >
                <span className="dmb-icon">{val.icon}</span>
                <span className="dmb-label">{val.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Language Drawer ── */}
      {drawer === "lang" && (
        <div className="mobile-drawer">
          <div className="drawer-handle" />
          <p className="drawer-title">SELECT LANGUAGE</p>
          <div className="drawer-grid">
            {Object.entries(LANG_MODES).map(([key, val]) => (
              <button
                key={key}
                className={`drawer-mode-btn ${lang === key ? "drawer-active" : ""}`}
                style={{ "--mc": val.color }}
                onClick={() => { setLang(key); setDrawer(null); }}
              >
                <span className="dmb-icon">{val.icon}</span>
                <span className="dmb-label">{val.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Avatar Drawer ── */}
      {drawer === "avatar" && (
        <div className="mobile-drawer mobile-drawer-tall">
          <div className="drawer-handle" />
          <JarvisAvatar
            loading={loading}
            lastMessage={lastMessage}
            lang={lang}
            open={true}
            onClose={() => setDrawer(null)}
            onSend={(t) => { onSend(t); setDrawer(null); }}
            inline
          />
        </div>
      )}
    </>
  );
}
