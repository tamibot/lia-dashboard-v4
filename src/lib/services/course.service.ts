import { api } from '../api';

export const courseService = {
    async getAll(type?: 'curso' | 'programa' | 'webinar') {
        const url = type ? `/courses?type=${type}` : '/courses';
        return api.get<any[]>(url);
    },

    async getById(id: string) {
        return api.get<any>(`/courses/${id}`);
    },

    async create(data: any) {
        return api.post<any>('/courses', data);
    },

    async update(id: string, data: any) {
        return api.patch<any>(`/courses/${id}`, data);
    },

    async delete(id: string) {
        return api.delete<any>(`/courses/${id}`);
    }
};
