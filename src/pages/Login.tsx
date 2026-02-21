import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Lock, Mail, CheckCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'overlay' }}></div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                            <Bot className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">LIA Education</h1>
                        <p className="text-lg text-blue-100/80 leading-relaxed max-w-md">
                            La plataforma integral para instituciones educativas modernas. Gestiona agentes, cursos y analíticas en un solo lugar.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-blue-100">
                            <CheckCircle size={18} className="text-green-400" />
                            <span>Gestión automatizada de alumnos</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-blue-100">
                            <CheckCircle size={18} className="text-green-400" />
                            <span>Agentes de IA personalizados</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-blue-100">
                            <CheckCircle size={18} className="text-green-400" />
                            <span>Analítica predictiva en tiempo real</span>
                        </div>
                    </div>

                    <div className="mt-12 text-xs text-blue-200/60">
                        © 2026 Antigravity. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Bot className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Ingresa a tu panel de control
                        </p>
                    </div>

                    <div className="mt-10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Correo Electrónico
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        placeholder="usuario@lia.ai"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Contraseña
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                        Recordarme
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isLoading ? 'Iniciando...' : (
                                        <>
                                            Iniciar Sesión <ArrowRight className="ml-2 w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">
                                        O accede con
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12.48 10.92v2.76h6.3v.39c0 4.29-2.92 7.85-6.87 8.57-4.46.82-8.68-2.22-9.56-6.6a9.03 9.03 0 010-3.6c.88-4.38 5.1-7.42 9.56-6.6 2.06.38 3.93 1.44 5.27 3.01l-1.99 2.01c-1.12-1.39-2.92-2.15-4.73-1.87-2.92.46-5.06 3.08-4.99 6.04 0 2.92 2.12 5.51 5.01 5.95 2.52.38 4.93-1.16 5.63-3.64l.11-.42h-3.75v-2.76h6.87c.12.7.18 1.42.18 2.15 0 4.79-3.44 8.58-8.15 8.58-4.97 0-9-4.03-9-9s4.03-9 9-9c2.25 0 4.31.84 5.92 2.22l-2.07 2.08c-1.2-1.04-2.52-1.42-3.85-1.42z" />
                                    </svg>
                                    <span className="ml-2">Google</span>
                                </button>
                                <button className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M2.5 2.5h7v7h-7v-7zm8 0h7v7h-7v-7zm-8 8h7v7h-7v-7zm8 0h7v7h-7v-7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Microsoft</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

