import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download, 
  Trash2,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SettingsState {
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    teamUpdates: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    animations: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    activityStatus: boolean;
    dataCollection: boolean;
  };
  language: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      teamUpdates: false,
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      animations: true,
    },
    privacy: {
      profileVisibility: 'public',
      activityStatus: true,
      dataCollection: true,
    },
    language: 'en',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <T extends keyof SettingsState>(
    section: T, 
    key: keyof SettingsState[T], 
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [key]: value
      } as SettingsState[T]
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // TODO: Implement API call to save settings
    toast.success('Settings saved successfully!');
    setHasChanges(false);
  };

  const handleExportData = () => {
    // TODO: Implement data export
    toast.info('Data export feature coming soon!');
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. Deleting your account is PERMANENT and IRREVERSIBLE. Are you absolutely sure?'
      );
      
      if (doubleConfirmed) {
        // TODO: Implement account deletion
        toast.error('Account deletion feature coming soon!');
      }
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
  ];

  return (
    <AppShell onAddTask={() => {}}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your application preferences and account settings
            </p>
          </div>
          
          {hasChanges && (
            <Button onClick={handleSaveSettings} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-xs text-muted-foreground">Receive email updates about your tasks</p>
                  </div>
                  <Button
                    variant={settings.notifications.email ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('notifications', 'email', !settings.notifications.email)}
                  >
                    {settings.notifications.email ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Push Notifications</h4>
                    <p className="text-xs text-muted-foreground">Get browser notifications for important updates</p>
                  </div>
                  <Button
                    variant={settings.notifications.push ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('notifications', 'push', !settings.notifications.push)}
                  >
                    {settings.notifications.push ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Task Reminders</h4>
                    <p className="text-xs text-muted-foreground">Reminders for upcoming due dates</p>
                  </div>
                  <Button
                    variant={settings.notifications.taskReminders ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('notifications', 'taskReminders', !settings.notifications.taskReminders)}
                  >
                    {settings.notifications.taskReminders ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Team Updates</h4>
                    <p className="text-xs text-muted-foreground">Notifications when team members update tasks</p>
                  </div>
                  <Button
                    variant={settings.notifications.teamUpdates ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('notifications', 'teamUpdates', !settings.notifications.teamUpdates)}
                  >
                    {settings.notifications.teamUpdates ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Theme</h4>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={settings.appearance.theme === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('appearance', 'theme', option.value)}
                        className="flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Compact Mode</h4>
                  <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Button
                  variant={settings.appearance.compactMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'compactMode', !settings.appearance.compactMode)}
                >
                  {settings.appearance.compactMode ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Animations</h4>
                  <p className="text-xs text-muted-foreground">Enable smooth transitions and animations</p>
                </div>
                <Button
                  variant={settings.appearance.animations ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'animations', !settings.appearance.animations)}
                >
                  {settings.appearance.animations ? 'On' : 'Off'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Profile Visibility</h4>
                  <p className="text-xs text-muted-foreground">Control who can see your profile</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={settings.privacy.profileVisibility === 'public' ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('privacy', 'profileVisibility', 'public')}
                  >
                    Public
                  </Button>
                  <Button
                    variant={settings.privacy.profileVisibility === 'private' ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('privacy', 'profileVisibility', 'private')}
                  >
                    Private
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Activity Status</h4>
                  <p className="text-xs text-muted-foreground">Show when you're online</p>
                </div>
                <Button
                  variant={settings.privacy.activityStatus ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('privacy', 'activityStatus', !settings.privacy.activityStatus)}
                >
                  {settings.privacy.activityStatus ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Analytics & Data Collection</h4>
                  <p className="text-xs text-muted-foreground">Help improve the app with usage data</p>
                </div>
                <Button
                  variant={settings.privacy.dataCollection ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('privacy', 'dataCollection', !settings.privacy.dataCollection)}
                >
                  {settings.privacy.dataCollection ? 'On' : 'Off'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-sm font-medium mb-3">Language</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {languageOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={settings.language === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSettings(prev => ({ ...prev, language: option.value }));
                        setHasChanges(true);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Export Data</h4>
                  <p className="text-xs text-muted-foreground">Download your tasks and personal data</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <h4 className="text-sm font-medium text-destructive">Delete Account</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default SettingsPage;