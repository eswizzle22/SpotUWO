import { useState } from 'react';
import { isWesternEmail, makeDisplayName, ALLOWED_DOMAINS } from '../types';
import logo from "../assets/logo.png";

interface AuthPageProps {
    onSignUp: (email: string, password: string, displayName: string) => string | null;
    onSignIn: (email: string, password: string) => string | null;
}

type AuthMode = 'login' | 'signup';

export default function AuthPage({ onSignUp, onSignIn }: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-fill display name from email
    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (mode === 'signup' && val.includes('@') && isWesternEmail(val)) {
            setDisplayName(makeDisplayName(val));
        }
    };

    const validate = (): string | null => {
        if (!email.trim()) return 'Please enter your email.';
        if (!isWesternEmail(email))
            return `Only Western emails are allowed (${ALLOWED_DOMAINS.map((d) => `@${d}`).join(', ')}).`;
        if (!password) return 'Please enter a password.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (mode === 'signup') {
            if (password !== confirmPassword) return 'Passwords do not match.';
            if (!displayName.trim()) return 'Please enter your name.';
        }
        return null;
    };

    const handleSubmit = () => {
        setError('');
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        setTimeout(() => { // slight delay for UX feel
            const err =
                mode === 'signup'
                    ? onSignUp(email.toLowerCase().trim(), password, displayName.trim())
                    : onSignIn(email.toLowerCase().trim(), password);

            if (err) setError(err);
            setLoading(false);
        }, 400);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

return (
  <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
    {/* Logo */}
    <div className="mb-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-lg">
        <img
          src={logo}
          alt="Spot@UWO logo"
        />
      </div>

      <h1 className="text-3xl font-bold text-violet-900">
        Spot<span className="text-violet-500">@UWO</span>
      </h1>

      <p className="text-sm text-gray-500 mt-1">
        Find your perfect study space at Western
      </p>
    </div>

    {/* Card */}
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-violet-100 p-8">
                {/* Tab switcher */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                    {(['login', 'signup'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === m
                                    ? 'bg-white text-violet-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {m === 'login' ? 'Log In' : 'Create Account'}
                        </button>
                    ))}
                </div>

                <div className="space-y-4" onKeyDown={handleKeyDown}>
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                            Western Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="yourname@uwo.ca"
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            Only @uwo.ca and @ivey.ca addresses accepted
                        </p>
                    </div>

                    {/* Display name (signup only) */}
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Jane Smith"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>

                    {/* Confirm password (signup only) */}
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60 shadow-md mt-2"
                    >
                        {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
                    Your Western email is used to reduce spam and keep reports trustworthy.
                    We don't share your information.
                </p>
            </div>

            <p className="text-xs text-gray-400 mt-6">Spot@UWO · Made for Western students</p>
        </div>
    );
}