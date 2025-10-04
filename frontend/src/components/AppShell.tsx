import React, { useState } from 'react';
import { LogOut, User, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  onAddTask: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ children, onAddTask }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsProfileMenuOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsProfileMenuOpen(false);
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getUserDisplayName = (name: string) => {
    if (!name) return 'User';
    return name.length > 20 ? name.substring(0, 20) + '...' : name;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Cleaner</h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Task Management System
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={onAddTask} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>

            <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors"
                >
                  {user?.avatarUrl ? (
                    <div className="relative h-10 w-10">
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        className="h-10 w-10 rounded-full object-cover border-2 border-border"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-border">
                                ${getUserInitials(user?.name || '')}
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-border">
                      {getUserInitials(user?.name || '')}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-3">
                  <p className="text-sm font-semibold leading-none">
                    {getUserDisplayName(user?.name || 'User')}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground break-all">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleProfile}
                  className="cursor-pointer hover:bg-muted transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSettings}
                  className="cursor-pointer hover:bg-muted transition-colors"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer hover:bg-destructive/10 text-destructive focus:text-destructive transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppShell;