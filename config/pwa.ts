export const pwaConfig = {
  registerType: 'autoUpdate',
  manifest: {
    name: 'Drumcomputer',
    short_name: 'Drumcomputer',
    theme_color: '#121212',
    background_color: '#121212',
    display: 'standalone'
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,svg,ico}']
  }
}
