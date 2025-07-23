'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
// Note: js-cookie not needed since backend handles token as HttpOnly cookie
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('http://localhost:47005/auth/me', {
                    withCredentials: true, // include HttpOnly cookie
                });
                const role = res.data?.role?.toLowerCase();
                if (role) {
                    router.push(`/${role}`);
                }
            } catch (err) {
                console.log('No valid token or user not authenticated');
            }
        };
        checkAuth();
    }, [router]);

    const [form, setForm] = useState({
        emailOrUsername: '', // Fixed: changed from 'Username' to match the input name
        password: '',
        role: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post(
                'http://localhost:47005/auth/login',
                {
                    username: form.emailOrUsername,
                    password: form.password,
                },
                { withCredentials: true }
            );

            // Extract user data from response (token is set as HttpOnly cookie by backend)
            const { user } = res.data;

            // Check role mismatch
            if (user?.role?.toLowerCase() !== form.role.toLowerCase()) {
                setError('Role mismatch: You selected a different role than your account role');
                return;
            }
            localStorage.setItem("user_role", user.role.toLowerCase());
            // Redirect to role-specific route
            router.push(`/${user.role.toLowerCase()}`);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Invalid credentials');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please try again.');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 rounded-xl shadow-lg bg-white w-[400px] space-y-4">
                <h1 className="text-2xl font-bold text-center text-gray-800">Login</h1>

                {/* Role Selection */}
                <div className="mb-6">
                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">
                        Select Your Role
                    </Label>
                    <div className="flex justify-center gap-4">
                        {[
                            { role: "admin", icon: "👨‍💼", color: "from-purple-500 to-purple-600" },
                            { role: "teacher", icon: "👩‍🏫", color: "from-blue-500 to-blue-600" },
                            { role: "student", icon: "👨‍🎓", color: "from-green-500 to-green-600" }
                        ].map(({ role, icon, color }) => (
                            <div
                                key={role}
                                onClick={() => setForm({ ...form, role })}
                                className={`relative h-20 w-20 rounded-xl border-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-200 hover:scale-105 ${form.role === role
                                    ? `border-blue-500 bg-gradient-to-br ${color} text-white shadow-lg`
                                    : "border-gray-200 hover:border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                                    }`}
                            >
                                <span className="text-2xl mb-1">{icon}</span>
                                <span
                                    className={`text-xs font-medium ${form.role === role ? "text-white" : "text-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {role.toUpperCase()}
                                </span>
                                {form.role === role && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>


                <div>
                    <Label htmlFor="emailOrUsername">Email or Username</Label>
                    <Input
                        id="emailOrUsername"
                        name="emailOrUsername"
                        value={form.emailOrUsername}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter email or username"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter password"
                        required
                    />
                </div>


                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <Button
                    className="w-full bg-blue-950" 
                    onClick={handleLogin}
                    disabled={!form.emailOrUsername || !form.password || !form.role}
                >
                    Login
                </Button>
            </div>
        </div>
    );
}