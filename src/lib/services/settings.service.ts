import { api } from '../api';

let cachedKeys: { gemini_key: string | null, openai_key: string | null } | null = null;
let initialized = false;

export const settingsService = {
    async initialize() {
        if (initialized) return;
        try {
            const data = await api.get<{ gemini_key: string | null, openai_key: string | null }>('/settings/keys');
            cachedKeys = data;
            initialized = true;
        } catch (error) {
            console.error('Failed to initialize settings:', error);
        }
    },

    async getApiKeys() {
        if (!initialized) await this.initialize();
        return cachedKeys || { gemini_key: null, openai_key: null };
    },

    getGeminiKeySync() {
        return cachedKeys?.gemini_key || null;
    },

    getOpenAIKeySync() {
        return cachedKeys?.openai_key || null;
    },

    async updateGeminiKey(key: string) {
        await api.post('/settings/keys/gemini', { key });
        if (cachedKeys) cachedKeys.gemini_key = key;
    },

    async updateOpenAIKey(key: string) {
        await api.post('/settings/keys/openai', { key });
        if (cachedKeys) cachedKeys.openai_key = key;
    },

    async deleteGeminiKey() {
        await api.delete('/settings/keys/gemini');
        if (cachedKeys) cachedKeys.gemini_key = null;
    },

    async deleteOpenAIKey() {
        await api.delete('/settings/keys/openai');
        if (cachedKeys) cachedKeys.openai_key = null;
    },

    async resetDemoData() {
        return api.post('/settings/reset-demo', {});
    }
};
