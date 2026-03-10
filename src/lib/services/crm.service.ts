import { api } from '../api';

export const crmService = {
    // Funnels
    async getFunnels() {
        return api.get<any[]>('/crm/funnels');
    },
    async getFunnel(id: string) {
        return api.get<any>(`/crm/funnels/${id}`);
    },
    async createFunnel(data: any) {
        return api.post<any>('/crm/funnels', data);
    },
    async updateFunnel(id: string, data: any) {
        return api.put<any>(`/crm/funnels/${id}`, data);
    },
    async deleteFunnel(id: string) {
        return api.delete<any>(`/crm/funnels/${id}`);
    },

    // Extraction Fields
    async getFields() {
        return api.get<any[]>('/crm/fields');
    },
    async createField(data: any) {
        return api.post<any>('/crm/fields', data);
    },
    async updateField(id: string, data: any) {
        return api.put<any>(`/crm/fields/${id}`, data);
    },
    async deleteField(id: string) {
        return api.delete<any>(`/crm/fields/${id}`);
    },
};
