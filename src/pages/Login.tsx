import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err: any) {
            setError('Correo o contraseña incorrectos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

            {/* Card */}
            <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 shadow-md shadow-blue-200">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                            <path d="M9 14v3"/><path d="M15 14v3"/>
                            <path d="M3 21h18"/><path d="M3 17h18"/>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">LIA Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Ingresa a tu panel de control</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="usuario@institución.com"
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type={showPwd ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-px mt-2"
                    >
                        {isLoading ? 'Iniciando...' : <> Iniciar Sesión <ArrowRight size={15} /></>}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-6 text-xs text-gray-400">
                © 2026 Antigravity · LIA Education
            </p>
        </div>
    );
}
