// Colour-codes observations by facility
function facilityColor(facility) {
  const f = (facility || "").toUpperCase();
  if (f.includes("JWST") || f.includes("JAMES WEBB")) return "#2dd4bf"; // teal
  if (f.includes("HST") || f.includes("HUBBLE"))       return "#60a5fa"; // blue
  if (f.includes("SPITZER"))                            return "#f59e0b"; // amber
  if (f.includes("KEPLER") || f.includes("K2"))        return "#a78bfa"; // purple
  if (f.includes("TESS"))                               return "#34d399"; // green
  return "rgba(255,255,255,0.45)";
}

// Short display label for the facility
function facilityLabel(facility, instrument) {
  const f = (facility || "").toUpperCase();
  if (f.includes("JWST") || f.includes("JAMES WEBB")) {
    const i = (instrument || "").toUpperCase();
    if (i.includes("MIRI"))    return "JWST/MIRI";
    if (i.includes("NIRCAM"))  return "JWST/NIRCam";
    if (i.includes("NIRSPEC")) return "JWST/NIRSpec";
    if (i.includes("NIRISS"))  return "JWST/NIRISS";
    return "JWST";
  }
  if (f.includes("HST") || f.includes("HUBBLE")) {
    const i = (instrument || "").toUpperCase();
    if (i.includes("STIS"))  return "HST/STIS";
    if (i.includes("WFC3"))  return "HST/WFC3";
    if (i.includes("NICMOS"))return "HST/NICMOS";
    return "HST";
  }
  if (f.includes("SPITZER")) {
    const i = (instrument || "").toUpperCase();
    if (i.includes("IRAC")) return "Spitzer/IRAC";
    if (i.includes("IRS"))  return "Spitzer/IRS";
    return "Spitzer";
  }
  return instrument || facility || "Unknown";
}

// Badge colour by observation type
function specTypeColor(specType) {
  const s = (specType || "").toLowerCase();
  if (s.includes("transmission")) return { bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.3)", text: "#2dd4bf" };
  if (s.includes("eclipse"))      return { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  text: "#f97316" };
  if (s.includes("emission"))     return { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24" };
  if (s.includes("direct"))       return { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", text: "#a78bfa" };
  return { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.6)" };
}

export default function SpectraChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)" }}>
          Atmospheric Observations
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
          {data.length} published spectrum{data.length !== 1 ? "a" : ""}
        </span>
      </div>

      {/* Observation rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((obs, i) => {
          const colors = specTypeColor(obs.specType);
          const fc = facilityColor(obs.facility);
          const label = facilityLabel(obs.facility, obs.instrument);
          const wlRange = obs.minWl != null && obs.maxWl != null
            ? `${obs.minWl.toFixed(2)} – ${obs.maxWl.toFixed(2)} µm`
            : null;
          const adsUrl = obs.bibcode
            ? `https://ui.adsabs.harvard.edu/abs/${obs.bibcode}`
            : null;

          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              flexWrap: "wrap",
            }}>
              {/* Spec type badge */}
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 8,
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "2px 7px", borderRadius: 4,
                background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
                flexShrink: 0,
              }}>
                {obs.specType}
              </span>

              {/* Facility dot + label */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: fc, flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {label}
                </span>
              </div>

              {/* Wavelength range */}
              {wlRange && (
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
                  {wlRange}
                </span>
              )}

              {/* Data points */}
              {obs.numPoints != null && (
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.22)" }}>
                  {obs.numPoints} pts
                </span>
              )}

              {/* ADS paper link */}
              {adsUrl && (
                <a
                  href={adsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto", fontFamily: "'Space Mono', monospace",
                    fontSize: 8, color: "rgba(255,255,255,0.3)", textDecoration: "none",
                    letterSpacing: "0.06em", flexShrink: 0,
                    padding: "2px 6px", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4, transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  ↗ PAPER
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 10 }}>
        Source: NASA Exoplanet Archive · spectra table
      </div>
    </div>
  );
}
