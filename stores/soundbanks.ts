import { defineStore } from 'pinia'
import type { Soundbank } from '~/types/audio'

export const useSoundbanksStore = defineStore('soundbanks', {
  state: () => ({
    banks: [] as Soundbank[],
    selectedBankId: ''
  }),
  getters: {
    currentBank(state): Soundbank | undefined {
      return state.banks.find((bank) => bank.id === state.selectedBankId)
    }
  },
  actions: {
    setBanks(banks: Soundbank[]) {
      this.banks = banks
      if (!this.selectedBankId && banks.length > 0) {
        const first = banks[0]
        if (first) {
          this.selectedBankId = first.id
        }
      }
    },
    selectBank(id: string) {
      this.selectedBankId = id
    },
    upsertBank(bank: Soundbank) {
      const index = this.banks.findIndex((b) => b.id === bank.id)
      if (index >= 0) {
        this.banks.splice(index, 1, bank)
      } else {
        this.banks.push(bank)
      }
    }
  }
})
