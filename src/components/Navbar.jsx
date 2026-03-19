import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(5,2,8,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 40%, #7b4fff, #3a1a6b)",
            boxShadow: "0 0 12px rgba(123,79,255,0.4)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Audiowide', cursive",
            fontSize: 15,
            fontWeight: 400,
            color: "#fff",
            letterSpacing: "0.01em",
          }}
        >
          Exoplanet Explorer
        </span>
      </Link>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[
          { to: "/", label: "Home" },
          { to: "/catalog", label: "Catalog" },
        ].map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 6,
                border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                }
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
