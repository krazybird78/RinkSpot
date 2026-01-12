'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { playSound } from '@/lib/sounds';
import Image from 'next/image';
import { ArrowLeft, Mail, Lock, User, Check, AlertCircle } from 'lucide-react';

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                // Sign up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: displayName,
                        },
                    },
                });

                if (signUpError) throw signUpError;

                playSound('goal-horn');
                alert('Check your email to confirm your account!');
            } else {
                // Sign in
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                playSound('goal-horn');
                window.location.href = '/';
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        }
    };

    return (
        <main className="min-h-screen bg-rink-blue flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-rink-blue via-puck-black/50 to-rink-blue pointer-events-none" />

            {/* Animated Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-ice-white/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-vegas-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-puck-black/80 backdrop-blur-xl border border-ice-white/10 rounded-3xl shadow-2xl overflow-hidden p-8">

                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-4 hover:scale-105 transition-transform duration-300 select-none cursor-default">
                            <span className="text-ice-white drop-shadow-lg">RINK</span>
                            <span className="text-[#A5F2F3] drop-shadow-lg">SPOT</span>
                        </h1>

                        <h2 className="text-lg font-bold italic uppercase tracking-wider text-ice-white/90 mb-2">
                            {isSignUp ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}
                        </h2>
                        <p className="text-ice-white/50 text-xs font-medium tracking-wide">
                            {isSignUp ? 'Create your user profile' : 'Sign in to access your profile'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-xs text-red-500 font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ice-white/60 tracking-wider uppercase ml-1">Display Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ice-white/40 group-focus-within:text-vegas-gold transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-ice-white/5 border border-ice-white/10 text-ice-white text-sm rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-vegas-gold/50 focus:bg-ice-white/10 transition-all placeholder:text-ice-white/20"
                                        placeholder="Display Name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ice-white/60 tracking-wider uppercase ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ice-white/40 group-focus-within:text-vegas-gold transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-ice-white/5 border border-ice-white/10 text-ice-white text-sm rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-vegas-gold/50 focus:bg-ice-white/10 transition-all placeholder:text-ice-white/20"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ice-white/60 tracking-wider uppercase ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ice-white/40 group-focus-within:text-vegas-gold transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-ice-white/5 border border-ice-white/10 text-ice-white text-sm rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-vegas-gold/50 focus:bg-ice-white/10 transition-all placeholder:text-ice-white/20"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-vegas-gold hover:bg-vegas-gold/90 text-puck-black font-black text-sm py-4 rounded-xl shadow-lg shadow-vegas-gold/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">LOADING...</span>
                            ) : (
                                <>
                                    {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-ice-white/10"></div>
                        <span className="text-xs text-ice-white/40 font-bold tracking-widest uppercase">OR CONTINUE WITH</span>
                        <div className="flex-1 h-px bg-ice-white/10"></div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-ice-white/5 hover:bg-ice-white/10 border border-ice-white/10 text-ice-white font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>

                    <div className="mt-8 text-center pt-6 border-t border-ice-white/5">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                playSound('menu-beep');
                            }}
                            className="text-vegas-gold hover:text-vegas-gold/80 text-xs font-bold tracking-wide transition-colors hover:underline"
                        >
                            {isSignUp ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' : "DON'T HAVE AN ACCOUNT? JOIN FREE"}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-ice-white/40 hover:text-ice-white text-xs font-bold tracking-widest uppercase transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Map
                    </a>
                </div>
            </div>
        </main>
    );
}
