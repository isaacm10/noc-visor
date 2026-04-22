import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ─── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://uazaihdhpderwqmhglni.supabase.co";
const SUPABASE_KEY = "sb_publishable_e9ERp7L3Z2JVGFXe5XwE1w_lpxqjX82";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function fmtFecha(raw) {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    // Convertir a hora de Honduras (UTC-6)
    const hn = new Date(d.toLocaleString("en-US", { timeZone: "America/Tegucigalpa" }));
    const dia = DIAS[hn.getDay()];
    const dd  = String(hn.getDate()).padStart(2, "0");
    const mm  = String(hn.getMonth() + 1).padStart(2, "0");
    const yyyy = hn.getFullYear();
    const hh  = String(hn.getHours()).padStart(2, "0");
    const min = String(hn.getMinutes()).padStart(2, "0");
    return `${dia} ${dd}/${mm}/${yyyy}  ${hh}:${min}`;
  } catch { return raw; }
}

// ─── Estilos globales inyectados en <head> ────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #080B12;
    --panel:    #0E1220;
    --panel2:   #141828;
    --accent:   #00C2E0;
    --danger:   #FF3D3D;
    --success:  #00E676;
    --warn:     #F0A500;
    --text:     #DDE3F0;
    --sub:      #5A6580;
    --border:   #1E2540;
    --mono:     'Share Tech Mono', monospace;
    --sans:     'Exo 2', sans-serif;
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--sans); }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--panel); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  input, button { font-family: var(--sans); }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .4; transform: scale(.7); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scanline {
    0%   { background-position: 0 0; }
    100% { background-position: 0 100px; }
  }
  .fade-in { animation: fadeIn .35s ease forwards; }
`;

function injectCSS(css) {
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
}

// ─── Componentes base ─────────────────────────────────────────────────────────
const S = {
  // Layout
  app: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  main: { display: "flex", flex: 1, overflow: "hidden" },

  // Topbar
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", height: 54, background: "var(--panel)",
    borderBottom: "1px solid var(--border)", flexShrink: 0,
    backdropFilter: "blur(8px)", zIndex: 100,
  },
  topbarTitle: { fontFamily: "var(--mono)", color: "var(--accent)", fontSize: 18, letterSpacing: 3 },
  topbarSub:   { fontFamily: "var(--mono)", color: "var(--sub)", fontSize: 10, letterSpacing: 2 },

  // Sidebar
  sidebar: {
    width: 220, background: "var(--panel)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
  },
  sidebarMobile: { display: "none" },

  // Nav items
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 20px", cursor: "pointer", fontSize: 13,
    color: active ? "var(--accent)" : "var(--sub)",
    background: active ? "rgba(0,194,224,.08)" : "transparent",
    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
    transition: "all .2s",
  }),

  // Content area
  content: { flex: 1, overflow: "auto", padding: 20 },

  // Cards / panels
  card: {
    background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 20, marginBottom: 16,
  },
  statCard: (color) => ({
    background: "var(--panel2)", border: `1px solid ${color}33`,
    borderRadius: 10, padding: "16px 20px", textAlign: "center",
    flex: 1, minWidth: 120,
  }),

  // Table
  tableWrap: { overflowX: "auto", borderRadius: 8, border: "1px solid var(--border)" },
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "10px 14px", background: "var(--panel2)", color: "var(--sub)",
    fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1,
    textAlign: "center", borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
  },
  td: (highlight) => ({
    padding: "11px 14px", textAlign: "center",
    borderBottom: "1px solid var(--border)",
    background: highlight ? "rgba(255,61,61,.05)" : "transparent",
    transition: "background .15s",
  }),

  // Inputs / buttons
  input: {
    width: "100%", padding: "10px 14px", background: "var(--panel2)",
    border: "1px solid var(--border)", borderRadius: 8,
    color: "var(--text)", fontSize: 14, outline: "none",
    fontFamily: "var(--sans)",
  },
  btn: (color = "var(--accent)", text = "var(--bg)") => ({
    padding: "10px 20px", background: color, color: text,
    border: "none", borderRadius: 8, cursor: "pointer",
    fontSize: 13, fontWeight: 700, fontFamily: "var(--sans)",
    transition: "opacity .2s", whiteSpace: "nowrap",
  }),
  btnSm: (color = "var(--accent)") => ({
    padding: "5px 12px", background: color, color: "var(--bg)",
    border: "none", borderRadius: 6, cursor: "pointer",
    fontSize: 12, fontWeight: 700, fontFamily: "var(--sans)",
  }),

  // Badges
  badge: (color) => ({
    display: "inline-block", padding: "2px 10px",
    borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: `${color}22`, color: color, border: `1px solid ${color}44`,
  }),

  // Modal overlay
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 32, width: "min(440px, 95vw)",
    animation: "fadeIn .25s ease",
  },
};

// ─── Dot pulsante (estado en vivo) ───────────────────────────────────────────
function LiveDot({ color = "var(--success)" }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, animation: "pulse-dot 1.5s infinite",
      boxShadow: `0 0 6px ${color}`,
    }} />
  );
}

// ─── Componentes de formulario (fuera del componente padre para evitar re-renders) ─
function Field({ label, type = "text", value, onChange, placeholder, showToggle, show, onToggle }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...S.input, paddingRight: showToggle ? 44 : undefined }}
          type={showToggle ? (show ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {showToggle && (
          <button type="button" onClick={onToggle} style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 44,
            background: "var(--border)", border: "none",
            borderRadius: "0 8px 8px 0",
            cursor: "pointer", fontSize: 15,
            color: "var(--text)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{show ? "🙈" : "👁"}</button>
        )}
      </div>
    </div>
  );
}

function LinkBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: "none", border: "none", color: "var(--accent)", cursor: "pointer",
      fontSize: 13, textDecoration: "underline", width: "100%", textAlign: "center", marginTop: 4,
    }}>{children}</button>
  );
}

function AuthLogo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 28, color: "var(--accent)", letterSpacing: 4 }}>NOC VISOR</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sub)", letterSpacing: 3, marginTop: 4 }}>DWDM MONITORING SYSTEM</div>
      <div style={{ width: 60, height: 2, background: "var(--accent)", margin: "12px auto 0", borderRadius: 2 }} />
    </div>
  );
}

const authBg = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--bg)",
  backgroundImage: "radial-gradient(ellipse at 20% 50%, #00C2E011 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #FF3D3D08 0%, transparent 50%)",
};
const authCard = {
  width: "min(420px, 95vw)", background: "var(--panel)",
  border: "1px solid var(--border)", borderRadius: 16, padding: "40px 36px",
};

// ─── AUTH PAGES (Login / Registro / Verificar OTP) ───────────────────────────
function LoginPage({ onLogin }) {
  const [page, setPage] = useState("login"); // "login" | "register" | "verify"

  // Estado compartido
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [pass2, setPass2]       = useState("");
  const [nombre, setNombre]     = useState("");
  const [otp, setOtp]           = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showPw2, setShowPw2]   = useState(false);
  const [err, setErr]           = useState("");
  const [ok, setOk]             = useState("");
  const [loading, setLoading]   = useState(false);
  const pendingEmail            = email; // guardado para verificar OTP

  function reset() { setErr(""); setOk(""); }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !pass) { setErr("Completa todos los campos."); return; }
    setLoading(true); reset();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      const { data: uData } = await supabase.from("usuarios").select("rol").eq("id", data.user.id).single();
      onLogin(data.user, data.session, uData?.rol || "lectura");
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("Email not confirmed")) {
        setErr("Correo no verificado. Revisa tu bandeja.");
        setPage("verify");
      } else {
        setErr(msg || "Error al iniciar sesión.");
      }
    } finally { setLoading(false); }
  }

  // ── Registro ───────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    if (!nombre || !email || !pass) { setErr("Completa todos los campos."); return; }
    if (pass !== pass2)             { setErr("Las contraseñas no coinciden."); return; }
    if (pass.length < 6)            { setErr("Mínimo 6 caracteres."); return; }
    setLoading(true); reset();
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { full_name: nombre } }
      });
      if (error) throw error;
      const identities = data.user?.identities || [];
      if (identities.length === 0) { setErr("Este correo ya está registrado."); setLoading(false); return; }
      setOk("Código enviado a tu correo. Ingrésalo abajo.");
      setPage("verify");
    } catch (e) {
      setErr(e.message || "Error al registrar.");
    } finally { setLoading(false); }
  }

  // ── Verificar OTP ──────────────────────────────────────────────────────────
  async function handleVerify(e) {
    e.preventDefault();
    if (!otp || otp.length < 6) { setErr("Ingresa el código de 6 dígitos."); return; }
    setLoading(true); reset();
    let lastErr = "";
    for (const tipo of ["email", "signup"]) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: otp, type: tipo });
        if (error) { lastErr = error.message; continue; }
        if (data?.user) {
          // Insertar en tabla usuarios
          try {
            await supabase.from("usuarios").insert({
              id: data.user.id, nombre, email: pendingEmail,
              rol: "lectura", creado_en: new Date().toISOString()
            });
          } catch (_) {}
          const { data: uData } = await supabase.from("usuarios").select("rol").eq("id", data.user.id).single();
          onLogin(data.user, data.session, uData?.rol || "lectura");
          return;
        }
      } catch (e) { lastErr = e.message; }
    }
    setErr(`Código incorrecto o expirado. ${lastErr}`);
    setLoading(false);
  }

  async function reenviarOtp() {
    try {
      await supabase.auth.resend({ type: "signup", email: pendingEmail });
      setOk("Código reenviado. Revisa tu correo."); setErr("");
    } catch (e) { setErr("Error al reenviar: " + e.message); }
  }

  // ── Restablecer contraseña ─────────────────────────────────────────────────
  async function handleReset(e) {
    e.preventDefault();
    if (!email) { setErr("Ingresa tu correo primero."); return; }
    setLoading(true); reset();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/?reset=true",
      });
      if (error) throw error;
      setOk("Correo enviado. Revisa tu bandeja de entrada y sigue el enlace.");
    } catch (e) {
      setErr(e.message || "Error al enviar correo.");
    } finally { setLoading(false); }
  }

  // ── Render Login ───────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={authBg}>
      <div className="fade-in" style={authCard}>
        <AuthLogo />
        <div style={{ fontSize: 13, color: "var(--sub)", textAlign: "center", marginBottom: 20 }}>Inicia sesión en tu cuenta</div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={setEmail} placeholder="usuario@empresa.com" />
          <Field label="CONTRASEÑA" value={pass} onChange={setPass} placeholder="••••••••" showToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
          {err && <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center" }}>{err}</div>}
          {ok  && <div style={{ color: "var(--success)", fontSize: 12, textAlign: "center" }}>{ok}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn(), marginTop: 8, height: 46, fontSize: 15, opacity: loading ? .6 : 1 }}>
            {loading ? "Ingresando..." : "INGRESAR"}
          </button>
          <LinkBtn onClick={() => { reset(); setPage("register"); }}>¿No tienes cuenta? Crear cuenta</LinkBtn>
          <LinkBtn onClick={() => { reset(); setPage("reset"); }}>¿Olvidaste tu contraseña?</LinkBtn>
        </form>
      </div>
    </div>
  );

  // ── Render Restablecer contraseña ──────────────────────────────────────────
  if (page === "reset") return (
    <div style={authBg}>
      <div className="fade-in" style={authCard}>
        <AuthLogo />
        <div style={{ fontSize: 13, color: "var(--sub)", textAlign: "center", marginBottom: 6 }}>Restablecer contraseña</div>
        <div style={{ fontSize: 12, color: "var(--sub)", textAlign: "center", marginBottom: 20 }}>
          Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </div>
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={setEmail} placeholder="usuario@empresa.com" />
          {err && <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center" }}>{err}</div>}
          {ok  && <div style={{ color: "var(--success)", fontSize: 12, textAlign: "center" }}>{ok}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("var(--warn)", "var(--bg)"), height: 46, fontSize: 15, opacity: loading ? .6 : 1 }}>
            {loading ? "Enviando..." : "ENVIAR ENLACE"}
          </button>
          <LinkBtn onClick={() => { reset(); setPage("login"); }}>← Volver al login</LinkBtn>
        </form>
      </div>
    </div>
  );

  // ── Render Registro ────────────────────────────────────────────────────────
  if (page === "register") return (
    <div style={authBg}>
      <div className="fade-in" style={authCard}>
        <AuthLogo />
        <div style={{ fontSize: 13, color: "var(--sub)", textAlign: "center", marginBottom: 20 }}>Crear nueva cuenta</div>
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="NOMBRE COMPLETO" value={nombre} onChange={setNombre} placeholder="Tu nombre" />
          <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={setEmail} placeholder="usuario@empresa.com" />
          <Field label="CONTRASEÑA" value={pass} onChange={setPass} placeholder="Mínimo 6 caracteres" showToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
          <Field label="CONFIRMAR CONTRASEÑA" value={pass2} onChange={setPass2} placeholder="Repite la contraseña" showToggle show={showPw2} onToggle={() => setShowPw2(v => !v)} />
          {err && <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center" }}>{err}</div>}
          {ok  && <div style={{ color: "var(--success)", fontSize: 12, textAlign: "center" }}>{ok}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("var(--success)", "var(--bg)"), marginTop: 8, height: 46, fontSize: 15, opacity: loading ? .6 : 1 }}>
            {loading ? "Creando cuenta..." : "CREAR CUENTA"}
          </button>
          <LinkBtn onClick={() => { reset(); setPage("login"); }}>← Volver al login</LinkBtn>
        </form>
      </div>
    </div>
  );

  // ── Render Verificar OTP ───────────────────────────────────────────────────
  if (page === "verify") return (
    <div style={authBg}>
      <div className="fade-in" style={authCard}>
        <AuthLogo />
        <div style={{ fontSize: 13, color: "var(--sub)", textAlign: "center", marginBottom: 6 }}>Verifica tu correo</div>
        <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", marginBottom: 20, fontFamily: "var(--mono)" }}>{pendingEmail}</div>
        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="CÓDIGO DE VERIFICACIÓN (6 dígitos)" type="number" value={otp} onChange={setOtp} placeholder="123456" />
          {err && <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center" }}>{err}</div>}
          {ok  && <div style={{ color: "var(--success)", fontSize: 12, textAlign: "center" }}>{ok}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn(), height: 46, fontSize: 15, opacity: loading ? .6 : 1 }}>
            {loading ? "Verificando..." : "VERIFICAR CÓDIGO"}
          </button>
          <LinkBtn onClick={reenviarOtp}>Reenviar código</LinkBtn>
          <LinkBtn onClick={() => { reset(); setPage("login"); }}>← Volver al login</LinkBtn>
        </form>
      </div>
    </div>
  );
}


// ─── MODAL EDITAR HILO ────────────────────────────────────────────────────────
function EditHiloModal({ registro, onClose, onSaved }) {
  const [val, setVal]     = useState(registro.Numero_Hilo != null ? String(registro.Numero_Hilo) : "");
  const [err, setErr]     = useState("");
  const [ok, setOk]       = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    const n = parseInt(val.trim());
    if (isNaN(n)) { setErr("Ingresa un número entero válido."); return; }
    setSaving(true); setErr(""); setOk("");
    try {
      const { data, error } = await supabase.from("estado_actual")
        .update({ Numero_Hilo: n })
        .eq("n_registro", registro.n_registro)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        setErr("No se actualizó ninguna fila. Verifica políticas RLS."); setSaving(false); return;
      }
      // También actualizar historial
      await supabase.from("historial_reportes")
        .update({ Numero_Hilo: n })
        .eq("n_registro", registro.n_registro);

      setOk(`✔ Guardado: Hilo ${n}`);
      setTimeout(() => { onSaved(registro.n_registro, n); onClose(); }, 900);
    } catch (e) {
      setErr(e.message || "Error al guardar.");
    } finally { setSaving(false); }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontFamily: "var(--mono)", color: "var(--warn)", fontSize: 18, marginBottom: 6, textAlign: "center" }}>
          ✏ NÚMERO DE HILO
        </div>
        <div style={{ color: "var(--sub)", fontSize: 12, textAlign: "center", marginBottom: 20 }}>
          Registro #{registro.n_registro} — {registro.ruta_nombre}
        </div>
        <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: 1, display: "block", marginBottom: 6 }}>
          NÚMERO DE HILO (entero)
        </label>
        <input style={{ ...S.input, borderColor: "var(--warn)", marginBottom: 10 }}
          type="number" value={val} onChange={e => setVal(e.target.value)}
          placeholder="Ej: 12" autoFocus />
        {err && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        {ok  && <div style={{ color: "var(--success)", fontSize: 12, marginBottom: 8 }}>{ok}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button style={{ ...S.btn("var(--warn)"), flex: 1 }} onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "💾 GUARDAR"}
          </button>
          <button style={{ ...S.btn("transparent", "var(--sub)"), border: "1px solid var(--border)" }}
            onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook: Notificaciones (Capacitor + Web fallback) ─────────────────────────
function useNotificaciones() {
  const [permiso, setPermiso] = useState("default");
  const localNotif = useRef(null);
  const esNativo   = useRef(false);

  // ── Cargar plugin y pedir permiso automáticamente al iniciar ────────────────
  useEffect(() => {
    const isNative =
      typeof window !== "undefined" &&
      window.Capacitor?.isNativePlatform?.() === true;
    esNativo.current = isNative;

    if (isNative) {
      import("@capacitor/local-notifications")
        .then(async ({ LocalNotifications }) => {
          localNotif.current = LocalNotifications;

          // 1. Verificar permiso actual
          const check = await LocalNotifications.checkPermissions();

          if (check.display === "granted") {
            setPermiso("granted");
          } else if (check.display === "denied") {
            setPermiso("denied");
          } else {
            // 2. Pedir permiso automáticamente (muestra el diálogo del sistema)
            const req = await LocalNotifications.requestPermissions();
            setPermiso(req.display === "granted" ? "granted" : "denied");
          }
        })
        .catch(() => {
          // Si falla la importación asumir granted (modo debug)
          setPermiso("granted");
        });
    } else {
      // Web
      if (typeof Notification !== "undefined") {
        setPermiso(Notification.permission);
      }
    }
  }, []);

  // ── Pedir permiso manualmente (botón en UI) ─────────────────────────────────
  async function pedirPermiso() {
    if (esNativo.current) {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        localNotif.current = LocalNotifications;
        const res = await LocalNotifications.requestPermissions();
        setPermiso(res.display === "granted" ? "granted" : "denied");
      } catch (e) {
        console.warn("Error pidiendo permiso nativo:", e);
      }
    } else if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      setPermiso(result);
    }
  }

  // ── Disparar notificación ───────────────────────────────────────────────────
  function notificar(titulo, cuerpo) {
    if (esNativo.current) {
      const disparar = (plugin) => {
        plugin.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 999999),
            title: titulo,
            body: cuerpo,
            sound: "default",
            smallIcon: "ic_launcher",
            iconColor: "#FF3D3D",
            vibrate: true,
          }]
        }).catch(e => console.warn("Schedule error:", e));
      };

      if (localNotif.current) {
        disparar(localNotif.current);
      } else {
        import("@capacitor/local-notifications")
          .then(({ LocalNotifications }) => {
            localNotif.current = LocalNotifications;
            disparar(LocalNotifications);
          })
          .catch(e => console.warn("Import error:", e));
      }
    } else {
      // Web fallback
      if (permiso !== "granted") return;
      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
              reg.showNotification(titulo, {
                body: cuerpo, icon: "/logo.ico",
                tag: titulo, renotify: true,
                requireInteraction: true, vibrate: [300, 100, 300],
              });
            } else {
              new Notification(titulo, { body: cuerpo });
            }
          }).catch(() => new Notification(titulo, { body: cuerpo }));
        } else {
          new Notification(titulo, { body: cuerpo });
        }
      } catch (e) { console.warn("Notif web error:", e); }
    }
  }

  function notificarCaida(rutas) {
    notificar(
      "🔴 ALERTA NOC — CAÍDA",
      `${rutas.length} caída${rutas.length > 1 ? "s" : ""} activa${rutas.length > 1 ? "s" : ""}:\n${rutas.join("\n")}`
    );
  }

  function notificarRecuperado(rutas) {
    notificar(
      "✅ NOC — TRAMO RECUPERADO",
      `Restaurado:\n${rutas.join("\n")}`
    );
  }

  return { permiso, pedirPermiso, notificarCaida, notificarRecuperado, esNativo };
}

// ─── TAB: MONITOREO EN VIVO ───────────────────────────────────────────────────
function TabMonitoreo({ esAdmin }) {
  const [filas, setFilas]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [editReg, setEditReg]   = useState(null);
  const hiloCache               = useRef({});
  const prevData                = useRef(new Map()); // n_registro → ruta_nombre
  const primeraVez              = useRef(true);      // no notificar en carga inicial

  const { permiso, pedirPermiso, notificarCaida, notificarRecuperado, esNativo } = useNotificaciones();
  // En APK nativa el permiso se pide automáticamente al abrir, mostrar como activo si no está denegado
  const permisoMostrado = (esNativo?.current && permiso !== "denied") ? "granted" : permiso;

  const cargar = useCallback(async () => {
    try {
      const { data } = await supabase.from("estado_actual")
        .select("*").eq("estado_actual", "DOWN");
      if (data) {
        data.forEach(f => {
          if (f.Numero_Hilo != null) hiloCache.current[f.n_registro] = f.Numero_Hilo;
        });

        const ahoraMap = new Map(data.map(f => [f.n_registro, f.ruta_nombre]));
        const antesMap = prevData.current;

        if (!primeraVez.current) {
          // Caídas nuevas
          const nuevas = data.filter(f => !antesMap.has(f.n_registro));
          if (nuevas.length > 0) {
            notificarCaida(nuevas.map(f => f.ruta_nombre));
          }
          // Tramos recuperados
          const recuperados = [...antesMap.entries()]
            .filter(([id]) => !ahoraMap.has(id))
            .map(([, nombre]) => nombre);
          if (recuperados.length > 0) {
            notificarRecuperado(recuperados);
          }
        }

        primeraVez.current = false;
        prevData.current   = ahoraMap;
        setFilas(data);
        setLastSync(new Date());
      }
    } finally { setLoading(false); }
  }, [notificarCaida, notificarRecuperado]);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 10000);
    return () => clearInterval(iv);
  }, [cargar]);

  function onHiloSaved(n_registro, valor) {
    hiloCache.current[n_registro] = valor;
    setFilas(prev => prev.map(f => f.n_registro === n_registro ? { ...f, Numero_Hilo: valor } : f));
  }

  const count = filas.length;

  return (
    <div className="fade-in">
      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={S.statCard(count > 0 ? "var(--danger)" : "var(--success)")}>
          <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: 1, marginBottom: 4 }}>
            CAÍDAS ACTIVAS
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: count > 0 ? "var(--danger)" : "var(--success)", lineHeight: 1 }}>
            {count}
          </div>
        </div>
        <div style={{ ...S.statCard("var(--accent)"), display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: 1, marginBottom: 6 }}>
            ESTADO
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <LiveDot color={count > 0 ? "var(--danger)" : "var(--success)"} />
            <span style={{ fontSize: 13, color: count > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
              {count > 0 ? "ALERTA" : "NORMAL"}
            </span>
          </div>
        </div>
        <div style={{ ...S.statCard("var(--sub)"), display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: 1, marginBottom: 4 }}>
            ÚLTIMA SYNC
          </div>
          <div style={{ fontSize: 13, color: "var(--text)" }}>
            {lastSync ? lastSync.toLocaleTimeString("es-HN") : "—"}
          </div>
        </div>

        {/* Botón de notificaciones */}
        <div style={{ ...S.statCard(permisoMostrado === "granted" ? "var(--success)" : "var(--warn)"),
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: 1 }}>
            NOTIFICACIONES
          </div>
          {permisoMostrado === "granted" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LiveDot color="var(--success)" />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>ACTIVAS</span>
            </div>
          ) : permisoMostrado === "denied" ? (
            <div style={{ fontSize: 11, color: "var(--danger)", textAlign: "center" }}>
              🚫 Bloqueadas<br/>
              <button style={{ ...S.btnSm("var(--warn)"), marginTop: 6, fontSize: 10 }}
                onClick={pedirPermiso}>
                🔔 Reintentar
              </button>
            </div>
          ) : (
            <button style={{ ...S.btnSm("var(--warn)"), padding: "7px 14px" }}
              onClick={pedirPermiso}>
              🔔 Activar alertas
            </button>
          )}
        </div>
      </div>

      {esAdmin && (
        <div style={{ marginBottom: 10, fontSize: 12, color: "var(--warn)" }}>
          💡 Toca una fila para editar el Número de Hilo
        </div>
      )}
      {!esAdmin && (
        <div style={{ marginBottom: 10, fontSize: 12, color: "var(--sub)" }}>
          🔒 Modo lectura — no tienes permisos para editar
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--sub)" }}>Cargando...</div>
      ) : filas.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ color: "var(--success)", fontWeight: 600 }}>Sin caídas activas</div>
          <div style={{ color: "var(--sub)", fontSize: 12, marginTop: 4 }}>Todos los tramos operando normalmente</div>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["ID", "Ruta / Tramo", "Nivel", "Desde", "Tiempo en curso", "Nº Hilo"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
                {esAdmin && <th style={S.th}>ACCIÓN</th>}
              </tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const hilo = hiloCache.current[f.n_registro] ?? f.Numero_Hilo;
                return (
                  <tr key={f.n_registro}
                    onClick={esAdmin ? () => setEditReg(f) : undefined}
                    style={{ cursor: esAdmin ? "pointer" : "default" }}
                    onMouseEnter={e => esAdmin && (e.currentTarget.style.background = "rgba(0,194,224,.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={S.td(true)}>
                      <span style={{ fontFamily: "var(--mono)", color: "var(--danger)" }}>#{f.n_registro}</span>
                    </td>
                    <td style={{ ...S.td(true), textAlign: "left", fontWeight: 600 }}>{f.ruta_nombre}</td>
                    <td style={S.td(true)}>
                      <span style={S.badge("var(--danger)")}>{String(f.nivel_caido).replace(/\s*dBm/i,"").trim()} dBm</span>
                    </td>
                    <td style={{ ...S.td(true), fontFamily: "var(--mono)", fontSize: 11 }}>
                      {fmtFecha(f.fecha_inicio_caida)}
                    </td>
                    <td style={{ ...S.td(true), color: "var(--warn)", fontFamily: "var(--mono)", fontSize: 12 }}>
                      {f.tiempo_caida_texto || "—"}
                    </td>
                    <td style={S.td(true)}>
                      {hilo != null
                        ? <span style={S.badge("var(--accent)")}>{hilo}</span>
                        : <span style={{ color: "var(--sub)" }}>—</span>}
                    </td>
                    {esAdmin && (
                      <td style={S.td(true)}>
                        <button style={S.btnSm("var(--warn)")} onClick={e => { e.stopPropagation(); setEditReg(f); }}>
                          ✏ Editar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editReg && (
        <EditHiloModal registro={editReg} onClose={() => setEditReg(null)} onSaved={onHiloSaved} />
      )}
    </div>
  );
}

// ─── TAB: HISTORIAL ───────────────────────────────────────────────────────────
function TabHistorial() {
  const [filas, setFilas]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [ruta, setRuta]       = useState("");
  const [desde, setDesde]     = useState("");
  const [hasta, setHasta]     = useState("");

  async function cargar() {
    setLoading(true);
    try {
      let q = supabase.from("historial_reportes").select("*");
      if (ruta)  q = q.ilike("ruta_nombre", `%${ruta}%`);
      if (desde) q = q.gte("fecha_caida", desde);
      if (hasta) q = q.lte("fecha_caida", `${hasta} 23:59:59`);
      const { data } = await q.order("fecha_levanta", { ascending: false }).limit(200);
      setFilas(data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  function exportCSV() {
    if (!filas.length) return;
    const cols = ["ID", "Ruta", "Nivel Previo", "Nivel Recuperado", "Inicio", "Fin", "Duración", "Nº Hilo"];
    const rows = filas.map(f => [
      f.n_registro, f.ruta_nombre,
      f.nivel_previo  ?? "—",
      f.nivel_recuperado ?? "—",
      fmtFecha(f.fecha_caida), fmtFecha(f.fecha_levanta), f.duracion,
      f.Numero_Hilo ?? "—"
    ]);
    const csv = [cols, ...rows].map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `Reporte_NOC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="fade-in">
      {/* Filtros */}
      <div style={{ ...S.card, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 4 }}>RUTA</label>
          <input style={S.input} placeholder="Buscar ruta..." value={ruta} onChange={e => setRuta(e.target.value)} />
        </div>
        <div style={{ flex: "1 1 130px" }}>
          <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 4 }}>DESDE</label>
          <input style={S.input} type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div style={{ flex: "1 1 130px" }}>
          <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 4 }}>HASTA</label>
          <input style={S.input} type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <button style={S.btn()} onClick={cargar}>🔍 Filtrar</button>
        <button style={S.btn("var(--panel2)", "var(--sub)")} onClick={exportCSV}>⬇ CSV</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--sub)" }}>Cargando...</div>
      ) : filas.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40, color: "var(--sub)" }}>
          Sin registros para los filtros seleccionados
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["ID", "Ruta", "Niv. Previo", "Niv. Recuperado", "Inicio", "Fin", "Duración", "Nº Hilo"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={S.td()}><span style={{ fontFamily: "var(--mono)", color: "var(--sub)" }}>#{f.n_registro}</span></td>
                  <td style={{ ...S.td(), textAlign: "left" }}>{f.ruta_nombre}</td>
                  <td style={S.td()}>
                    {f.nivel_previo != null
                      ? <span style={S.badge("var(--danger)")}>{String(f.nivel_previo).replace(/\s*dBm/i,"").trim()} dBm</span>
                      : <span style={{ color: "var(--sub)" }}>—</span>}
                  </td>
                  <td style={S.td()}>
                    {f.nivel_recuperado != null
                      ? <span style={S.badge("var(--success)")}>{String(f.nivel_recuperado).replace(/\s*dBm/i,"").trim()} dBm</span>
                      : <span style={{ color: "var(--sub)" }}>—</span>}
                  </td>
                  <td style={{ ...S.td(), fontFamily: "var(--mono)", fontSize: 11 }}>{fmtFecha(f.fecha_caida)}</td>
                  <td style={{ ...S.td(), fontFamily: "var(--mono)", fontSize: 11 }}>{fmtFecha(f.fecha_levanta)}</td>
                  <td style={{ ...S.td(), color: "var(--accent)", fontFamily: "var(--mono)" }}>{f.duracion || "—"}</td>
                  <td style={S.td()}>
                    {f.Numero_Hilo != null
                      ? <span style={S.badge("var(--accent)")}>{f.Numero_Hilo}</span>
                      : <span style={{ color: "var(--sub)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TAB: USUARIOS (solo admin) ───────────────────────────────────────────────
function TabUsuarios({ currentUserId }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", ok: true });

  async function cargar() {
    setLoading(true);
    const { data } = await supabase.from("usuarios").select("*").order("creado_en", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarRol(uid, email, nuevoRol) {
    if (uid === currentUserId && nuevoRol !== "admin") {
      setStatus({ msg: "⚠ No puedes quitarte el rol admin a ti mismo.", ok: false }); return;
    }
    const { error } = await supabase.from("usuarios").update({ rol: nuevoRol }).eq("id", uid);
    if (error) { setStatus({ msg: `Error: ${error.message}`, ok: false }); return; }
    setStatus({ msg: `✔ Rol de ${email} actualizado a '${nuevoRol}'`, ok: true });
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, rol: nuevoRol } : u));
    setTimeout(() => setStatus({ msg: "", ok: true }), 3000);
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: 16, letterSpacing: 2 }}>
          👥 GESTIÓN DE USUARIOS
        </h2>
        <button style={S.btn()} onClick={cargar}>🔄 Recargar</button>
      </div>

      {status.msg && (
        <div style={{ ...S.card, background: status.ok ? "rgba(0,230,118,.08)" : "rgba(255,61,61,.08)",
          borderColor: status.ok ? "var(--success)" : "var(--danger)",
          color: status.ok ? "var(--success)" : "var(--danger)", marginBottom: 12, padding: "10px 16px" }}>
          {status.msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--sub)" }}>Cargando usuarios...</div>
      ) : (
        <>
          {/* Vista desktop: tabla */}
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Nombre", "Email", "Rol actual", "Registrado", "Cambiar rol"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={S.td()}>{u.nombre || "—"}</td>
                    <td style={{ ...S.td(), fontFamily: "var(--mono)", fontSize: 12 }}>{u.email}</td>
                    <td style={S.td()}>
                      <span style={S.badge(u.rol === "admin" ? "var(--warn)" : "var(--sub)")}>
                        {u.rol === "admin" ? "Admin" : "Lectura"}
                      </span>
                    </td>
                    <td style={{ ...S.td(), fontFamily: "var(--mono)", fontSize: 11 }}>{fmtFecha(u.creado_en)}</td>
                    <td style={S.td()}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          disabled={u.rol === "admin"}
                          onClick={() => cambiarRol(u.id, u.email, "admin")}
                          style={{
                            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                            fontFamily: "var(--sans)", cursor: u.rol === "admin" ? "default" : "pointer",
                            border: "1px solid var(--warn)",
                            background: u.rol === "admin" ? "var(--warn)" : "transparent",
                            color: u.rol === "admin" ? "var(--bg)" : "var(--warn)",
                            opacity: 1,
                          }}>
                          Admin
                        </button>
                        <button
                          disabled={u.rol === "lectura"}
                          onClick={() => cambiarRol(u.id, u.email, "lectura")}
                          style={{
                            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                            fontFamily: "var(--sans)", cursor: u.rol === "lectura" ? "default" : "pointer",
                            border: "1px solid var(--accent)",
                            background: u.rol === "lectura" ? "var(--accent)" : "transparent",
                            color: u.rol === "lectura" ? "var(--bg)" : "var(--accent)",
                            opacity: 1,
                          }}>
                          Lectura
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
// ─── PÁGINA: NUEVA CONTRASEÑA (después de clic en enlace del correo) ──────────
function NuevaContrasenaPage({ onDone }) {
  const [pass, setPass]   = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow]   = useState(false);
  const [show2, setShow2] = useState(false);
  const [err, setErr]     = useState("");
  const [ok, setOk]       = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pass || !pass2)  { setErr("Completa ambos campos."); return; }
    if (pass !== pass2)   { setErr("Las contraseñas no coinciden."); return; }
    if (pass.length < 6)  { setErr("Mínimo 6 caracteres."); return; }
    setLoading(true); setErr("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setOk("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(onDone, 1800);
    } catch (e) {
      setErr(e.message || "Error al actualizar.");
    } finally { setLoading(false); }
  }

  return (
    <div style={authBg}>
      <div className="fade-in" style={authCard}>
        <AuthLogo />
        <div style={{ fontSize: 13, color: "var(--sub)", textAlign: "center", marginBottom: 20 }}>
          Crea tu nueva contraseña
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="NUEVA CONTRASEÑA" value={pass} onChange={setPass}
            placeholder="Mínimo 6 caracteres" showToggle show={show} onToggle={() => setShow(v => !v)} />
          <Field label="CONFIRMAR CONTRASEÑA" value={pass2} onChange={setPass2}
            placeholder="Repite la contraseña" showToggle show={show2} onToggle={() => setShow2(v => !v)} />
          {err && <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center" }}>{err}</div>}
          {ok  && <div style={{ color: "var(--success)", fontSize: 12, textAlign: "center" }}>{ok}</div>}
          <button type="submit" disabled={loading} style={{
            ...S.btn("var(--warn)", "var(--bg)"), height: 46, fontSize: 15, opacity: loading ? .6 : 1
          }}>
            {loading ? "Guardando..." : "GUARDAR CONTRASEÑA"}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { id: "monitoreo", label: "📡 Monitoreo", icon: "📡" },
  { id: "historial", label: "📋 Historial", icon: "📋" },
];
const TABS_ADMIN = [
  ...TABS,
  { id: "usuarios", label: "👥 Usuarios", icon: "👥" },
];

export default function App() {
  const [user, setUser]             = useState(null);
  const [session, setSession]       = useState(null);
  const [rol, setRol]               = useState("lectura");
  const [tab, setTab]               = useState("monitoreo");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [resetMode, setResetMode]   = useState(false); // true cuando viene del enlace de correo
  const [showApk, setShowApk]       = useState(false);
  const esAppNativa = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

  useEffect(() => {
    injectCSS(GLOBAL_CSS);

    // Detectar sesión existente
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: uData } = await supabase.from("usuarios")
          .select("rol").eq("id", data.session.user.id).single();
        setUser(data.session.user);
        setSession(data.session);
        setRol(uData?.rol || "lectura");
      }
    });

    // Escuchar evento PASSWORD_RECOVERY (cuando el usuario viene del enlace del correo)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetMode(true);
        setUser(session?.user || null);
        setSession(session);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  function handleLogin(u, s, r) { setUser(u); setSession(s); setRol(r); }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setRol("lectura"); setResetMode(false);
  }

  // Mostrar página de nueva contraseña si viene del enlace del correo
  if (resetMode) return (
    <NuevaContrasenaPage onDone={() => {
      setResetMode(false);
      setUser(null);
      setSession(null);
    }} />
  );

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const esAdmin = rol === "admin";
  const tabs    = esAdmin ? TABS_ADMIN : TABS;
  const userName = user.user_metadata?.full_name || user.email;

  return (
    <div style={S.app}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Hamburger mobile */}
          <button onClick={() => setMobileMenu(v => !v)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--accent)", fontSize: 20, display: "none",
          }} className="hamburger">☰</button>
          <div>
            <div style={S.topbarTitle}>NOC VISOR</div>
            <div style={S.topbarSub}>DWDM MONITORING</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LiveDot color="var(--success)" />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text)" }}>{userName}</div>
            <span style={S.badge(esAdmin ? "var(--warn)" : "var(--sub)")}>
              {esAdmin ? "⚙ Admin" : "👁 Lectura"}
            </span>
          </div>
          <button style={{ ...S.btn("var(--danger)", "white"), padding: "6px 14px", fontSize: 12 }}
            onClick={handleLogout}>Salir</button>
        </div>
      </div>

      <div style={S.main}>
        {/* Sidebar */}
        <div style={{
          ...S.sidebar,
          transform: mobileMenu ? "translateX(0)" : undefined,
        }}>
          <div style={{ padding: "20px 0" }}>
            {tabs.map(t => (
              <div key={t.id} style={S.navItem(tab === t.id)}
                onClick={() => { setTab(t.id); setMobileMenu(false); }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span>{t.label.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>

          {/* Bottom info */}
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.8 }}>
              <div>SISTEMA DWDM</div>
              <div>{esAppNativa ? "v2.0 — Android App" : "v2.0 — Web App"}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={S.content}>
          {/* Mobile bottom nav */}
          <div style={{
            display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--panel)", borderTop: "1px solid var(--border)",
            zIndex: 200,
          }} className="mobile-nav">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "10px 0", background: "none",
                border: "none", cursor: "pointer",
                color: tab === t.id ? "var(--accent)" : "var(--sub)",
                fontSize: 11, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span>{t.label.split(" ").slice(1).join(" ")}</span>
              </button>
            ))}
            {/* Botón APK solo en navegador web */}
            {!esAppNativa && (
              <button onClick={() => setShowApk(true)} style={{
                flex: 1, padding: "10px 0", background: "none",
                border: "none", cursor: "pointer",
                color: "var(--accent)",
                fontSize: 11, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
              }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <span>App</span>
              </button>
            )}
          </div>

          {tab === "monitoreo" && <TabMonitoreo esAdmin={esAdmin} />}
          {tab === "historial" && <TabHistorial />}
          {tab === "usuarios"  && esAdmin && <TabUsuarios currentUserId={user.id} />}
        </div>
      </div>

      {/* Modal APK */}
      {showApk && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(4px)", padding: 16,
        }} onClick={e => e.target === e.currentTarget && setShowApk(false)}>
          <div style={{
            background: "var(--panel)", border: "1px solid #00C2E033",
            borderRadius: 16, width: "min(460px, 100%)",
            overflow: "hidden", animation: "fadeIn .25s ease",
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #0E1220, #141828)",
              borderBottom: "1px solid var(--border)",
              padding: "24px 24px 18px", position: "relative",
            }}>
              <button onClick={() => setShowApk(false)} style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,.06)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--sub)", cursor: "pointer",
                width: 28, height: 28, fontSize: 14,
              }}>✕</button>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: "var(--accent)", letterSpacing: 2 }}>
                NOC VISOR — Android
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sub)", letterSpacing: 2, marginTop: 4 }}>
                APP NATIVA CON NOTIFICACIONES PUSH
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px" }}>
              {/* Features */}
              {[
                { icon: "🔔", text: "Alertas instantáneas aunque la app esté cerrada" },
                { icon: "📡", text: "Monitoreo en segundo plano automático" },
                { icon: "🔴", text: "Vibración y sonido en caídas críticas" },
                { icon: "⚡", text: "Ícono directo en tu pantalla de inicio" },
              ].map(f => (
                <div key={f.text} style={{
                  display: "flex", gap: 10, alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{f.text}</span>
                </div>
              ))}

              {/* Warning */}
              <div style={{
                background: "rgba(240,165,0,.06)", border: "1px solid rgba(240,165,0,.2)",
                borderRadius: 8, padding: "10px 12px", margin: "16px 0",
                fontSize: 11, color: "#F0A500", lineHeight: 1.6,
              }}>
                ⚠ En Android ve a <strong>Configuración → Seguridad → Instalar apps desconocidas</strong> y permite la instalación.
              </div>

              {/* Info pills */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[["VERSION","2.0"],["TAMAÑO","~18 MB"],["ANDROID","7.0+"]].map(([l,v]) => (
                  <div key={l} style={{
                    flex: "1 1 80px", background: "var(--panel2)",
                    border: "1px solid var(--border)", borderRadius: 8,
                    padding: "8px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Download button */}
              <a
                href="https://uazaihdhpderwqmhglni.supabase.co/storage/v1/object/public/apk/noc-visor.apk"
                download="noc-visor.apk"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  width: "100%", height: 52, borderRadius: 10,
                  background: "linear-gradient(135deg, #00C2E0, #0090A8)",
                  color: "#080B12", fontSize: 15, fontWeight: 700,
                  fontFamily: "var(--sans)", letterSpacing: 1,
                  textDecoration: "none", boxShadow: "0 4px 20px #00C2E033",
                }}
              >
                ⬇ DESCARGAR APK
              </a>

              <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)" }}>
                noc-visor.apk · Solo Android · Uso interno NOC DWDM
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS responsive inyectado */}
      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
          .mobile-nav { display: flex !important; }
          [style*="width: 220px"] { 
            position: fixed; top: 54px; left: 0; bottom: 0;
            z-index: 300; transform: translateX(-100%);
            transition: transform .3s;
          }
        }
      `}</style>
    </div>
  );
}
