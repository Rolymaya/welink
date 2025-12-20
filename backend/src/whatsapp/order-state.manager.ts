import { Injectable } from '@nestjs/common';

export interface OrderState {
    contactId: string;
    product: {
        id: string;
        name: string;
        price: string;
    } | null;
    productName: string | null;
    quantity: number | null;
    address: string | null;
    lastUpdated: Date;
}

@Injectable()
export class OrderStateManager {
    private states = new Map<string, OrderState>();

    getState(contactId: string): OrderState {
        if (!this.states.has(contactId)) {
            this.states.set(contactId, {
                contactId,
                product: null,
                productName: null,
                quantity: null,
                address: null,
                lastUpdated: new Date()
            });
        }
        return this.states.get(contactId)!;
    }

    updateState(contactId: string, updates: Partial<OrderState>): OrderState {
        const state = this.getState(contactId);
        Object.assign(state, updates, { lastUpdated: new Date() });
        return state;
    }

    clearState(contactId: string): void {
        this.states.delete(contactId);
    }

    hasAllInfo(contactId: string): boolean {
        const state = this.getState(contactId);
        return !!(state.product && state.quantity && state.address);
    }

    getMissingInfo(contactId: string): string[] {
        const state = this.getState(contactId);
        const missing: string[] = [];

        if (!state.product) missing.push('produto');
        if (!state.quantity) missing.push('quantidade');
        if (!state.address) missing.push('endereço');

        return missing;
    }

    // Cleanup old states (run periodically)
    cleanupOldStates(maxAgeMinutes: number = 60): void {
        const now = new Date();
        for (const [contactId, state] of this.states.entries()) {
            const ageMinutes = (now.getTime() - state.lastUpdated.getTime()) / 60000;
            if (ageMinutes > maxAgeMinutes) {
                this.states.delete(contactId);
            }
        }
    }
}
