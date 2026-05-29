import React, { useState, useEffect } from 'react';

interface SettingsProps {
  onClose: () => void;
}

interface UserSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  autoSubmitDeck: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    animationsEnabled: true,
    theme: 'light',
    notificationsEnabled: true,
    autoSubmitDeck: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('urbanIQ_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('urbanIQ_settings', JSON.stringify(newSettings));
  };

  const handleToggle = (key: keyof UserSettings) => {
    saveSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    saveSettings({
      ...settings,
      theme
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        maxWidth: 400,
        width: '100%',
        padding: 32,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: '#1a1a1a',
            fontFamily: 'Cinzel, serif'
          }}>
            ⚙️ Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#999',
              padding: 4
            }}
          >
            ×
          </button>
        </div>

        {/* Settings Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sound */}
          <SettingToggle
            label="Sound Effects"
            description="Play sounds during gameplay"
            enabled={settings.soundEnabled}
            onToggle={() => handleToggle('soundEnabled')}
          />

          {/* Animations */}
          <SettingToggle
            label="Animations"
            description="Enable UI animations"
            enabled={settings.animationsEnabled}
            onToggle={() => handleToggle('animationsEnabled')}
          />

          {/* Notifications */}
          <SettingToggle
            label="Notifications"
            description="Get notified about daily challenges"
            enabled={settings.notificationsEnabled}
            onToggle={() => handleToggle('notificationsEnabled')}
          />

          {/* Auto Submit */}
          <SettingToggle
            label="Auto-Submit Deck"
            description="Automatically submit battle deck when ready"
            enabled={settings.autoSubmitDeck}
            onToggle={() => handleToggle('autoSubmitDeck')}
          />

          {/* Theme Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 8
            }}>
              Theme
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <ThemeButton
                label="Light"
                active={settings.theme === 'light'}
                onClick={() => handleThemeChange('light')}
              />
              <ThemeButton
                label="Dark"
                active={settings.theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              border: 'none',
              background: '#0060A9',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  enabled,
  onToggle
}) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  }}>
    <div>
      <label style={{
        display: 'block',
        fontSize: 14,
        fontWeight: 600,
        color: '#1a1a1a',
        marginBottom: 4
      }}>
        {label}
      </label>
      <p style={{
        fontSize: 12,
        color: '#666',
        margin: 0
      }}>
        {description}
      </p>
    </div>
    <button
      onClick={onToggle}
      style={{
        width: 48,
        height: 28,
        background: enabled ? '#0060A9' : '#e0e0e0',
        borderRadius: 14,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: enabled ? 24 : 2,
        width: 24,
        height: 24,
        background: 'white',
        borderRadius: '50%',
        transition: 'left 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </button>
  </div>
);

interface ThemeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '12px',
      borderRadius: 8,
      border: active ? '2px solid #0060A9' : '2px solid #e0e0e0',
      background: active ? 'rgba(0,96,169,0.1)' : 'white',
      color: active ? '#0060A9' : '#666',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
  >
    {label}
  </button>
);