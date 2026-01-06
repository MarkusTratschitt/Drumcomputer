export { }

declare global {
  interface ImportMeta {
    readonly client: boolean
    readonly server: boolean
  }
}
