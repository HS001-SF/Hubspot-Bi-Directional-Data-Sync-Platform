'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Camera, Save, X, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      // Only update avatar preview if there's no file selected (not uploading)
      if (!avatarFile) {
        setAvatarPreview(session.user.image || '');
      }
    }
  }, [session, avatarFile]);

  // Get user initials
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to upload avatar');
        setIsAvatarLoading(false);
        return;
      }

      toast.success('Avatar updated successfully');

      // Clear preview and file
      setAvatarFile(null);
      setAvatarPreview('');

      // Update session with new avatar - this will fetch fresh data from DB
      await updateSession();
    } catch (err) {
      toast.error('An error occurred while uploading avatar');
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // Remove avatar
  const handleAvatarRemove = async () => {
    setIsAvatarLoading(true);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to remove avatar');
        setIsAvatarLoading(false);
        return;
      }

      toast.success('Avatar removed successfully');
      setAvatarPreview('');
      setAvatarFile(null);

      // Update session
      await updateSession();
    } catch (err) {
      toast.error('An error occurred while removing avatar');
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // Update profile
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const updates: any = {};

    if (name !== session?.user?.name) {
      updates.name = name;
    }

    if (email !== session?.user?.email) {
      updates.email = email;
    }

    // Password change
    if (showPasswordSection && newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (!currentPassword) {
        toast.error('Current password is required');
        setIsLoading(false);
        return;
      }

      updates.currentPassword = currentPassword;
      updates.newPassword = newPassword;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      toast.error('No changes to save');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update profile');
        setIsLoading(false);
        return;
      }

      toast.success('Profile updated successfully');

      // Update session with new data
      await updateSession();

      // Reset password fields
      if (showPasswordSection) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }
    } catch (err) {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture or remove the current one
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {(avatarPreview || session?.user?.image) && (
                  <AvatarImage src={avatarPreview || session?.user?.image || undefined} />
                )}
                <AvatarFallback className="text-2xl">
                  {getInitials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarLoading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max file size 5MB. Images will be compressed and resized to 200x200.
              </p>
              <div className="flex gap-2">
                {avatarFile && (
                  <Button
                    onClick={handleAvatarUpload}
                    disabled={isAvatarLoading}
                    size="sm"
                  >
                    {isAvatarLoading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Avatar
                      </>
                    )}
                  </Button>
                )}
                {avatarPreview && !avatarFile && (
                  <Button
                    variant="destructive"
                    onClick={handleAvatarRemove}
                    disabled={isAvatarLoading}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <form onSubmit={handleProfileUpdate}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              {/* Change Password Section */}
              {!showPasswordSection ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordSection(true)}
                  disabled={isLoading}
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Change Password</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Passwords
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Passwords
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono">{session?.user?.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium">{session?.user?.role || 'USER'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Account Status</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
