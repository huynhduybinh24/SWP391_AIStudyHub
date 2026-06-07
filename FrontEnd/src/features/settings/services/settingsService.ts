export interface UserSettings {
  account: {
    email: string;
    name: string;
    language: string;
    timezone: string;
  };
  security: {
    isTwoFactorEnabled: boolean;
    lastPasswordChanged: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS = (email: string, name: string): UserSettings => ({
  account: {
    email: email || 'student@university.edu',
    name: name || 'Alex Morgan',
    language: 'en',
    timezone: 'Pacific Time (PT)',
  },
  security: {
    isTwoFactorEnabled: false,
    lastPasswordChanged: '3 months ago',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
  },
  theme: 'light',
});

export const settingsService = {
  getSettings(userEmail: string): UserSettings {
    if (!userEmail) return DEFAULT_SETTINGS('', '');
    try {
      const stored = localStorage.getItem(`aiStudyHubSettings:${userEmail.toLowerCase()}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Seed initial from current active session if emails match
      const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser');
      let name = 'Alex Morgan';
      if (currentUserStr) {
        try {
          const user = JSON.parse(currentUserStr);
          if (user.email?.toLowerCase() === userEmail.toLowerCase()) {
            name = user.name || name;
          }
        } catch (e) {}
      }
      
      const initial = DEFAULT_SETTINGS(userEmail, name);
      localStorage.setItem(`aiStudyHubSettings:${userEmail.toLowerCase()}`, JSON.stringify(initial));
      return initial;
    } catch (e) {
      console.error('Failed to get user settings', e);
      return DEFAULT_SETTINGS(userEmail, 'Alex Morgan');
    }
  },

  updateSettings(userEmail: string, payload: Partial<UserSettings>): UserSettings {
    if (!userEmail) return DEFAULT_SETTINGS('', '');
    try {
      const current = this.getSettings(userEmail);
      
      const updated = {
        ...current,
        ...payload,
        account: payload.account ? { ...current.account, ...payload.account } : current.account,
        security: payload.security ? { ...current.security, ...payload.security } : current.security,
        notifications: payload.notifications ? { ...current.notifications, ...payload.notifications } : current.notifications,
      };

      localStorage.setItem(`aiStudyHubSettings:${userEmail.toLowerCase()}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to update user settings', e);
      return DEFAULT_SETTINGS(userEmail, 'Alex Morgan');
    }
  }
};
