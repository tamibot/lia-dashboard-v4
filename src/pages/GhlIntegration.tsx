import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrationsService, type GhlStatus } from '../lib/services/integrations.service';
import { useToast } from '../context/ToastContext';
import {
    Link2, Unlink, RefreshCw,
    CheckCircle2, AlertTriangle, Loader2, ExternalLink, Download,
    Key, Check, X as XIcon
} from 'lucide-react';

const REQUIRED_STAGES = [
    'Nuevo Lead',
    'Primer Contacto',
    'Calificado',
    'Presentacion Realizada',
    'Propuesta Enviada',
    'Negociacion',
    'Inscrito',
    'Perdido',
];

const REQUIRED_FIELDS = [
    { name: 'Producto de Interes', key: 'contact.producto_de_interes' },
    { name: 'Tipo de Producto', key: 'contact.tipo_de_producto' },
    { name: 'Presupuesto', key: 'contact.presupuesto' },
    { name: 'Modalidad Preferida', key: 'contact.modalidad_preferida' },
    { name: 'Nivel Educativo', key: 'contact.nivel_educativo' },
    { name: 'Ocupacion Actual', key: 'contact.ocupacion_actual' },
    { name: 'Horario Preferido', key: 'contact.horario_preferido' },
    { name: 'Fuente de Referencia', key: 'contact.fuente_de_referencia' },
    { name: 'Fecha de Interes', key: 'contact.fecha_de_interes' },
    { name: 'Notas del Asesor', key: 'contact.notas_del_asesor' },
];

export default function GhlIntegration() {
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState<GhlStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [settingUpFields, setSettingUpFields] = useState(false);
    const DEMO_PRIVATE_KEY = 'pit-df2d1c7b-eede-4bbb-9c9c-e5f02291c3ee';
    const [privateKey, setPrivateKey] = useState(DEMO_PRIVATE_KEY);
    const [savingKey, setSavingKey] = useState(false);
    const [keyValidation, setKeyValidation] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [keyValidationMsg, setKeyValidationMsg] = useState('');
    const [checklistData, setChecklistData] = useState<{
        stages: string[];
        fields: string[];
        pipelineName: string;
    } | null>(null);
    const [loadingChecklist, setLoadingChecklist] = useState(false);

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

    const handleVerifyChecklist = useCallback(async () => {
        setLoadingChecklist(true);
        try {
            const [pipelinesResp, fieldsResp] = await Promise.all([
                integrationsService.getPipelines().catch(() => ({ pipelines: [] })),
                integrationsService.getCustomFields().catch(() => ({ customFields: [] })),
            ]);

            const pipelines = (pipelinesResp as any).pipelines || [];
            const targetPipeline = pipelines.find((p: any) =>
                p.name?.toLowerCase().includes('embudo') || p.name?.toLowerCase().includes('lia')
            ) || pipelines[0];

            const stageNames = targetPipeline?.stages?.map((s: any) => s.name) || [];

            const rawFields = (fieldsResp as any).customFields
                || (fieldsResp as any).data
                || (Array.isArray(fieldsResp) ? fieldsResp : []);
            const fieldNames = rawFields.map((f: any) => f.name || f.fieldName || '');

            setChecklistData({
                stages: stageNames,
                fields: fieldNames,
                pipelineName: targetPipeline?.name || 'No encontrado',
            });
        } catch {
            // Silent — checklist just won't show
        } finally {
            setLoadingChecklist(false);
        }
    }, []);

    // Auto-verify when connected with private key
    useEffect(() => {
        if (status?.connected && status?.hasPrivateKey) {
            handleVerifyChecklist();
        }
    }, [status?.connected, status?.hasPrivateKey, handleVerifyChecklist]);

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
        if (!confirm('Desconectar GoHighLevel? Los contactos sincronizados se mantendran.')) return;
        try {
            await integrationsService.disconnectGhl();
            setStatus({ connected: false });
            setChecklistData(null);
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

    const handleSavePrivateKey = async () => {
        if (!privateKey.trim()) return;
        setSavingKey(true);
        setKeyValidation('validating');
        setKeyValidationMsg('Validando y guardando...');
        try {
            await integrationsService.savePrivateKey(privateKey.trim());
            setKeyValidation('success');
            setKeyValidationMsg('Private API Key guardada exitosamente');
            toast('Private API Key guardada');
            fetchStatus();
        } catch (err: any) {
            setKeyValidation('error');
            setKeyValidationMsg(err?.data?.error || 'Error al guardar API key');
            toast(err?.data?.error || 'Error al guardar API key', 'error');
        } finally {
            setSavingKey(false);
        }
    };

    const handleSetupFields = async () => {
        setSettingUpFields(true);
        try {
            const result = await integrationsService.setupFields();
            toast(result.message || 'Campos sincronizados');
            handleVerifyChecklist();
        } catch (err: any) {
            toast(err?.data?.error || 'Error al sincronizar campos', 'error');
        } finally {
            setSettingUpFields(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    // Checklist counts
    const stagesMatched = checklistData ? REQUIRED_STAGES.filter(stage =>
        checklistData.stages.some(s => s.toLowerCase().trim() === stage.toLowerCase().trim())
    ).length : 0;
    const fieldsMatched = checklistData ? REQUIRED_FIELDS.filter(field =>
        checklistData.fields.some(f =>
            f.toLowerCase().trim().includes(field.name.toLowerCase().trim())
            || field.name.toLowerCase().trim().includes(f.toLowerCase().trim())
        )
    ).length : 0;

    return (
        <div className="space-y-6">

            {/* Connection Status */}
            <div className={`rounded-xl border-2 p-6 ${
                status?.connected ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
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
                                {status?.connected ? 'GoHighLevel Conectado' : 'GoHighLevel'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {status?.connected
                                    ? `Location: ${status.locationId || 'N/A'}`
                                    : 'Conecta tu cuenta para sincronizar contactos y campos'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status?.connected && (
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {syncing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                {syncing ? 'Sincronizando...' : 'Sincronizar Contactos'}
                            </button>
                        )}
                        {status?.connected ? (
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Unlink size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {connecting ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                                Conectar GoHighLevel
                            </button>
                        )}
                    </div>
                </div>

                {/* Connection details */}
                {status?.connected && (
                    <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Tipo</p>
                            <p className="font-medium">{status.userType || 'Location'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Contactos sincronizados</p>
                            <p className="font-medium">{status.contactsSynced || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Ultima sincronizacion</p>
                            <p className="font-medium">
                                {status.lastSyncAt
                                    ? new Date(status.lastSyncAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : 'Nunca'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Conectado desde</p>
                            <p className="font-medium">
                                {status.connectedAt
                                    ? new Date(status.connectedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                )}

                {status?.connected && status?.tokenExpired && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertTriangle size={16} />
                        Token expirado. Usa la Private Integration Key para acceder a los datos.
                    </div>
                )}
            </div>

            {/* Private Integration Key */}
            {status?.connected && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Key size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Private Integration Key</h3>
                            <p className="text-xs text-gray-500">
                                {status.hasPrivateKey
                                    ? 'Key configurada. Puedes actualizarla ingresando una nueva.'
                                    : 'Necesaria para sincronizar campos personalizados y verificar la configuracion.'}
                            </p>
                        </div>
                        {status.hasPrivateKey && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Configurada</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={privateKey}
                            onChange={e => { setPrivateKey(e.target.value); setKeyValidation('idle'); }}
                            placeholder={status.hasPrivateKey ? 'Ingresa nueva key para actualizar...' : 'pit-xxxxx-xxxx-xxxx...'}
                            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        />
                        <button
                            onClick={handleSavePrivateKey}
                            disabled={savingKey || !privateKey.trim()}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            {savingKey ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            {savingKey ? 'Validando...' : 'Confirmar'}
                        </button>
                    </div>

                    {keyValidation === 'success' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <CheckCircle2 size={16} /> {keyValidationMsg}
                        </div>
                    )}
                    {keyValidation === 'error' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                            <AlertTriangle size={16} /> {keyValidationMsg}
                        </div>
                    )}

                    <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700 py-1">
                            Como obtener tu Private Integration Key
                        </summary>
                        <div className="mt-2 space-y-2 text-xs text-gray-600">
                            <div className="flex gap-2 items-start">
                                <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                                <p>Ve a <strong>Settings &gt; Integrations</strong> en tu cuenta de GoHighLevel</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                                <p>Busca la seccion <strong>"Private Integrations"</strong> y crea una nueva integracion</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                                <p>Asigna los permisos: <strong>Contacts, Custom Fields, Opportunities</strong></p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</span>
                                <p>Copia la <strong>API Key (pit-...)</strong> y pegala arriba</p>
                            </div>
                        </div>
                    </details>
                </div>
            )}

            {/* Configuration Status — auto-loaded */}
            {status?.connected && status?.hasPrivateKey && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Estado de Configuracion</h3>
                        <button
                            onClick={handleVerifyChecklist}
                            disabled={loadingChecklist}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {loadingChecklist ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Actualizar
                        </button>
                    </div>

                    {loadingChecklist && !checklistData && (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                        </div>
                    )}

                    {checklistData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pipeline Stages */}
                            <div className="border border-gray-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-800">Etapas del Pipeline</h4>
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                        {checklistData.pipelineName}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {REQUIRED_STAGES.map(stage => {
                                        const found = checklistData.stages.some(
                                            s => s.toLowerCase().trim() === stage.toLowerCase().trim()
                                        );
                                        return (
                                            <div key={stage} className="flex items-center gap-2 text-sm">
                                                {found
                                                    ? <Check size={14} className="text-green-500 flex-shrink-0" />
                                                    : <XIcon size={14} className="text-red-400 flex-shrink-0" />
                                                }
                                                <span className={found ? 'text-gray-700' : 'text-red-500'}>{stage}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`mt-3 pt-3 border-t text-xs font-semibold flex items-center gap-1.5 ${
                                    stagesMatched === REQUIRED_STAGES.length ? 'border-green-100 text-green-700' : 'border-amber-100 text-amber-700'
                                }`}>
                                    {stagesMatched === REQUIRED_STAGES.length
                                        ? <><CheckCircle2 size={13} /> Todas las etapas configuradas</>
                                        : <><AlertTriangle size={13} /> {stagesMatched}/{REQUIRED_STAGES.length} etapas encontradas</>
                                    }
                                </div>
                                {stagesMatched < REQUIRED_STAGES.length && (
                                    <p className="mt-2 text-[10px] text-gray-400">
                                        Configura las etapas faltantes en Oportunidades dentro de tu cuenta GHL.
                                    </p>
                                )}
                            </div>

                            {/* Custom Fields */}
                            <div className="border border-gray-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-800">Campos Personalizados</h4>
                                    <button
                                        onClick={handleSetupFields}
                                        disabled={settingUpFields}
                                        className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                    >
                                        {settingUpFields
                                            ? <><Loader2 size={10} className="animate-spin" /> Sincronizando...</>
                                            : fieldsMatched === REQUIRED_FIELDS.length
                                                ? <><RefreshCw size={10} /> Actualizar</>
                                                : <><Download size={10} /> Crear campos</>
                                        }
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    {REQUIRED_FIELDS.map(field => {
                                        const found = checklistData.fields.some(
                                            f => f.toLowerCase().trim().includes(field.name.toLowerCase().trim())
                                                || field.name.toLowerCase().trim().includes(f.toLowerCase().trim())
                                        );
                                        return (
                                            <div key={field.key} className="flex items-center gap-2 text-sm">
                                                {found
                                                    ? <Check size={14} className="text-green-500 flex-shrink-0" />
                                                    : <XIcon size={14} className="text-red-400 flex-shrink-0" />
                                                }
                                                <span className={found ? 'text-gray-700' : 'text-red-500'}>{field.name}</span>
                                                <span className="text-[10px] text-gray-300 font-mono ml-auto">{field.key}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`mt-3 pt-3 border-t text-xs font-semibold flex items-center gap-1.5 ${
                                    fieldsMatched === REQUIRED_FIELDS.length ? 'border-green-100 text-green-700' : 'border-amber-100 text-amber-700'
                                }`}>
                                    {fieldsMatched === REQUIRED_FIELDS.length
                                        ? <><CheckCircle2 size={13} /> Todos los campos configurados</>
                                        : <><AlertTriangle size={13} /> {fieldsMatched}/{REQUIRED_FIELDS.length} campos encontrados</>
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* How it works — only when not connected */}
            {!status?.connected && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 mb-2">Como funciona</h3>
                    <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                        <li>Haz click en <strong>"Conectar GoHighLevel"</strong> para autorizar acceso</li>
                        <li>Selecciona tu sub-cuenta (Location) en GHL</li>
                        <li>Configura tu <strong>Private Integration Key</strong> para habilitar la sincronizacion de campos</li>
                        <li>Los contactos y campos se sincronizan automaticamente</li>
                    </ol>
                </div>
            )}
        </div>
    );
}
