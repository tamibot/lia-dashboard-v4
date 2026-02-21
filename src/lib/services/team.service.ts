import { api } from '../api';
import type { Team } from '../types';

export const teamService = {
    async getAll() {
        return api.get<Team[]>('/teams');
    },

    async getById(id: string) {
        return api.get<Team>(`/teams/${id}`);
    },

    async create(data: Partial<Team>) {
        return api.post<Team>('/teams', data);
    },

    async update(id: string, data: Partial<Team>) {
        return api.patch<Team>(`/teams/${id}`, data);
    },

    async delete(id: string) {
        return api.delete(`/teams/${id}`);
    }
};
