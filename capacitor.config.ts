import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ips.app',
  appName: 'IPS',
  webDir: 'dist',
  server: {
    url: 'http://10.0.11.150:80', // Altere para o endereço do seu servidor de assets
    cleartext: true,  // Permite requisições HTTP inseguras
    androidScheme: 'http'
  }
};

export default config;
