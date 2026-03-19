import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import CatalogPage from "./pages/CatalogPage";
import PlanetPage from "./pages/PlanetPage";
import StarMapPage from "./pages/StarMapPage";
import TimelinePage from "./pages/TimelinePage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/planet/:slug" element={<PlanetPage />} />
        <Route path="/starmap" element={<StarMapPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020204",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 80, opacity: 0.15, color: "#fff" }}>◎</div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        404 — Lost in Space
      </h1>
      <a
        href="/"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.4)",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        Return to home
      </a>
    </div>
  );
}
