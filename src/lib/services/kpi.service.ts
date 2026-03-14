import { api } from '../api';

export interface KpiOverview {
    totalContacts: number;
    activeContacts: number;
    won: number;
    lost: number;
    conversionRate: number;
    byStage: { stage: string; count: number }[];
    byOrigin: { origin: string; count: number }[];
    contactsOverTime: { week: string; count: number }[];
    recentContacts: {
        id: string;
        name: string;
        email: string | null;
        stage: string;
        origin: string;
        createdAt: string;
    }[];
}

export interface FunnelStage {
    id: string;
    name: string;
    count: number;
    value: number;
    position: number;
}

export interface KpiFunnel {
    connected: boolean;
    pipeline?: { id: string; name: string };
    stages: FunnelStage[];
    totalOpportunities: number;
    totalValue: number;
    wonCount: number;
    lostCount: number;
    openCount: number;
    error?: string;
}

export const kpiService = {
    async getOverview() {
        return api.get<KpiOverview>('/kpi/overview');
    },
    async getFunnel() {
        return api.get<KpiFunnel>('/kpi/funnel');
    },
};
