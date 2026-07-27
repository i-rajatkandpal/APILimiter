import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
import {
  KeyRound,
  Copy,
  Check,
  Plus,
  MoreHorizontal,
  RotateCw,
  Power,
  Trash2,
  X,
  ArrowUpRight,
  Activity,
  Terminal,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  Zap,
  Cpu,
  Layers,
  Lock,
  Shield,
  HelpCircle,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
   bg        #0A0A0B   near-black canvas
   surface   #131316   card / panel
   surface2  #1A1A1E   raised / hover
   line      #232327   hairline borders + grid
   text      #F2F1EC   primary text (warm-white, not pure #fff)
   sub       #8B8B8F   secondary text
   brass     #C9924F   signature accent — "the key" — used sparingly
   brassSoft #3A2E1E   brass-tinted surface for badges
   good      #6FCF97   enabled state
   bad       #E5735A   destructive / disabled state
   Display face: Fraunces (serif, warm, keyed to "profound/enterprise" register)
   Body face:    Inter
   Data face:    JetBrains Mono — every key, token, header, timestamp
--------------------------------------------------------- */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

function useCopy() {
  const [copiedId, setCopiedId] = useState(null);
  const copy = (text, id) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (e) { }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };
  return { copiedId, copy };
}

function genKey() { /* not used anymore */
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "api_k_";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function mask(key) {
  return "••••••••" + key.slice(-4);
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ---------------------------------------------------------
   GRID BACKDROP — signature element.
   Faint vertical hairlines with a moving horizontal
   "scan" line, evoking the rate-limiter's window ticking.
--------------------------------------------------------- */
function GridBackdrop() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(to right, transparent 0, transparent calc(16.66% - 1px), #1E1E22 16.66%)",
        opacity: 0.6,
      }}
    />
  );
}

function Logo({ size = 22 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "#F2F1EC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <KeyRound size={size * 0.6} color="#0A0A0B" strokeWidth={2.4} />
    </div>
  );
}

function Button({ children, variant = "primary", onClick, style, disabled, icon: Icon, type = "button" }) {
  const base = {
    fontFamily: "Inter, sans-serif",
    fontSize: 13.5,
    fontWeight: 600,
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.15s ease",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
  const variants = {
    primary: { background: "#F2F1EC", color: "#0A0A0B" },
    secondary: { background: "#1A1A1E", color: "#F2F1EC", border: "1px solid #2A2A2E" },
    ghost: { background: "transparent", color: "#B4B4B8" },
    danger: { background: "transparent", color: "#E5735A", border: "1px solid #3A2420" },
    brass: { background: "#C9924F", color: "#1A1206" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "#FFFFFF";
        if (variant === "secondary") e.currentTarget.style.background = "#212125";
        if (variant === "ghost") e.currentTarget.style.color = "#F2F1EC";
        if (variant === "danger") e.currentTarget.style.background = "#1E1412";
        if (variant === "brass") e.currentTarget.style.background = "#D9A05F";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = variants[variant].background;
      }}
    >
      {Icon && <Icon size={14.5} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, mono }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: "#8B8B8F", marginBottom: 7, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#0D0D0F",
          border: "1px solid #2A2A2E",
          borderRadius: 8,
          padding: "10px 12px",
          color: "#F2F1EC",
          fontSize: 13.5,
          fontFamily: mono ? "'JetBrains Mono', monospace" : "Inter, sans-serif",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#C9924F")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2E")}
      />
    </label>
  );
}

/* ---------------------------------------------------------
   AUTH SCREEN
--------------------------------------------------------- */
function AuthScreen({ onAuth, onBack, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter an email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Registration failed");
        setMode("login");
        setError("Registration successful! Please sign in.");
      } else {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Invalid credentials");
        onAuth(email, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{FONT_IMPORT}</style>
      <GridBackdrop />
      <div style={{ position: "relative", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1A1A1D" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: "#F2F1EC", fontWeight: 500 }}>Gateway</span>
        </div>
        <Button variant="ghost" onClick={onBack}>← Back to home</Button>
      </div>

      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: 380, maxWidth: "100%" }}>
          <div style={{ fontSize: 12.5, color: "#C9924F", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: 0.4, marginBottom: 10, textTransform: "uppercase" }}>
            {mode === "login" ? "Sign in" : "Create account"}
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, color: "#F2F1EC", margin: "0 0 10px 0", fontWeight: 500, lineHeight: 1.15 }}>
            {mode === "login" ? "Welcome back to\nyour gateway" : "Issue keys.\nEnforce limits."}
          </h1>
          <p style={{ color: "#8B8B8F", fontSize: 14, fontFamily: "Inter, sans-serif", marginBottom: 28, lineHeight: 1.5 }}>
            {mode === "login"
              ? "Sign in to manage your API keys and rate limits."
              : "Create an account to start generating rate-limited API keys."}
          </p>

          <form onSubmit={submit}>
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" mono />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" mono />

            {error && (
              <div style={{ color: "#E5735A", fontSize: 13, marginBottom: 14, fontFamily: "Inter, sans-serif" }}>{error}</div>
            )}

            <Button type="submit" variant="primary" style={{ width: "100%", justifyContent: "center", padding: "11px 16px" }} disabled={loading}>
              {loading ? <Loader2 size={14} className="spin" /> : null}
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div style={{ marginTop: 20, fontSize: 13, color: "#8B8B8F", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
            {mode === "login" ? "New here? " : "Already have an account? "}
            <span
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{ color: "#F2F1EC", cursor: "pointer", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {mode === "login" ? "Create an account" : "Sign in instead"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   TOP NAV
--------------------------------------------------------- */
function Nav({ email, onLogout, view, setView }) {
  const tabs = [
    { id: "keys", label: "API Keys" },
    { id: "gateway", label: "Gateway" },
    { id: "admin", label: "Rate Limiter" },
  ];
  return (
    <div style={{ position: "relative", borderBottom: "1px solid #1A1A1D", background: "#0A0A0B" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: "#F2F1EC", fontWeight: 500 }}>Gateway</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map((t) => (
              <div
                key={t.id}
                onClick={() => setView(t.id)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13.5,
                  fontWeight: 600,
                  padding: "7px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: view === t.id ? "#F2F1EC" : "#8B8B8F",
                  background: view === t.id ? "#1A1A1E" : "transparent",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "#8B8B8F" }}>{email}</span>
          <Button variant="secondary" onClick={onLogout}>Log out</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   GENERATE KEY MODAL
--------------------------------------------------------- */
function GenerateModal({ onClose, onCreate }) {
  const [targetUrl, setTargetUrl] = useState("");
  const [plan, setPlan] = useState("FREE");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div style={{ width: 440, maxWidth: "100%", background: "#131316", border: "1px solid #232327", borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#F2F1EC", fontWeight: 500 }}>Generate a key</div>
            <div style={{ fontSize: 13, color: "#8B8B8F", fontFamily: "Inter, sans-serif", marginTop: 4 }}>
              Requests to your gateway URL are proxied to this target.
            </div>
          </div>
          <X size={18} color="#8B8B8F" style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <Field label="Target URL" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://actual-api.com/backend" mono />

        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12.5, color: "#8B8B8F", marginBottom: 7, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Plan</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["FREE", "PRO", "SCALE"].map((p) => (
              <div
                key={p}
                onClick={() => setPlan(p)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "9px 0",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: plan === p ? "1px solid #C9924F" : "1px solid #2A2A2E",
                  background: plan === p ? "#241C0F" : "#0D0D0F",
                  color: plan === p ? "#D9A05F" : "#8B8B8F",
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancel</Button>
          <Button
            variant="brass"
            style={{ flex: 1, justifyContent: "center" }}
            disabled={!targetUrl}
            onClick={() => targetUrl && onCreate(targetUrl, plan)}
          >
            Generate key
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   NEW KEY REVEAL MODAL (shown once)
--------------------------------------------------------- */
function RevealModal({ apiKey, onClose }) {
  const { copiedId, copy } = useCopy();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div style={{ width: 480, maxWidth: "100%", background: "#131316", border: "1px solid #3A2E1E", borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={18} color="#C9924F" />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: "#F2F1EC", fontWeight: 500 }}>Save this key now</div>
        </div>
        <div style={{ fontSize: 13, color: "#8B8B8F", fontFamily: "Inter, sans-serif", marginBottom: 18 }}>
          It won't be shown again. Store it somewhere safe.
        </div>

        <div
          style={{
            background: "#0D0D0F",
            border: "1px solid #2A2A2E",
            borderRadius: 8,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#F2F1EC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {apiKey}
          </span>
          <div onClick={() => copy(apiKey, "reveal")} style={{ cursor: "pointer", color: copiedId === "reveal" ? "#6FCF97" : "#8B8B8F", flexShrink: 0 }}>
            {copiedId === "reveal" ? <Check size={16} /> : <Copy size={16} />}
          </div>
        </div>

        <Button variant="primary" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
          I've saved it
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CONFIRM DIALOG (rotate / delete)
--------------------------------------------------------- */
function ConfirmDialog({ title, body, confirmLabel, variant, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div style={{ width: 380, maxWidth: "100%", background: "#131316", border: "1px solid #232327", borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#F2F1EC", fontWeight: 500, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "#8B8B8F", fontFamily: "Inter, sans-serif", marginBottom: 22, lineHeight: 1.5 }}>{body}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} style={{ flex: 1, justifyContent: "center" }}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} style={{ flex: 1, justifyContent: "center", background: variant === "danger" ? "#E5735A" : undefined, color: variant === "danger" ? "#1A0F0C" : undefined, border: "none" }}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   KEY ROW
--------------------------------------------------------- */
function KeyRow({ k, onToggle, onRotate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { copiedId, copy } = useCopy();
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1.6fr 0.8fr 0.8fr 0.9fr 40px",
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: "1px solid #1A1A1D",
        fontFamily: "Inter, sans-serif",
        fontSize: 13.5,
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono', monospace", color: "#D9D9D6" }}>
        {k.apiKey}
      </div>
      <div style={{ color: "#8B8B8F", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {k.targetUrl}
      </div>
      <div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 500, color: "#D9A05F", background: "#241C0F", border: "1px solid #3A2E1E", padding: "3px 8px", borderRadius: 5 }}>
          {k.plan}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: k.enabled ? "#6FCF97" : "#5C5C60" }} />
        <span style={{ color: k.enabled ? "#B9E6C9" : "#8B8B8F", fontSize: 12.5 }}>{k.enabled ? "Enabled" : "Disabled"}</span>
      </div>
      <div style={{ color: "#5C5C60", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{timeAgo(k.createdAt)}</div>
      <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }} ref={menuRef}>
        <div onClick={() => setMenuOpen((v) => !v)} style={{ cursor: "pointer", color: "#8B8B8F", padding: 4 }}>
          <MoreHorizontal size={16} />
        </div>
        {menuOpen && (
          <div style={{ position: "absolute", top: 26, right: 0, background: "#1A1A1E", border: "1px solid #2A2A2E", borderRadius: 8, minWidth: 160, zIndex: 10, overflow: "hidden" }}>
            <MenuItem icon={Power} label={k.enabled ? "Disable" : "Enable"} onClick={() => { onToggle(k); setMenuOpen(false); }} />
            <MenuItem icon={RotateCw} label="Rotate" onClick={() => { onRotate(k); setMenuOpen(false); }} />
            <MenuItem icon={Trash2} label="Delete" danger onClick={() => { onDelete(k); setMenuOpen(false); }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 12px",
        fontSize: 13,
        fontFamily: "Inter, sans-serif",
        color: danger ? "#E5735A" : "#D9D9D6",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#232327")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={14} />
      {label}
    </div>
  );
}

/* ---------------------------------------------------------
   KEYS VIEW
--------------------------------------------------------- */

function KeysView({ keys, fetchKeys, token, setRevealKey }) {
  const [showGenerate, setShowGenerate] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const handleCreate = async (targetUrl, plan) => {
    try {
      const res = await fetch(`${API_BASE}/api/keys/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUrl, planName: plan }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowGenerate(false);
        setRevealKey(data.apiKey);
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (k) => {
    const action = k.enabled ? "disable" : "enable";
    await fetch(`${API_BASE}/api/keys/${k.id}/${action}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchKeys();
  };

  const handleRotate = (k) => {
    setConfirmAction({ type: "rotate", key: k });
  };
  const handleDelete = (k) => {
    setConfirmAction({ type: "delete", key: k });
  };

  const runConfirm = async () => {
    if (!confirmAction) return;
    const { type, key } = confirmAction;
    if (type === "delete") {
      await fetch(`${API_BASE}/api/keys/${key.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } else if (type === "rotate") {
      const res = await fetch(`${API_BASE}/api/keys/${key.id}/rotate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRevealKey(data.apiKey);
      }
    }
    setConfirmAction(null);
    fetchKeys();
  };

  const enabledCount = keys.filter((k) => k.enabled).length;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#C9924F", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
            API Keys
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: "#F2F1EC", margin: 0, fontWeight: 500 }}>
            Issue and manage keys
          </h1>
        </div>
        <Button variant="brass" icon={Plus} onClick={() => setShowGenerate(true)}>Generate key</Button>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total keys" value={keys.length} />
        <StatCard label="Enabled" value={enabledCount} accent />
        <StatCard label="Disabled" value={keys.length - enabledCount} />
      </div>

      <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, overflow: "visible", background: "#0D0D0F" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.6fr 0.8fr 0.8fr 0.9fr 40px",
            padding: "12px 18px",
            borderBottom: "1px solid #1A1A1D",
            fontSize: 11.5,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            color: "#5C5C60",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            gap: 12,
          }}
        >
          <div>Key</div>
          <div>Target URL</div>
          <div>Plan</div>
          <div>Status</div>
          <div>Created</div>
          <div></div>
        </div>

        {keys.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <KeyRound size={22} color="#3A3A3E" style={{ marginBottom: 10 }} />
            <div style={{ color: "#8B8B8F", fontFamily: "Inter, sans-serif", fontSize: 13.5, marginBottom: 16 }}>
              No keys yet. Generate one to start proxying requests.
            </div>
            <Button variant="secondary" icon={Plus} onClick={() => setShowGenerate(true)} style={{ margin: "0 auto" }}>
              Generate key
            </Button>
          </div>
        ) : (
          keys.map((k) => <KeyRow key={k.id} k={k} onToggle={handleToggle} onRotate={handleRotate} onDelete={handleDelete} />)
        )}
      </div>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onCreate={handleCreate} />}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "delete" ? "Delete this key?" : "Rotate this key?"}
          body={
            confirmAction.type === "delete"
              ? "This can't be undone. Requests using this key will start failing immediately."
              : "The current key stops working immediately. A new key will be issued."
          }
          confirmLabel={confirmAction.type === "delete" ? "Delete key" : "Rotate key"}
          variant={confirmAction.type === "delete" ? "danger" : "brass"}
          onConfirm={runConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ flex: 1, border: "1px solid #1A1A1D", borderRadius: 10, padding: "16px 18px", background: "#0D0D0F" }}>
      <div style={{ fontSize: 12, color: "#8B8B8F", fontFamily: "Inter, sans-serif", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: "'JetBrains Mono', monospace", color: accent ? "#6FCF97" : "#F2F1EC", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   GATEWAY TESTER VIEW
--------------------------------------------------------- */

function GatewayView() {
  const [apiKey, setApiKey] = useState("");
  const [path, setPath] = useState("/v1/resource");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!apiKey) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/gateway${path}`, {
        method: "GET",
        headers: { "X-API-Key": apiKey }
      });
      const bodyText = await res.text();
      let bodyObj = bodyText;
      try { bodyObj = JSON.parse(bodyText); } catch (e) { }
      const hdrs = {};
      res.headers.forEach((v, k) => hdrs[k] = v);

      setResult({ status: res.status, body: bodyObj, headers: hdrs });
    } catch (err) {
      setResult({ status: 500, body: { error: err.message }, headers: {} });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 32px" }}>
      <div style={{ fontSize: 12.5, color: "#C9924F", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
        Gateway
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: "#F2F1EC", margin: "0 0 6px 0", fontWeight: 500 }}>
        Send a test request
      </h1>
      <p style={{ color: "#8B8B8F", fontSize: 14, fontFamily: "Inter, sans-serif", marginBottom: 28 }}>
        Simulates a call through <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>/gateway/**</span> with your key.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F" }}>
          <Field label="Paste Full API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="api_k_..." mono />

          <Field label="Path" value={path} onChange={(e) => setPath(e.target.value)} mono />

          <Button variant="brass" icon={Terminal} onClick={run} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Sending…" : "Send request"}
          </Button>
        </div>

        <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, minHeight: 220, overflow: "auto" }}>
          {!result && !loading && <div style={{ color: "#5C5C60" }}>Response will appear here.</div>}
          {loading && <div style={{ color: "#8B8B8F", display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={14} className="spin" /> waiting…</div>}
          {result && (
            <div>
              <div style={{ color: result.status >= 200 && result.status < 300 ? "#6FCF97" : "#E5735A", marginBottom: 10, fontWeight: 500 }}>
                {result.status} {result.status === 200 ? "OK" : result.status === 429 ? "Too Many Requests" : "Error"}
              </div>
              {Object.keys(result.headers).length > 0 && (
                <div style={{ marginBottom: 10, color: "#8B8B8F" }}>
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div key={k}>{k}: <span style={{ color: "#D9D9D6" }}>{v}</span></div>
                  ))}
                </div>
              )}
              <pre style={{ margin: 0, color: "#D9D9D6", whiteSpace: "pre-wrap" }}>{JSON.stringify(result.body, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ADMIN / RATE LIMITER VIEW
--------------------------------------------------------- */

function AdminView() {
  const [apiKey, setApiKey] = useState("");
  const [limit, setLimit] = useState(100);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [algorithm, setAlgorithm] = useState("FIXED_WINDOW");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState(null);

  const check = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ratelimit/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, limit, windowSeconds, algorithm })
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ allowed: false, remaining: 0, resetAt: 0 });
    } finally {
      setLoading(false);
    }
  };

  const pingHealth = async () => {
    setHealth("checking");
    try {
      const res = await fetch(`${API_BASE}/api/v1/ratelimit/test`);
      if (res.ok) setHealth(await res.text());
      else setHealth("error");
    } catch {
      setHealth("error");
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 32px" }}>
      <div style={{ fontSize: 12.5, color: "#C9924F", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
        Internal
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: "#F2F1EC", margin: "0 0 6px 0", fontWeight: 500 }}>
        Rate limiter checks
      </h1>
      <p style={{ color: "#8B8B8F", fontSize: 14, fontFamily: "Inter, sans-serif", marginBottom: 28 }}>
        Direct access to the algorithm, bypassing the gateway.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F" }}>
          <Field label="Key" placeholder="api_k_..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} mono />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Limit" type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} mono />
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Window (s)" type="number" value={windowSeconds} onChange={(e) => setWindowSeconds(Number(e.target.value))} mono />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: "#8B8B8F", marginBottom: 7, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Algorithm</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["FIXED_WINDOW", "SLIDING_WINDOW", "TOKEN_BUCKET"].map((a) => (
                <div
                  key={a}
                  onClick={() => setAlgorithm(a)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: "pointer",
                    border: algorithm === a ? "1px solid #C9924F" : "1px solid #2A2A2E",
                    background: algorithm === a ? "#241C0F" : "transparent",
                    color: algorithm === a ? "#D9A05F" : "#8B8B8F",
                  }}
                >
                  {a.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          </div>
          <Button variant="brass" icon={Activity} onClick={check} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Checking…" : "Run check"}
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: health ? 10 : 0 }}>
              <div style={{ fontSize: 13, color: "#F2F1EC", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Health check</div>
              <Button variant="secondary" onClick={pingHealth}>Ping</Button>
            </div>
            {health && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: health === "checking" ? "#8B8B8F" : "#6FCF97" }}>
                {health === "checking" ? "pinging…" : health}
              </div>
            )}
          </div>

          <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
            <div style={{ fontSize: 12, color: "#5C5C60", fontFamily: "Inter, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Response</div>
            {!result && <div style={{ color: "#5C5C60" }}>Run a check to see the result.</div>}
            {result && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: result.allowed ? "#6FCF97" : "#E5735A" }} />
                  <span style={{ color: result.allowed ? "#6FCF97" : "#E5735A", fontWeight: 500 }}>
                    {result.allowed ? "ALLOWED" : "DENIED"}
                  </span>
                </div>
                <div style={{ color: "#8B8B8F", marginBottom: 4 }}>remaining: <span style={{ color: "#D9D9D6" }}>{result.remaining}</span></div>
                <div style={{ color: "#8B8B8F" }}>resetAt: <span style={{ color: "#D9D9D6" }}>{result.resetAt}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT APP
--------------------------------------------------------- */
/* ---------------------------------------------------------
   LANDING / MARKETING SCREEN
 --------------------------------------------------------- */
function LandingScreen({ onNavigate }) {
  // Simulator State
  const [algo, setAlgo] = useState("FIXED_WINDOW");
  const [limit, setLimit] = useState(5);
  const [windowSec, setWindowSec] = useState(10);
  const [logs, setLogs] = useState([
    { id: 1, time: "Initial", type: "info", text: "Rate limit simulator ready. Try triggering requests!" }
  ]);

  // Simulation implementation states
  const [fixedTokens, setFixedTokens] = useState(5);
  const [fixedLastReset, setFixedLastReset] = useState(Date.now());
  const [tbTokens, setTbTokens] = useState(5);
  const [tbLastReset, setTbLastReset] = useState(Date.now());
  const [slidingReqs, setSlidingReqs] = useState([]);

  // Sync token pool capacity when limit slider values change
  useEffect(() => {
    setFixedTokens(limit);
    setTbTokens(limit);
    setSlidingReqs([]);
  }, [limit, algo]);

  const triggerMockRequest = () => {
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let allowed = false;
    let remaining = 0;

    if (algo === "FIXED_WINDOW") {
      let currentReset = fixedLastReset;
      let currentTokens = fixedTokens;

      if (now - fixedLastReset > windowSec * 1000) {
        currentReset = now;
        currentTokens = limit;
        setFixedLastReset(now);
      }

      if (currentTokens > 0) {
        allowed = true;
        remaining = currentTokens - 1;
        setFixedTokens(remaining);
      } else {
        allowed = false;
        remaining = 0;
      }
    } else if (algo === "TOKEN_BUCKET") {
      const elapsed = (now - tbLastReset) / 1000;
      const refilled = Math.min(limit, tbTokens + elapsed * (limit / windowSec));

      setTbLastReset(now);
      if (refilled >= 1) {
        allowed = true;
        remaining = Math.floor(refilled - 1);
        setTbTokens(refilled - 1);
      } else {
        allowed = false;
        remaining = Math.floor(refilled);
        setTbTokens(refilled);
      }
    } else { // SLIDING_WINDOW
      const windowStart = now - windowSec * 1000;
      const validReqs = slidingReqs.filter(t => t > windowStart);

      if (validReqs.length < limit) {
        allowed = true;
        const newReqs = [...validReqs, now];
        setSlidingReqs(newReqs);
        remaining = limit - newReqs.length;
      } else {
        allowed = false;
        setSlidingReqs(validReqs);
        remaining = 0;
      }
    }

    const newLog = {
      id: Date.now(),
      time: timeStr,
      type: allowed ? "success" : "warn",
      text: allowed
        ? `GET /v1/users/me → 200 OK | Allowed (Remaining: ${remaining})`
        : `GET /v1/users/me → 429 Too Many Requests | Blocked (Limit: ${limit}/${windowSec}s)`
    };

    setLogs(prev => [newLog, ...prev.slice(0, 7)]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F1EC", position: "relative", overflow: "hidden" }}>
      <GridBackdrop />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", borderBottom: "1px solid #1A1A1D", background: "rgba(10, 10, 11, 0.7)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo />
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 500 }}>Gateway</span>
          </div>
          <div style={{ width: 1, height: 16, background: "#2A2A2E" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8B8B8F", fontFamily: "Inter, sans-serif" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6FCF97", display: "inline-block", boxShadow: "0 0 8px #6FCF97" }} />
            System Live
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#simulator" style={{ color: "#8B8B8F", textDecoration: "none", fontSize: 13.5, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#F2F1EC"} onMouseLeave={e => e.target.style.color = "#8B8B8F"}>Sandbox</a>
          <a href="#features" style={{ color: "#8B8B8F", textDecoration: "none", fontSize: 13.5, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#F2F1EC"} onMouseLeave={e => e.target.style.color = "#8B8B8F"}>Algorithms</a>
          <a href="#plans" style={{ color: "#8B8B8F", textDecoration: "none", fontSize: 13.5, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#F2F1EC"} onMouseLeave={e => e.target.style.color = "#8B8B8F"}>Pricing</a>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button variant="secondary" onClick={() => onNavigate("login")}>Sign in</Button>
            <Button variant="brass" onClick={() => onNavigate("register")} icon={ArrowUpRight}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1040, margin: "0 auto", padding: "80px 24px 60px 24px", textAlign: "center" }}>
        {/* Glow backdrop aura */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 350, background: "radial-gradient(ellipse, rgba(201, 146, 79, 0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: -1 }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 99, background: "#1B1712", border: "1px solid #3A2E1E", color: "#D9A05F", fontSize: 12, fontWeight: 500, marginBottom: 20 }}>
          <Shield size={12} />
          High-Performance Redis API Gateway
        </div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 58, lineHeight: 1.1, fontWeight: 400, color: "#F2F1EC", margin: "0 0 20px 0", letterSpacing: "-0.01em" }}>
          Distribute API keys.<br />Enforce limits at the edge.
        </h1>
        <p style={{ maxWidth: 640, margin: "0 auto 36px auto", color: "#8B8B8F", fontSize: 17, lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
          Protect your server infrastructure from runaway scripts and loops. Setup scalable Token Bucket, Sliding Window, or Fixed Window limits in seconds.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <Button variant="brass" style={{ padding: "12px 24px", fontSize: 14.5 }} onClick={() => onNavigate("register")} icon={ArrowUpRight}>
            Create your keys
          </Button>
          <a href="#simulator" style={{ textDecoration: "none" }}>
            <Button variant="secondary" style={{ padding: "12px 24px", fontSize: 14.5 }}>
              Try Live Simulator
            </Button>
          </a>
        </div>
      </section>

      {/* Live Simulator Section */}
      <section id="simulator" style={{ position: "relative", zIndex: 5, maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 12, color: "#C9924F", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Interactive Sandbox</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400 }}>Test rates in real-time</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
          {/* Controls Box */}
          <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 26, background: "#0D0D0F" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#8B8B8F", marginBottom: 6, fontWeight: 500 }}>
                <span>Rate Limit Capacity</span>
                <span style={{ color: "#C9924F", fontFamily: "monospace" }}>{limit} req</span>
              </label>
              <input
                type="range" min="1" max="20" value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#C9924F", cursor: "pointer", background: "#1A1A1E", height: 6, borderRadius: 3 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#8B8B8F", marginBottom: 6, fontWeight: 500 }}>
                <span>Time Window (Seconds)</span>
                <span style={{ color: "#C9924F", fontFamily: "monospace" }}>{windowSec}s</span>
              </label>
              <input
                type="range" min="3" max="30" value={windowSec}
                onChange={(e) => setWindowSec(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#C9924F", cursor: "pointer", background: "#1A1A1E", height: 6, borderRadius: 3 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12.5, color: "#8B8B8F", marginBottom: 8, fontWeight: 500 }}>Select Algorithm</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { key: "FIXED_WINDOW", label: "Fixed Window" },
                  { key: "SLIDING_WINDOW", label: "Sliding Window" },
                  { key: "TOKEN_BUCKET", label: "Token Bucket" }
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setAlgo(item.key)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontFamily: "Inter, sans-serif",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                      border: algo === item.key ? "1px solid #C9924F" : "1px solid #2A2A2E",
                      background: algo === item.key ? "#241C0F" : "transparent",
                      color: algo === item.key ? "#D9A05F" : "#8B8B8F",
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="brass" icon={Zap} onClick={triggerMockRequest} style={{ width: "100%", justifyContent: "center", padding: "12px 16px" }}>
              Trigger API Request
            </Button>
          </div>

          {/* Terminal Console Feed Box */}
          <div style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 22, background: "#0D0D0F", minHeight: 310, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1A1A1D", paddingBottom: 12, marginBottom: 12 }}>
              <Terminal size={14} style={{ color: "#C9924F" }} />
              <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#5C5C60", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                Gateway Live Logs
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <div key={log.id} style={{
                  color: log.type === "success" ? "#6FCF97" : log.type === "warn" ? "#E5735A" : "#8B8B8F",
                  padding: "4px 8px",
                  background: log.type === "success" ? "rgba(111, 207, 151, 0.04)" : log.type === "warn" ? "rgba(229, 115, 90, 0.04)" : "transparent",
                  borderRadius: 4,
                  lineHeight: 1.4
                }}>
                  <span style={{ color: "#5C5C60", marginRight: 8 }}>[{log.time}]</span>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards Grid */}
      <section id="features" style={{ borderTop: "1px solid #1A1A1D", padding: "80px 24px", background: "#0A0A0B" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ fontSize: 12, color: "#C9924F", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Algorithms</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 400 }}>Choose your throttling style</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {[
              {
                icon: Cpu,
                title: "Token Bucket",
                desc: "Allows transient bursts of traffic, refilling tokens continuously at a set fill rate. Perfect for endpoints where latency remains a high priority."
              },
              {
                icon: Layers,
                title: "Sliding Window",
                desc: "Granular, rolling-time checking. Rejects bursts at edge window seams by evaluating requests in a sliding epoch window of memory."
              },
              {
                icon: Lock,
                title: "Fixed Window",
                desc: "Resets limits on clean clock-second seams. Light on compute and memory, providing robust protection with low storage requirements."
              }
            ].map((f, i) => (
              <div key={i} style={{ border: "1px solid #1A1A1D", borderRadius: 12, padding: 28, background: "#0D0D0F", transition: "transform 0.2s" }}>
                <div style={{ background: "#241C0F", border: "1px solid #3A2E1E", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#D9A05F", marginBottom: 20 }}>
                  <f.icon size={18} />
                </div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 600, color: "#F2F1EC", marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: "#8B8B8F", fontSize: 13.5, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Tiers Section */}
      <section id="plans" style={{ borderTop: "1px solid #1A1A1D", padding: "80px 24px", background: "#0D0D0F" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ fontSize: 12, color: "#C9924F", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Tier Configurations</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 400 }}>Choose your rate limits</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {[
              {
                name: "FREE",
                limit: "10 req / min",
                algo: "Token Bucket",
                price: "$0",
                desc: "For microservice testing and playground scenarios.",
                features: ["1 Active API key", "Token Bucket algorithm", "Direct Gateway proxying"]
              },
              {
                name: "PRO",
                limit: "100 req / min",
                algo: "Sliding Window",
                price: "$29",
                desc: "For staging services, webhooks, and production utilities.",
                features: ["Up to 10 API keys", "Sliding Window checks", "Key rotation endpoints", "Proxy path mapping"]
              },
              {
                name: "SCALE",
                limit: "1000 req / min",
                algo: "Sliding Window",
                price: "$149",
                desc: "For commercial APIs and server-to-server gateways.",
                features: ["Unlimited API keys", "Sliding Window checks", "Priority Redis clustering", "Key rotation & enable controls"]
              }
            ].map((p, i) => (
              <div key={i} style={{ border: `1px solid ${i === 1 ? "#C9924F" : "#1A1A1D"}`, borderRadius: 12, padding: 32, background: i === 1 ? "#120E0A" : "#0A0A0B", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                    <span style={{ fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: i === 1 ? "#D9A05F" : "#8B8B8F", fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "#F2F1EC" }}>{p.price}<span style={{ fontSize: 12, color: "#8B8B8F", fontFamily: "Inter, sans-serif" }}>/mo</span></span>
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: "#F2F1EC", marginBottom: 6 }}>{p.limit}</h4>
                  <div style={{ fontSize: 12.5, color: "#8B8B8F", marginBottom: 20 }}>Uses <strong style={{ color: "#D9D9D6" }}>{p.algo}</strong></div>

                  <div style={{ width: "100%", height: 1, background: i === 1 ? "#3A2E1E" : "#1A1A1D", marginBottom: 20 }} />

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                    {p.features.map((feat, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8B8B8F" }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: i === 1 ? "#D9A05F" : "#5C5C60" }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={i === 1 ? "brass" : "secondary"}
                  onClick={() => onNavigate("register")}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Start with {p.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1A1A1D", padding: "30px 40px", background: "#0A0A0B", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "#5C5C60" }}>
        <div>© 2026 Gateway. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="#simulator" style={{ color: "#5C5C60", textDecoration: "none" }}>Sandbox</a>
          <a href="#features" style={{ color: "#5C5C60", textDecoration: "none" }}>Status</a>
          <a href="#" style={{ color: "#5C5C60", textDecoration: "none" }}>Privacy</a>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT APP
 --------------------------------------------------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState("keys");
  const [route, setRoute] = useState("landing"); // "landing" | "auth" | "dashboard"
  const [authMode, setAuthMode] = useState("login");
  const [keys, setKeys] = useState([]);
  const [revealKey, setRevealKey] = useState(null);

  const fetchKeys = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/keys/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (e) { console.error("failed to load keys"); }
  };

  useEffect(() => {
    fetchKeys();
  }, [token]);

  // If user is authenticated, route should be "dashboard"
  const handleAuth = (email, t) => {
    setUser(email);
    setToken(t);
    setRoute("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setRoute("landing");
  };

  if (route === "landing") {
    return (
      <LandingScreen
        onNavigate={(mode) => {
          setAuthMode(mode);
          setRoute("auth");
        }}
      />
    );
  }

  if (route === "auth" && (!user || !token)) {
    return (
      <AuthScreen
        initialMode={authMode}
        onAuth={handleAuth}
        onBack={() => setRoute("landing")}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B" }}>
      <style>{FONT_IMPORT}</style>
      <Nav email={user} onLogout={handleLogout} view={view} setView={setView} />
      {view === "keys" && <KeysView keys={keys} fetchKeys={fetchKeys} token={token} setRevealKey={setRevealKey} />}
      {view === "gateway" && <GatewayView />}
      {view === "admin" && <AdminView />}
      {revealKey && <RevealModal apiKey={revealKey} onClose={() => setRevealKey(null)} />}
    </div>
  );
}
