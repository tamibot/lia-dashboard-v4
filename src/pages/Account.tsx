import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, Lock, Save, ShieldCheck, Building2, LogOut, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function AccountPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password fields if trying to change password
        if (formData.newPassword || formData.confirmPassword) {
            if (!formData.currentPassword) {
                setError('Ingresa tu contraseña actual para cambiarla.');
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                setError('Las contraseñas nuevas no coinciden.');
                return;
            }
            if (formData.newPassword.length < 6) {
                setError('La nueva contraseña debe tener al menos 6 caracteres.');
                return;
            }
        }

        setLoading(true);
        try {
            // Update profile info
            await api.put('/auth/account', {
                name: formData.name,
                phone: formData.phone,
            });

            // Change password if provided
            if (formData.newPassword && formData.currentPassword) {
                await api.put('/auth/password', {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                });
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            const msg = err?.data?.error || err?.message || 'Error al guardar los cambios.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="page-content" style={{ maxWidth: '860px' }}>

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mi Cuenta</h2>
                <p className="text-sm text-gray-500 mt-1">Gestiona tu información personal y seguridad de acceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column — Profile Card */}
                <div className="md:col-span-1 flex flex-col gap-4">

                    {/* Identity */}
                    <div className="card flex flex-col items-center text-center gap-3 py-8">
                        <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-200">
                            {initials}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{user?.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
                        </div>
                        <div className="w-full border-t border-gray-100 pt-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            {user?.phone && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                                    <Phone size={12} className="text-gray-400 flex-shrink-0" />
                                    <span>{user.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full mt-1">
                            <ShieldCheck size={12} /> Cuenta Verificada
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="card flex items-center gap-3 py-4">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Institución</p>
                            <p className="text-sm font-bold text-gray-800 truncate">{user?.orgName || '—'}</p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                    >
                        <LogOut size={15} /> Cerrar Sesión
                    </button>
                </div>

                {/* Right Column — Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="card space-y-5">

                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-4">Información Personal</h3>
                            <div className="space-y-4">

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre Completo</label>
                                    <input
                                        className="input w-full"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Tu nombre completo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo Electrónico</label>
                                    <input
                                        className="input w-full bg-gray-50 text-gray-400 cursor-not-allowed"
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">El correo no se puede cambiar por seguridad.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono / WhatsApp</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            className="input w-full pl-9"
                                            value={formData.phone}
                                            placeholder="+51 987 654 321"
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Lock size={14} className="text-gray-400" /> Cambiar Contraseña
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña Actual</label>
                                    <div className="relative">
                                        <input
                                            className="input w-full pr-10"
                                            type={showPwd ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.currentPassword}
                                            onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nueva Contraseña</label>
                                        <input
                                            className="input w-full"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.newPassword}
                                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar</label>
                                        <input
                                            className="input w-full"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                <AlertCircle size={15} className="flex-shrink-0" /> {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-3 text-sm"
                            >
                                {loading ? 'Guardando...' : saved ? '✓ Cambios guardados' : <><Save size={15} /> Guardar Cambios</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
