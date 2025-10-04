import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, User, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, handleApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const watchedAvatarUrl = watch('avatarUrl');

  const handleAvatarUrlChange = (url: string) => {
    setValue('avatarUrl', url, { shouldDirty: true });
    setAvatarPreview(url || null);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      
      const updateData = {
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      };

      await apiClient.updateProfile(updateData);
      await refreshUser();
      
      toast.success('Profile updated successfully!');
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(handleApiError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const currentAvatarUrl = avatarPreview || watchedAvatarUrl || user?.avatarUrl;

  return (
    <AppShell onAddTask={() => {}}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Picture Section */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={user?.name || 'Profile'}
                      className="w-24 h-24 rounded-full object-cover border-4 border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold border-4 border-border">
                              ${getUserInitials(user?.name || '')}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold border-4 border-border">
                      {getUserInitials(user?.name || '')}
                    </div>
                  )}
                </div>
                
                <div className="w-full space-y-2">
                  <label htmlFor="avatarUrl" className="text-sm font-medium">
                    Avatar URL
                  </label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    {...register('avatarUrl')}
                    onChange={(e) => handleAvatarUrlChange(e.target.value)}
                  />
                  {errors.avatarUrl && (
                    <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your profile picture or leave empty for initials
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    disabled
                    className="bg-muted cursor-not-allowed"
                    {...register('email')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                {/* Account Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Account Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Created</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {user?._id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6">
                  <Button 
                    type="submit" 
                    disabled={!isDirty || isUpdating}
                    className="flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default ProfilePage;