import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrationsService, type GhlStatus } from '../lib/services/integrations.service';
import { useToast } from '../context/ToastContext';
import {
    Link2, Unlink, RefreshCw, Users, GitBranch,
    CheckCircle2, AlertTriangle, Loader2, ExternalLink, Download,
    ListChecks, Key, Save
} from 'lucide-react';

export default function GhlIntegration() {
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState<GhlStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [previewContacts, setPreviewContacts] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [settingUpFields, setSettingUpFields] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [savingKey, setSavingKey] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await integrationsService.getGhlStatus();
            setStatus(data);
        } catch {
            setStatus({ connected: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Handle OAuth callback redirect
    useEffect(() => {
        const ghlResult = searchParams.get('ghl');
        if (ghlResult === 'success') {
            toast('GoHighLevel conectado exitosamente');
            fetchStatus();
            searchParams.delete('ghl');
            setSearchParams(searchParams, { replace: true });
        } else if (ghlResult === 'error') {
            const reason = searchParams.get('reason') || 'unknown';
            toast(`Error al conectar GoHighLevel: ${reason}`, 'error');
            searchParams.delete('ghl');
            searchParams.delete('reason');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, toast, fetchStatus]);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const { url } = await integrationsService.getGhlAuthUrl();
            window.location.href = url;
        } catch {
            toast('Error al generar URL de autorizacion', 'error');
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('¿Seguro que deseas desconectar GoHighLevel? Los contactos sincronizados se mantendran.')) return;
        try {
            await integrationsService.disconnectGhl();
            setStatus({ connected: false });
            setPreviewContacts([]);
            setShowPreview(false);
            toast('GoHighLevel desconectado');
        } catch {
            toast('Error al desconectar', 'error');
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await integrationsService.syncContacts();
            toast(result.message);
            fetchStatus();
        } catch (err: any) {
            toast(err?.data?.error || 'Error al sincronizar contactos', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const handlePreview = async () => {
        if (showPreview) {
            setShowPreview(false);
            return;
        }
        setLoadingPreview(true);
        try {
            const data = await integrationsService.previewContacts(10);
            setPreviewContacts(data.contacts || []);
            setShowPreview(true);
        } catch (err: any) {
            toast(err?.data?.error || 'Error al obtener preview', 'error');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSavePrivateKey = async () => {
        if (!privateKey.trim()) {
            toast('Ingresa un API Key valido', 'error');
            return;
        }
        setSavingKey(true);
        try {
            await integrationsService.savePrivateKey(privateKey.trim());
            toast('Private API Key guardada exitosamente');
            setPrivateKey('');
            fetchStatus();
        } catch (err: any) {
            toast(err?.data?.error || 'Error al guardar API key', 'error');
        } finally {
            setSavingKey(false);
        }
    };

    const handleSetupFields = async () => {
        setSettingUpFields(true);
        try {
            const result = await integrationsService.setupFields();
            toast(result.message || 'Campos creados exitosamente');
        } catch (err: any) {
            toast(err?.data?.error || 'Error al crear campos. Verifica que tengas el scope locations/customFields.write', 'error');
        } finally {
            setSettingUpFields(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="skeleton h-8 w-64 rounded-lg" />
                <div className="skeleton h-48 w-full rounded-xl" />
                <div className="skeleton h-32 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Integracion GoHighLevel</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Conecta tu cuenta de GoHighLevel para sincronizar contactos, oportunidades y pipelines.
                </p>
            </div>

            {/* Connection Status Card */}
            <div className={`rounded-xl border-2 p-6 ${
                status?.connected
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-200 bg-white'
            }`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            status?.connected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                            {status?.connected
                                ? <CheckCircle2 size={24} className="text-green-600" />
                                : <Link2 size={24} className="text-gray-400" />
                            }
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {status?.connected ? 'Conectado' : 'No conectado'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {status?.connected
                                    ? `Location: ${status.locationId || 'N/A'}`
                                    : 'Conecta tu cuenta para comenzar a sincronizar datos'
                                }
                            </p>
                        </div>
                    </div>

                    {status?.connected ? (
                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Unlink size={16} /> Desconectar
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {connecting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <ExternalLink size={16} />
                            )}
                            Conectar GoHighLevel
                        </button>
                    )}
                </div>

                {/* Connection details */}
                {status?.connected && (
                    <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Tipo</p>
                            <p className="text-sm font-medium">{status.userType || 'Location'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Contactos sincronizados</p>
                            <p className="text-sm font-medium">{status.contactsSynced || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Ultima sincronizacion</p>
                            <p className="text-sm font-medium">
                                {status.lastSyncAt
                                    ? new Date(status.lastSyncAt).toLocaleDateString('es', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })
                                    : 'Nunca'
                                }
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Conectado desde</p>
                            <p className="text-sm font-medium">
                                {status.connectedAt
                                    ? new Date(status.connectedAt).toLocaleDateString('es', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                )}

                {status?.connected && status?.tokenExpired && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertTriangle size={16} />
                        Token expirado. La sincronizacion renovara el token automaticamente.
                    </div>
                )}
            </div>

            {/* Actions */}
            {status?.connected && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sync Contacts */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Contactos</h3>
                                <p className="text-xs text-gray-500">Sincroniza contactos desde GHL</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {syncing ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                            </button>
                            <button
                                onClick={handlePreview}
                                disabled={loadingPreview}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {loadingPreview ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={14} />
                                )}
                                Preview
                            </button>
                        </div>
                    </div>

                    {/* Pipeline info (read-only — GHL API no soporta crear pipelines) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <GitBranch size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Pipeline</h3>
                                <p className="text-xs text-gray-500">Se configura directamente en GHL</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            La API de GHL no permite crear pipelines. Configura tus embudos desde la seccion de Oportunidades en tu cuenta de GoHighLevel.
                        </p>
                    </div>

                    {/* Setup Custom Fields */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                <ListChecks size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Campos Personalizados</h3>
                                <p className="text-xs text-gray-500">Crear campos de contacto en GHL</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSetupFields}
                            disabled={settingUpFields}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                            {settingUpFields ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <ListChecks size={16} />
                            )}
                            {settingUpFields ? 'Creando...' : 'Crear Campos'}
                        </button>
                    </div>
                </div>
            )}

            {/* Private Integration Key */}
            {status?.connected && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Key size={20} className="text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Private Integration Key</h3>
                            <p className="text-xs text-gray-500">
                                {status.hasPrivateKey
                                    ? 'Key configurada. Puedes actualizarla ingresando una nueva.'
                                    : 'Necesaria para crear pipelines y campos personalizados en GHL.'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={privateKey}
                            onChange={e => setPrivateKey(e.target.value)}
                            placeholder={status.hasPrivateKey ? 'Ingresa nueva key para actualizar...' : 'pit-xxxxx-xxxx-xxxx...'}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSavePrivateKey}
                            disabled={savingKey || !privateKey.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            {savingKey ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Contact Preview Table */}
            {showPreview && previewContacts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">
                            Preview de contactos GHL ({previewContacts.length})
                        </h3>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            Cerrar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nombre</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Telefono</th>
                                    <th className="px-4 py-2 text-left">Tags</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {previewContacts.map((c: any) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">
                                            {c.contactName || c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'N/A'}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{c.email || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{c.phone || '-'}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {(c.tags || []).slice(0, 3).map((tag: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showPreview && previewContacts.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Users size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No se encontraron contactos en tu cuenta GHL.</p>
                </div>
            )}

            {/* Info */}
            {!status?.connected && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 mb-2">¿Como funciona?</h3>
                    <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                        <li>Haz click en <strong>"Conectar GoHighLevel"</strong> para autorizar acceso</li>
                        <li>Selecciona tu sub-cuenta (Location) en GHL</li>
                        <li>Una vez conectado, sincroniza tus contactos con un click</li>
                        <li>Los contactos aparecen en tu seccion de CRM automaticamente</li>
                    </ol>
                </div>
            )}
        </div>
    );
}
