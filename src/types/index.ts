export type DeviceType = 'Roteador' | 'Impressora' | 'Caixa';
export type DeviceStatus = 1 | 0;

export interface Device {
  id: number;
  ip: string;
  name: string;
  type: DeviceType;
  user: string;
  sector: string;
  status: DeviceStatus;
}

export interface Router extends Device {
  login_username: string;
  login_password: string;
  wifi_ssid: string;
  wifi_password: string;
  hidden: number;
}

export interface Printer extends Device {
  model: string;
  status: DeviceStatus; 
}

export interface Box extends Device {
  power_status: number;
  device_id: number;
  ip: string;
  name: string;
}

export interface User {
  id: number;
  username: string;
  token?: string;
}