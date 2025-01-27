import { create } from 'zustand';
import type { Device } from '../types';

interface DevicesState {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  updateDeviceStatus: (id: number, status: 1 | 0) => void;
}

export const useDevicesStore = create<DevicesState>()((set) => ({
  devices: [], // Ensure this is an empty array
  setDevices: (devices) => set({ devices }),
  updateDeviceStatus: (id, status) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, status } : device
      ),
    })),
}));