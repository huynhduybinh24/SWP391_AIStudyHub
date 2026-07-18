import { apiClient } from '@/lib/axios';

export type SystemStatus = "active" | "maintenance" | "incident";

export interface SystemStatusState {
  status: SystemStatus;
  message: string;
  updatedAt: string;
  updatedBy: string;
}

const STORAGE_KEY = 'aiStudyHubSystemStatus';

const getDefaultState = (): SystemStatusState => ({
  status: "active",
  message: "System is operating normally.",
  updatedAt: new Date().toISOString(),
  updatedBy: "Admin"
});

const mapBackendToState = (data: { systemMode: string; systemMessage: string }): SystemStatusState => {
  const mode = data.systemMode;
  let status: SystemStatus = 'active';
  if (mode === 'MAINTENANCE') status = 'maintenance';
  else if (mode === 'INCIDENT') status = 'incident';

  return {
    status,
    message: data.systemMessage || 'System is operating normally.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'System'
  };
};

export const getSystemStatusSync = (): SystemStatusState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SystemStatusState;
    }
  } catch (err) {
    console.error('Failed to parse system status', err);
  }
  return getDefaultState();
};

export const getSystemStatus = async (): Promise<SystemStatusState> => {
  try {
    const response = await apiClient.get('/admin/system/status');
    const newState = mapBackendToState(response.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    window.dispatchEvent(new Event('aiStudyHubSystemStatusUpdated'));
    return newState;
  } catch (err) {
    console.error('Failed to fetch system status from backend', err);
    return getSystemStatusSync();
  }
};

export const updateSystemStatus = async (status: SystemStatus, customMessage?: string): Promise<SystemStatusState> => {
  let message = customMessage || '';
  if (!message) {
    if (status === 'active') message = 'System is operating normally.';
    else if (status === 'maintenance') message = 'Hệ thống đang bảo trì. Vui lòng quay lại sau.';
    else if (status === 'incident') message = 'Hệ thống đang gặp sự cố. Một số tính năng có thể hoạt động không ổn định.';
  }

  const systemMode = status === 'active' ? 'NORMAL' : status === 'maintenance' ? 'MAINTENANCE' : 'INCIDENT';

  const response = await apiClient.put('/admin/system/status', {
    systemMode,
    systemMessage: message
  });

  const newState = mapBackendToState(response.data);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  window.dispatchEvent(new Event('aiStudyHubSystemStatusUpdated'));
  return newState;
};
