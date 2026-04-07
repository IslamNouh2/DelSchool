'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useLocale } from 'next-intl';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const locale = useLocale();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/auth/me');
                const role = res.data?.role?.toLowerCase();
                if (role && window.location.pathname === '/login') {
                    router.replace(`/${locale}/${role}`);
                }
            } catch { }
        };
        checkAuth();
    }, [router, locale]);

    const [form, setForm] = useState({
        emailOrUsername: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        if (isLoading) return;
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/auth/login', {
                username: form.emailOrUsername,
                password: form.password,
            });

            const { user, accessToken } = res.data;

            if (accessToken) {
                Cookies.set('accessToken', accessToken, {
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    expires: 1,
                });
            }

            localStorage.setItem('user_role', user.role.toLowerCase());

            setIsSuccess(true);
            setTimeout(() => {
                window.location.href = `/${locale}/${user.role.toLowerCase()}`;
            }, 1200);

        } catch (err: any) {
            setIsLoading(false);
            if (err.response?.status === 401) {
                setError('Invalid credentials');
            } else {
                setError('Login failed');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <>
            <style>{`
                @keyframes spinRing {
                    to { transform: rotate(360deg); }
                }
                @keyframes dash {
                    0%   { stroke-dashoffset: 200; }
                    50%  { stroke-dashoffset: 50; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes checkDraw {
                    from { stroke-dashoffset: 60; }
                    to   { stroke-dashoffset: 0; }
                }
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.7); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
                @keyframes ripple {
                    0%   { transform: scale(0); opacity: 0.6; }
                    100% { transform: scale(4); opacity: 0; }
                }
                @keyframes fadeUp {
                    from { transform: translateY(6px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse-ring {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
                    50%      { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
                }

                .login-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(11,18,32,0.92);
                    backdrop-filter: blur(12px);
                    animation: overlayIn 0.3s ease forwards;
                }
                .loader-ring {
                    width: 80px;
                    height: 80px;
                    animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
                }
                .spinner-svg {
                    animation: spinRing 1s linear infinite;
                }
                .spinner-circle {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 50;
                    stroke-linecap: round;
                    animation: dash 1.2s ease-in-out infinite;
                }
                .check-svg {
                    animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
                }
                .check-path {
                    stroke-dasharray: 60;
                    stroke-dashoffset: 60;
                    animation: checkDraw 0.5s ease forwards 0.1s;
                }
                .loader-label {
                    margin-top: 20px;
                    font-size: 14px;
                    letter-spacing: 0.08em;
                    color: rgba(255,255,255,0.5);
                    animation: fadeUp 0.4s ease 0.2s both;
                }
                .ripple-dot {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(99,102,241,0.3);
                    animation: ripple 1.4s ease-out infinite;
                }
                .ripple-dot:nth-child(2) {
                    animation-delay: 0.5s;
                }

                .btn-loading {
                    animation: pulse-ring 1.5s ease infinite;
                }
            `}</style>

            {/* Loading / Success Overlay */}
            {isLoading && (
                <div className="login-overlay">
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!isSuccess && (
                            <>
                                <div className="ripple-dot" />
                                <div className="ripple-dot" />
                            </>
                        )}
                        <div className="loader-ring">
                            {!isSuccess ? (
                                <svg className="spinner-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                                    <circle
                                        className="spinner-circle"
                                        cx="40" cy="40" r="34"
                                        stroke="url(#grad)"
                                        strokeWidth="5"
                                    />
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#818cf8" />
                                            <stop offset="1" stopColor="#a78bfa" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            ) : (
                                <svg className="check-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="40" cy="40" r="34" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2" />
                                    <path
                                        className="check-path"
                                        d="M26 40.5L35.5 50L54 31"
                                        stroke="#a78bfa"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                    <p className="loader-label">
                        {isSuccess ? 'Welcome back ✦' : 'Signing in...'}
                    </p>
                </div>
            )}

            <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0b1220] text-white">

                {/* LEFT SIDE */}
                <div className="hidden lg:flex relative items-center justify-center p-10 bg-gradient-to-br from-blue-900 to-blue-700">
                    <div className="absolute inset-0 opacity-30 bg-[url('/school.jpg')] bg-cover bg-center" />
                    <div className="relative z-10 max-w-md">
                        <p className="text-sm tracking-widest text-blue-200 mb-4">INSTITUTIONAL EXCELLENCE</p>
                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            Elevating the Future of Learning.
                        </h1>
                        <p className="text-blue-100 text-sm">
                            A celestial insight into academic management, designed for the next generation of educators.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
                            <p className="text-sm text-gray-400">School Management System</p>
                        </div>

                        <div className="mb-4">
                            <Label>Username</Label>
                            <Input
                                name="emailOrUsername"
                                value={form.emailOrUsername}
                                onChange={handleChange}
                                onKeyDown={handleKeyPress}
                                placeholder="username"
                                className="bg-[#0f172a] border-none mt-2"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                onKeyDown={handleKeyPress}
                                placeholder="••••••••"
                                className="bg-[#0f172a] border-none mt-2"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm mb-3">{error}</p>
                        )}

                        <Button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className={`w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-all ${isLoading ? 'btn-loading opacity-80' : ''}`}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in to Dashboard →'}
                        </Button>

                        <div className="text-center text-xs text-gray-400 mt-6">
                            <p>admin / 123456</p>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}