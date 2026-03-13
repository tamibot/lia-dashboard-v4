import { api } from '../api';

export interface FilterQuestion {
    id: string;
    question: string;
    fieldKey: string;
    type: 'text' | 'select' | 'multiselect' | 'radio' | 'yesno';
    options: string[];
    isRequired: boolean;
    isActive: boolean;
    productType: string;
    sortOrder: number;
    placeholder?: string;
    createdAt?: string;
}

export const filterQuestionsService = {
    async getAll() {
        return api.get<FilterQuestion[]>('/filter-questions');
    },
    async create(data: Omit<FilterQuestion, 'id' | 'createdAt'>) {
        return api.post<FilterQuestion>('/filter-questions', data);
    },
    async update(id: string, data: Partial<FilterQuestion>) {
        return api.put<FilterQuestion>(`/filter-questions/${id}`, data);
    },
    async delete(id: string) {
        return api.delete<{ success: boolean }>(`/filter-questions/${id}`);
    },
};
