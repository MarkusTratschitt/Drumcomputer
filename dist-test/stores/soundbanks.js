import { defineStore } from 'pinia';
export const useSoundbanksStore = defineStore('soundbanks', {
    state: () => ({
        banks: [],
        selectedBankId: ''
    }),
    getters: {
        currentBank(state) {
            return state.banks.find((bank) => bank.id === state.selectedBankId);
        }
    },
    actions: {
        setBanks(banks) {
            this.banks = banks;
            if (!this.selectedBankId && banks.length > 0) {
                const first = banks[0];
                if (first) {
                    this.selectedBankId = first.id;
                }
            }
        },
        selectBank(id) {
            this.selectedBankId = id;
        },
        upsertBank(bank) {
            const index = this.banks.findIndex((b) => b.id === bank.id);
            if (index >= 0) {
                this.banks.splice(index, 1, bank);
            }
            else {
                this.banks.push(bank);
            }
        }
    }
});
//# sourceMappingURL=soundbanks.js.map