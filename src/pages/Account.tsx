import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Save, Camera, ShieldCheck } from 'lucide-react';

export default function AccountPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            alert('Perfil actualizado correctamente (Demo)');
        }, 1000);
    };

    return (
        <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>👤 Mi Cuenta</h2>
                <p>Gestiona tu información personal y seguridad de acceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="card text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                                <User size={40} />
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-500 mb-6">{user?.role}</p>

                        <div className="flex flex-col gap-2">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                                <ShieldCheck size={14} /> Cuenta Verificada
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="card p-8 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Información Personal</h3>

                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        className="form-input w-full pl-10 h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        className="form-input w-full pl-10 h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 ml-2">El correo electrónico no se puede cambiar por seguridad.</p>
                            </div>

                            <div className="form-group">
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        className="form-input w-full pl-10 h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={formData.phone}
                                        placeholder="+51 987 654 321"
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 pt-4">Seguridad</h3>

                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Contraseña Actual</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        className="form-input w-full pl-10 h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.currentPassword}
                                        onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Nueva Contraseña</label>
                                    <input
                                        className="form-input w-full h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Confirmar Contraseña</label>
                                    <input
                                        className="form-input w-full h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
