import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ── Icon helper ─────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}>
    <path d={d} />
  </svg>
);

const ic = {
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  arrow:    "M5 12h14 M12 5l7 7-7 7",
  check:    "M20 6 9 17l-5-5",
  hash:     "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
  alert:    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  search:   "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  brain:    "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z",
  x:        "M18 6 6 18 M6 6l12 12",
  cpu:      "M9 2v2H7a2 2 0 0 0-2 2v2H2v2h3v2H2v2h3v2a2 2 0 0 0 2 2h2v2h2v-2h2v2h2v-2h2a2 2 0 0 0 2-2v-2h3v-2h-3v-2h3V9h-3V7a2 2 0 0 0-2-2h-2V2h-2v2H9z M9 9h6v6H9z",
  chevDown: "m6 9 6 6 6-6",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
};

/* ── Blockchain Network Canvas ───────────────────────────────────────────── */
const BLOCK_DATA = [
  { id: "B-001", type: "Registration", property: "Andheri West Plot", hash: "0x3a1b…f2c8", gas: "42,100", time: "2s ago" },
  { id: "B-002", type: "Transfer",     property: "BKC Office Space",  hash: "0x9f8e…3a12", gas: "38,400", time: "14s ago" },
  { id: "B-003", type: "Doc Anchor",   property: "Koregaon Bungalow", hash: "0x5c6d…b9e0", gas: "21,800", time: "41s ago" },
  { id: "B-004", type: "Registration", property: "Whitefield Plot",   hash: "0xd9e0…a4f1", gas: "43,200", time: "1m ago" },
  { id: "B-005", type: "Transfer",     property: "DLF Phase 3",       hash: "0x2b3c…7e90", gas: "39,100", time: "3m ago" },
  { id: "B-006", type: "Registration", property: "Connaught Place",   hash: "0x7c8d…1a2b", gas: "41,500", time: "8m ago" },
];

function BlockchainCanvas({ onNodeClick }) {
  const canvasRef  = useRef(null);
  const mouse      = useRef({ x: -9999, y: -9999 });
  const nodesRef   = useRef([]);
  const raf        = useRef(null);
  const txRef      = useRef(null); // travelling transaction
  const clickRef   = useRef(onNodeClick);
  clickRef.current = onNodeClick;

  const init = useCallback((canvas) => {
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const COUNT = Math.max(40, Math.floor((W * H) / 12000));

    nodesRef.current = Array.from({ length: COUNT }, (_, i) => ({
      id:   i,
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.28,
      vy:   (Math.random() - 0.5) * 0.28,
      r:    1.4 + Math.random() * 1.8,
      lit:  Math.random() > 0.82,
      // ~8 nodes are "block nodes" — larger, clickable
      isBlock: i < 8,
      blockData: i < 8 ? BLOCK_DATA[i % BLOCK_DATA.length] : null,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Spawn a travelling transaction dot
    txRef.current = {
      path: [],    // will be set each frame to 3–4 random block nodes
      t: 0,        // progress 0→1 along path
      speed: 0.004,
      active: true,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    init(canvas);

    const onResize = () => init(canvas);
    window.addEventListener("resize", onResize);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const ns = nodesRef.current;
      for (const n of ns) {
        if (!n.isBlock) continue;
        const dx = cx - n.x, dy = cy - n.y;
        const hit = n.isBlock ? 10 : n.r * 2;
        if (Math.sqrt(dx*dx + dy*dy) < hit + 4) {
          clickRef.current?.(n.blockData, e.clientX, e.clientY);
          break;
        }
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    const CONNECT  = 120;
    const M_RADIUS = 160;
    const M_FORCE  = 0.01;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const ns = nodesRef.current;
      const mx = mouse.current.x, my = mouse.current.y;
      const t  = Date.now() * 0.001;

      ctx.clearRect(0, 0, W, H);

      // ── update ──────────────────────────────────────────────────────────
      for (const n of ns) {
        const dx = mx - n.x, dy = my - n.y;
        const md = Math.hypot(dx, dy);
        if (md < M_RADIUS && md > 1) {
          n.vx += (dx / md) * M_FORCE;
          n.vy += (dy / md) * M_FORCE;
        }
        n.vx *= 0.991; n.vy *= 0.991;
        n.x  += n.vx;  n.y  += n.vy;
        n.pulse += 0.03;
        if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;
      }

      // ── edges ───────────────────────────────────────────────────────────
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[i].x - ns[j].x, dy = ns[i].y - ns[j].y;
          const d  = Math.hypot(dx, dy);
          if (d > CONNECT) continue;
          const a = (1 - d / CONNECT) * 0.18;
          ctx.beginPath();
          ctx.moveTo(ns[i].x, ns[i].y);
          ctx.lineTo(ns[j].x, ns[j].y);
          ctx.strokeStyle = `rgba(111,213,191,${a})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }

      // ── travelling tx packet ─────────────────────────────────────────────
      const tx = txRef.current;
      if (tx) {
        // Build a path of block nodes if empty or completed
        if (tx.path.length < 2 || tx.t >= 1) {
          const blocks = ns.filter(n => n.isBlock);
          const shuffled = [...blocks].sort(() => Math.random() - 0.5).slice(0, 4);
          tx.path  = shuffled;
          tx.t     = 0;
        }
        tx.t = Math.min(tx.t + tx.speed, 1);
        const seg    = (tx.path.length - 1) * tx.t;
        const segIdx = Math.min(Math.floor(seg), tx.path.length - 2);
        const segT   = seg - segIdx;
        const a      = tx.path[segIdx];
        const b      = tx.path[segIdx + 1];
        if (a && b) {
          const px = a.x + (b.x - a.x) * segT;
          const py = a.y + (b.y - a.y) * segT;
          // Draw trail
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(px, py);
          ctx.strokeStyle = "rgba(111,213,191,0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Draw packet
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#6FD5BF";
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(111,213,191,0.15)";
          ctx.fill();
        }
      }

      // ── nodes ────────────────────────────────────────────────────────────
      for (const n of ns) {
        const dx   = mx - n.x, dy = my - n.y;
        const md   = Math.hypot(dx, dy);
        const near = md < M_RADIUS;
        const pulse = Math.sin(n.pulse) * 0.5 + 0.5;

        if (n.isBlock) {
          // Block node — larger, pulsing ring
          const br = 6 + pulse * 2;
          // Outer ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, br + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(111,213,191,${0.15 + pulse * 0.15})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
          // Inner fill
          ctx.beginPath();
          ctx.arc(n.x, n.y, br, 0, Math.PI * 2);
          ctx.fillStyle = near
            ? "rgba(111,213,191,0.9)"
            : `rgba(40,122,104,${0.5 + pulse * 0.3})`;
          ctx.fill();
          // Hash symbol in the block node
          ctx.font      = `bold ${7 + (near ? 1 : 0)}px monospace`;
          ctx.fillStyle = near ? "#0F2B23" : "rgba(111,213,191,0.7)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("#", n.x, n.y);

          // Cursor tooltip hint
          if (near && md < 30) {
            canvas.style.cursor = "pointer";
          }
        } else {
          // Regular particle node
          const nr = near ? n.r * 2.2 : n.r;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
          ctx.fillStyle = n.lit
            ? `rgba(111,213,191,${near ? 0.9 : 0.55})`
            : `rgba(40,122,104,${near ? 0.65 : 0.28})`;
          ctx.fill();
          if (near && md < 60) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, nr * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(111,213,191,${(1 - md/60) * 0.12})`;
            ctx.fill();
          }
        }
      }

      // Reset cursor if not near block
      const nearBlock = ns.filter(n => n.isBlock).some(n => Math.hypot(mx-n.x, my-n.y) < 20);
      if (!nearBlock) canvas.style.cursor = "default";

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [init]);

  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%", display: "block",
      zIndex: 1,
    }} />
  );
}

/* ── Block detail tooltip ────────────────────────────────────────────────── */
function NodeTooltip({ data, x, y, onClose }) {
  if (!data) return null;
  const typeColor = {
    Registration: "#6FD5BF",
    Transfer:     "#F59E0B",
    "Doc Anchor": "#8DA99B",
  }[data.type] || "#6FD5BF";

  // Keep tooltip inside viewport
  const safeX = Math.min(x + 12, window.innerWidth - 260);
  const safeY = Math.min(y - 10, window.innerHeight - 160);

  return (
    <div className="node-tooltip" style={{ left: safeX, top: safeY }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: typeColor,
          textTransform: "uppercase", letterSpacing: "0.08em" }}>{data.type}</span>
        <button onClick={onClose} style={{ background: "none", border: "none",
          cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0, display: "flex" }}>
          <Ic d={ic.x} size={12} stroke="rgba(255,255,255,0.5)" />
        </button>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
        fontSize: 13, color: "white", marginBottom: 6 }}>{data.property}</div>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: typeColor,
        marginBottom: 10 }}>{data.hash}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["Gas Used", data.gas], ["Time", data.time], ["Block ID", data.id]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2,
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              fontFamily: k === "Block ID" ? "monospace" : "inherit" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}

function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate  = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [tooltip,  setTooltip]  = useState(null); // { data, x, y }
  const [query,    setQuery]    = useState("");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleNodeClick = useCallback((data, x, y) => {
    setTooltip(prev => prev?.data?.id === data?.id ? null : { data, x, y });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/verify?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div style={{ overflowX: "hidden", background: "#060e0c" }}>
      <style>{`
        @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatSlow2{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes txPulse   { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Tooltip (fixed, above everything) */}
      {tooltip && (
        <NodeTooltip data={tooltip.data} x={tooltip.x} y={tooltip.y}
          onClose={() => setTooltip(null)} />
      )}


      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 64, zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 52px",
        background: scrolled ? "rgba(6,14,12,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(111,213,191,0.1)" : "none",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#287A68", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={ic.location} size={16} stroke="white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 18, color: "white", letterSpacing: "-0.01em" }}>Plotify</span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {[["#features","Features"],["#how","How It Works"],["#verify","Verify"]].map(([href,label]) => (
            <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500,
              color: "rgba(255,255,255,0.65)", transition: "color 0.15s", textDecoration: "none" }}
              onMouseOver={e => e.target.style.color="white"}
              onMouseOut={e  => e.target.style.color="rgba(255,255,255,0.65)"}>
              {label}
            </a>
          ))}
        </div>

        {/* CTAs — only Login and Dashboard */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link to="/login" style={{
            padding: "8px 18px", borderRadius: 7,
            border: "1.5px solid rgba(255,255,255,0.22)",
            fontSize: 14, fontWeight: 500, color: "white",
            background: "transparent", textDecoration: "none",
            transition: "border-color 0.15s, background 0.15s",
          }}
            onMouseOver={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.5)"; }}
            onMouseOut={e  => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(255,255,255,0.22)"; }}>
            Login
          </Link>
          <Link to="/login" style={{
            padding: "8px 18px", borderRadius: 7,
            background: "#287A68", fontSize: 14, fontWeight: 600,
            color: "white", textDecoration: "none",
            boxShadow: "0 2px 12px rgba(40,122,104,0.4)",
            transition: "background 0.15s, box-shadow 0.15s",
          }}
            onMouseOver={e => { e.currentTarget.style.background="#1f6a58"; }}
            onMouseOut={e  => { e.currentTarget.style.background="#287A68"; }}>
            Dashboard →
          </Link>
        </div>
      </nav>


      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center",
        overflow: "hidden",
        background: "linear-gradient(135deg, #060e0c 0%, #0a1f18 50%, #0d2820 100%)",
      }}>
        {/* Radial glow */}
        <div style={{ position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 700px 500px at 75% 45%, rgba(40,122,104,0.18) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0 }} />

        {/* Blockchain network canvas */}
        <BlockchainCanvas onNodeClick={handleNodeClick} />

        {/* Left-side darkening so text is readable */}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(6,14,12,0.92) 0%, rgba(6,14,12,0.6) 42%, rgba(6,14,12,0.05) 70%, transparent 100%)",
          pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(6,14,12,0.5) 0%, transparent 35%)",
          pointerEvents: "none", zIndex: 2 }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 10, padding: "120px 52px 80px",
          maxWidth: 700 }}>

          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 13px", marginBottom: 24,
            background: "rgba(40,122,104,0.2)", border: "1px solid rgba(111,213,191,0.3)",
            borderRadius: 5, fontSize: 11, fontWeight: 600, color: "#6FD5BF",
            textTransform: "uppercase", letterSpacing: "0.09em" }}>
            <Ic d={ic.shield} size={11} stroke="#6FD5BF" />
            Blockchain-Secured Land Registry
          </div>

          {/* Headline — Space Grotesk */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(46px, 5.5vw, 74px)",
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "white",
            marginBottom: 24,
          }}>
            Land records,<br />
            <span style={{ color: "#6FD5BF" }}>reimagined</span><br />
            on-chain.
          </h1>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.62)", lineHeight: 1.7,
            marginBottom: 40, maxWidth: 460 }}>
            Every registration, transfer and document anchored to the Ethereum blockchain.
            Permanent. Public. Tamper-proof.
          </p>

          {/* TWO buttons only */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 50, padding: "0 28px", borderRadius: 9,
              background: "#173F35",
              border: "1.5px solid rgba(111,213,191,0.3)",
              color: "white", fontSize: 15, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 20px rgba(23,63,53,0.5)",
              transition: "all 0.15s",
            }}
              onMouseOver={e => { e.currentTarget.style.background="#287A68"; e.currentTarget.style.boxShadow="0 4px 24px rgba(40,122,104,0.5)"; }}
              onMouseOut={e  => { e.currentTarget.style.background="#173F35"; e.currentTarget.style.boxShadow="0 4px 20px rgba(23,63,53,0.5)"; }}>
              Go to Dashboard <Ic d={ic.arrow} size={15} stroke="white" />
            </Link>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 50, padding: "0 28px", borderRadius: 9,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 500,
              textDecoration: "none", transition: "all 0.15s",
            }}
              onMouseOver={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"; }}
              onMouseOut={e  => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}>
              Sign In
            </Link>
          </div>

          {/* Hint */}
          <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            ↑ Click the glowing <span style={{ color: "#6FD5BF" }}>#</span> nodes to inspect live transactions
          </p>
        </div>

        {/* Floating glass card — top right */}
        <div style={{
          position: "absolute", top: 110, right: "6%", zIndex: 10,
          background: "rgba(15,43,35,0.78)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(111,213,191,0.22)", borderRadius: 14,
          padding: "15px 18px", minWidth: 210,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "floatSlow 5s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%",
              background: "#6FD5BF", boxShadow: "0 0 7px #6FD5BF",
              animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6FD5BF",
              textTransform: "uppercase", letterSpacing: "0.1em" }}>Live · Latest Tx</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            fontSize: 14, color: "white", marginBottom: 4 }}>Andheri West Plot</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6FD5BF",
            marginBottom: 10 }}>0x3a1b…f2c8</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>TYPE</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Registration</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }}/>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>GAS</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>42,100</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }}/>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>STATUS</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6FD5BF" }}>Confirmed ✓</div>
            </div>
          </div>
        </div>

        {/* Floating glass card — bottom right */}
        <div style={{
          position: "absolute", bottom: 90, right: "6%", zIndex: 10,
          background: "rgba(15,43,35,0.78)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(40,122,104,0.3)", borderRadius: 14,
          padding: "15px 18px", minWidth: 230,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "floatSlow2 5s ease-in-out infinite",
          animationDelay: "2.5s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Ic d={ic.hash} size={12} stroke="#8DA99B" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#8DA99B",
              textTransform: "uppercase", letterSpacing: "0.1em" }}>Ownership Transfer</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            fontSize: 14, color: "white", marginBottom: 4 }}>BKC Office Space</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
            arjun_sharma → priya_mehta
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#8DA99B" }}>
            Block #18,432,109 · 14s ago
          </div>
        </div>
      </section>


      {/* ── FEATURES STRIP ──────────────────────────────────────────────── */}
      <section style={{ background: "#0a1a15", borderTop: "1px solid rgba(111,213,191,0.07)",
        borderBottom: "1px solid rgba(111,213,191,0.07)", padding: "20px 52px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 48,
          maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            [ic.shield,   "#6FD5BF", "Solidity Smart Contract"],
            [ic.hash,     "#8DA99B", "SHA-256 Document Hashing"],
            [ic.brain,    "#F59E0B", "Isolation Forest ML"],
            [ic.transfer, "#6FD5BF", "On-chain Transfer History"],
            [ic.lock,     "#8DA99B", "JWT Authentication"],
          ].map(([d, color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic d={d} size={14} stroke={color} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMS SECTION ────────────────────────────────────────────── */}
      <section id="features" style={{ background: "#060e0c", padding: "100px 52px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6FD5BF",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              The Problem
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700,
              color: "white", letterSpacing: "-0.025em", lineHeight: 1.1,
              marginBottom: 60, maxWidth: 600 }}>
              Traditional land registries<br />
              <span style={{ color: "#6FD5BF" }}>fail citizens</span> every day.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[
              [ic.alert,    "Paper records are forged",      "Ownership disputes arise from altered documents that cannot be independently verified."],
              [ic.lock,     "Databases are manipulated",     "A single authority controls all records — no audit trail exists to prove who made changes."],
              [ic.search,   "Citizens can't self-verify",    "Only officials have access. Buyers can't independently confirm a seller owns the land."],
              [ic.file,     "Document integrity is opaque",  "No cryptographic proof that a title deed or survey map is the original, unaltered version."],
            ].map(([d, title, desc], i) => (
              <Reveal key={title} delay={i * 80}>
                <div style={{ padding: "24px 26px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ic d={d} size={20} stroke="#EF4444" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700,
                      fontSize: 15, color: "white", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how" style={{ background: "#0d2820", padding: "100px 52px",
        borderTop: "1px solid rgba(111,213,191,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6FD5BF",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              How It Works
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 700,
              color: "white", letterSpacing: "-0.025em" }}>
              From filing to blockchain in four steps.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              [ic.users,    "01", "Create Account",    "Register as a citizen. Officers are assigned by administrators."],
              [ic.file,     "02", "Submit Property",   "Enter land details, area, location and upload supporting documents."],
              [ic.shield,   "03", "Admin Reviews",     "A land officer validates documents and approves or rejects."],
              [ic.hash,     "04", "Blockchain Recorded","Approved records are written on-chain — permanent and public."],
            ].map(([d, n, title, desc], i) => (
              <Reveal key={n} delay={i * 100}>
                <div style={{ padding: "26px 22px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(111,213,191,0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10,
                      background: "rgba(40,122,104,0.2)", border: "1px solid rgba(40,122,104,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic d={d} size={18} stroke="#6FD5BF" />
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 11,
                      fontWeight: 700, color: "#6FD5BF" }}>{n}</span>
                  </div>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700,
                    fontSize: 15, color: "white", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERIFY SECTION ──────────────────────────────────────────────── */}
      <section id="verify" style={{ background: "#060e0c", padding: "100px 52px",
        borderTop: "1px solid rgba(111,213,191,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 440px", gap: 64, alignItems: "center" }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6FD5BF",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Public Access
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700,
              color: "white", letterSpacing: "-0.025em", marginBottom: 18 }}>
              Verify any land record<br />instantly. No login needed.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
              Search by Land ID, title or location. View ownership history, blockchain proof and document integrity status.
            </p>
            {[
              "Full ownership timeline",
              "Blockchain transaction proof",
              "SHA-256 document verification",
              "Current registration status",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(111,213,191,0.12)", border: "1px solid rgba(111,213,191,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic d={ic.check} size={11} stroke="#6FD5BF" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{f}</span>
              </div>
            ))}
          </Reveal>

          <Reveal delay={120}>
            <div style={{ background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(111,213,191,0.15)", borderRadius: 14, padding: 28 }}>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700,
                fontSize: 15, color: "white", marginBottom: 18 }}>Quick Verification</div>
              <form onSubmit={handleSearch}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Ic d={ic.search} size={15} stroke="rgba(255,255,255,0.35)"
                    style={{ position: "absolute", left: 13, top: "50%",
                      transform: "translateY(-50%)" }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. PLT-0024 or Andheri West…"
                    style={{ width: "100%", padding: "11px 14px 11px 40px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8,
                      color: "white", fontSize: 14, outline: "none",
                      fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s" }}
                    onFocus={e => e.target.style.borderColor="rgba(111,213,191,0.5)"}
                    onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.1)"}
                  />
                </div>
                <button type="submit" style={{ width: "100%", height: 44,
                  background: "#173F35", border: "1.5px solid rgba(111,213,191,0.3)",
                  borderRadius: 8, color: "white", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, transition: "background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background="#287A68"}
                  onMouseOut={e  => e.currentTarget.style.background="#173F35"}>
                  <Ic d={ic.search} size={15} stroke="white" /> Search Records
                </button>
              </form>

              {/* Sample result preview */}
              <div style={{ marginTop: 20, padding: "14px 16px",
                background: "rgba(111,213,191,0.05)",
                border: "1px solid rgba(111,213,191,0.15)", borderRadius: 9 }}>
                <div style={{ display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600, fontSize: 14, color: "white" }}>PLT-0024</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6FD5BF",
                    background: "rgba(111,213,191,0.12)", padding: "2px 9px", borderRadius: 4 }}>
                    ✓ Verified
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["Location","Andheri West"],["Area","150 m²"],["Status","Active"],["Last Tx","2s ago"]].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0d2820", padding: "80px 52px",
        borderTop: "1px solid rgba(111,213,191,0.08)", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 700,
            color: "white", letterSpacing: "-0.025em", marginBottom: 16 }}>
            Ready to register your land?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 32 }}>
            One account. Full history. Always verifiable.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 50, padding: "0 32px", borderRadius: 9,
              background: "#287A68", color: "white",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 20px rgba(40,122,104,0.4)",
              transition: "background 0.15s" }}
              onMouseOver={e => e.currentTarget.style.background="#1f6a58"}
              onMouseOut={e  => e.currentTarget.style.background="#287A68"}>
              Get Started <Ic d={ic.arrow} size={15} stroke="white" />
            </Link>
            <Link to="/verify" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 50, padding: "0 28px", borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: 500,
              textDecoration: "none", transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; }}
              onMouseOut={e  => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}>
              Verify a Record
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: "#040b08", padding: "36px 52px",
        borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, background: "#287A68", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic d={ic.location} size={13} stroke="white" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 15, color: "rgba(255,255,255,0.7)" }}>Plotify</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            Blockchain land registry · Records are tamper-evident, not legally binding
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Login","/login"],["Dashboard","/dashboard"],["Verify","/verify"]].map(([l,to]) => (
              <Link key={l} to={to} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)",
                textDecoration: "none", transition: "color 0.15s" }}
                onMouseOver={e => e.target.style.color="rgba(255,255,255,0.8)"}
                onMouseOut={e  => e.target.style.color="rgba(255,255,255,0.4)"}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
