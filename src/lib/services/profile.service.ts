import { api } from '../api';
import type { OrgProfile } from '../types';

export const profileService = {
    async get() {
        return api.get<OrgProfile>('/profile');
    },

    async update(data: Partial<OrgProfile>) {
        return api.put<OrgProfile>('/profile', data);
    }
};
