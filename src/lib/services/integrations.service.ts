import { api } from '../api';

export interface GhlStatus {
    connected: boolean;
    locationId?: string;
    companyId?: string;
    userType?: string;
    lastSyncAt?: string;
    contactsSynced?: number;
    tokenExpired?: boolean;
    connectedAt?: string;
    hasPrivateKey?: boolean;
}

export interface GhlSyncResult {
    message: string;
    synced: number;
    failed: number;
    total: number;
}

export const integrationsService = {
    // GHL OAuth
    async getGhlStatus() {
        return api.get<GhlStatus>('/integrations/ghl/status');
    },
    async getGhlAuthUrl() {
        return api.get<{ url: string }>('/integrations/ghl/auth-url');
    },
    async disconnectGhl() {
        return api.post<{ message: string }>('/integrations/ghl/disconnect', {});
    },

    // GHL Data
    async syncContacts() {
        return api.post<GhlSyncResult>('/integrations/ghl/sync-contacts', {});
    },
    async previewContacts(limit = 20) {
        return api.get<{ contacts: any[]; meta: any }>(`/integrations/ghl/contacts?limit=${limit}`);
    },
    async getPipelines() {
        return api.get<any>('/integrations/ghl/pipelines');
    },
    async getOpportunities() {
        return api.get<any>('/integrations/ghl/opportunities');
    },
    async setupPipeline() {
        return api.post<any>('/integrations/ghl/setup-pipeline', {});
    },
    async setupFields() {
        return api.post<any>('/integrations/ghl/setup-fields', {});
    },
    async getCustomFields() {
        return api.get<any>('/integrations/ghl/custom-fields');
    },
    async updateCustomField(fieldId: string, data: { name?: string; placeholder?: string; options?: string[] }) {
        return api.put<any>(`/integrations/ghl/custom-fields/${fieldId}`, data);
    },
    async deleteCustomField(fieldId: string) {
        return api.delete<any>(`/integrations/ghl/custom-fields/${fieldId}`);
    },
    async savePrivateKey(apiKey: string) {
        return api.put<{ message: string }>('/integrations/ghl/private-key', { apiKey });
    },
};
