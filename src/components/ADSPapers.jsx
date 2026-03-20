import { useState } from "react";

export default function ADSPapers({ papers, loading, unavailable }) {
  const [expanded, setExpanded] = useState(null);

  if (unavailable) return null; // silently hide when ADS_TOKEN isn't configured

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "14px 0" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.1)", animation: "pulse 1.5s infinite alternate" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
          LOADING PAPERS…
        </span>
      </div>
    );
  }

  if (!papers || papers.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {papers.map((paper, i) => {
        const isOpen = expanded === i;
        return (
          <div
            key={paper.bibcode || i}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                width: "100%", textAlign: "left",
                background: "none", border: "none", cursor: "pointer",
                padding: "12px 14px",
              }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: 2, letterSpacing: "0.05em" }}>
                {paper.year}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.4, fontWeight: 500 }}>
                  {paper.title}
                </div>
                {paper.authors.length > 0 && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {paper.authors.join(", ")}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Abstract + ADS link (expandable) */}
            {isOpen && (
              <div style={{ padding: "0 14px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 0, paddingTop: 12 }}>
                {paper.abstract && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: "0 0 10px 0" }}>
                    {paper.abstract.slice(0, 400)}{paper.abstract.length > 400 ? "…" : ""}
                  </p>
                )}
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      color: "rgba(255,255,255,0.35)",
                      textDecoration: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 5, padding: "4px 10px",
                      display: "inline-flex", alignItems: "center", gap: 5,
                      letterSpacing: "0.06em",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  >
                    READ ON NASA ADS ↗
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
        Source: NASA Astrophysics Data System
      </div>
    </div>
  );
}
