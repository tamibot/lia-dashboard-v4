import { api } from '../api';
import type { AiAgent } from '../types';

export const agentService = {
    async getAll() {
        return api.get<AiAgent[]>('/agents');
    },

    async getById(id: string) {
        return api.get<AiAgent>(`/agents/${id}`);
    },

    async create(data: Partial<AiAgent>) {
        return api.post<AiAgent>('/agents', data);
    },

    async update(id: string, data: Partial<AiAgent>) {
        return api.patch<AiAgent>(`/agents/${id}`, data);
    },

    async delete(id: string) {
        return api.delete<void>(`/agents/${id}`);
    }
};
