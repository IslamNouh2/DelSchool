'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/auth/me');
                const role = res.data?.role?.toLowerCase();
                console.log("ME:", res.data);

                // ✅ منع loop
                if (role && window.location.pathname === "/login") {
                    router.replace(`/${role}`);
                }
            } catch { }
        };

        checkAuth();
    }, []);

    const [form, setForm] = useState({
        emailOrUsername: '',
        password: '',
        role: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        try {
            const res = await api.post('/auth/login', {
                username: form.emailOrUsername,
                password: form.password,
            });

            const { user, accessToken } = res.data;

            if (accessToken) {
                Cookies.set('accessToken', accessToken, {
                    secure: true,
                    sameSite: 'none',
                    expires: 1 / 96,
                });
            }

            // ✅ REMOVE ROLE CHECK

            localStorage.setItem("user_role", user.role.toLowerCase());

            router.push(`/${user.role.toLowerCase()}`);

        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('Invalid credentials');
            } else {
                setError('Login failed');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0b1220] text-white">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex relative items-center justify-center p-10 bg-gradient-to-br from-blue-900 to-blue-700">
                <div className="absolute inset-0 opacity-30 bg-[url('/school.jpg')] bg-cover bg-center" />

                <div className="relative z-10 max-w-md">
                    <p className="text-sm tracking-widest text-blue-200 mb-4">
                        INSTITUTIONAL EXCELLENCE
                    </p>

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

                    {/* EMAIL */}
                    <div className="mb-4">
                        <Label>Email address</Label>
                        <Input
                            name="emailOrUsername"
                            value={form.emailOrUsername}
                            onChange={handleChange}
                            onKeyDown={handleKeyPress}
                            placeholder="name@academy.edu"
                            className="bg-[#0f172a] border-none mt-2"
                        />
                    </div>

                    {/* PASSWORD */}
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
                        />
                    </div>

                    {/* ERROR */}
                    {error && (
                        <p className="text-red-400 text-sm mb-3">{error}</p>
                    )}

                    {/* BUTTON */}
                    <Button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
                    >
                        Sign in to Dashboard →
                    </Button>

                    {/* EXTRA */}
                    <div className="text-center text-xs text-gray-400 mt-6">
                        <p>admin@gmail.com / 123456</p>
                    </div>

                </div>
            </div>
        </div>
    );
}