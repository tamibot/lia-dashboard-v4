import { api } from '../api';

export const courseService = {
    async getAll(type?: 'curso' | 'programa' | 'webinar' | 'postulacion' | 'subscripcion' | 'software') {
        const url = type ? `/courses?type=${type}` : '/courses';
        return api.get<any[]>(url);
    },

    async getById(id: string, type?: string) {
        const url = type ? `/courses/${id}?type=${type}` : `/courses/${id}`;
        return api.get<any>(url);
    },

    async create(data: any) {
        return api.post<any>('/courses', data);
    },

    async update(id: string, data: any) {
        return api.put<any>(`/courses/${id}`, data);
    },

    async delete(id: string) {
        return api.delete<any>(`/courses/${id}`);
    }
};
