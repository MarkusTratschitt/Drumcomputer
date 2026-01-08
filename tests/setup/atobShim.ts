const toBinaryString = (input: string): string => Buffer.from(input, 'base64').toString('binary')

if (typeof globalThis.atob === 'function') {
  const originalAtob = globalThis.atob.bind(globalThis)
  globalThis.atob = (input: string): string => {
    const normalized = String(input).replace(/\s+/g, '')
    try {
      return originalAtob(normalized)
    } catch {
      return toBinaryString(normalized)
    }
  }
} else {
  globalThis.atob = (input: string): string => toBinaryString(String(input).replace(/\s+/g, ''))
}
