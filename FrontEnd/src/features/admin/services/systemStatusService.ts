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
  return getSystemStatusSync();
};

export const updateSystemStatus = async (status: SystemStatus, customMessage?: string): Promise<SystemStatusState> => {
  let message = customMessage || '';
  if (!message) {
    if (status === 'active') message = 'System is operating normally.';
    else if (status === 'maintenance') message = 'Hệ thống đang bảo trì. Vui lòng quay lại sau.';
    else if (status === 'incident') message = 'Hệ thống đang gặp sự cố. Một số tính năng có thể hoạt động không ổn định.';
  }

  const newState: SystemStatusState = {
    status,
    message,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin'
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  window.dispatchEvent(new Event('aiStudyHubSystemStatusUpdated'));
  return newState;
};
