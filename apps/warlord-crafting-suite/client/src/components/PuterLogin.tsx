import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  isPuterAvailable, 
  signInWithPuter, 
  signOutFromPuter,
  saveCharacterToPuter,
  getCharactersFromPuter,
  deleteCharacterFromPuter,
  generateUUID,
  registerGuestAccount,
  loginGuestAccount,
  getCurrentGuest,
  logoutGuest,
  getGuestCharacters,
  saveGuestCharacter,
  deleteGuestCharacter,
  resetGuestPassword,
  exportGuestData,
  downloadExport,
  type PuterUser,
  type GrudgeCharacter,
  type GuestAccount,
} from '@/lib/puter';
import { toast } from '@/hooks/use-toast';
import { LogIn, LogOut, User, Plus, Trash2, Shield, Loader2, UserPlus, Eye, EyeOff, KeyRound, Download } from 'lucide-react';

interface PuterLoginProps {
  onCharacterSelect: (character: GrudgeCharacter) => void;
  selectedCharacter?: GrudgeCharacter | null;
}

import { CLASSES } from '@/lib/gameData';

const LEGACY_PROFESSION_ICONS: Record<string, string> = {
  'Miner': '⛏️',
  'Forester': '🌲',
  'Mystic': '🔮',
  'Chef': '👨‍🍳',
  'Engineer': '🔧',
};

export function PuterLogin({ onCharacterSelect, selectedCharacter }: PuterLoginProps) {
  const [puterUser, setPuterUser] = useState<PuterUser | null>(null);
  const [guestUser, setGuestUser] = useState<GuestAccount | null>(null);
  const [characters, setCharacters] = useState<GrudgeCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterClass, setNewCharacterClass] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Guest auth state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [guestUsername, setGuestUsername] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for existing guest session first
    const existingGuest = getCurrentGuest();
    if (existingGuest) {
      setGuestUser(existingGuest);
      await loadGuestCharacters(existingGuest.id);
      return;
    }

    // Then check Puter auth
    if (isPuterAvailable()) {
      try {
        const { puter } = window;
        if (puter.auth.isSignedIn()) {
          const user = await puter.auth.getUser();
          setPuterUser(user);
          await loadPuterCharacters(user.uuid);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
  };

  const loadPuterCharacters = async (puterUuid: string) => {
    try {
      const chars = await getCharactersFromPuter(puterUuid);
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  const loadGuestCharacters = async (guestId: string) => {
    try {
      const chars = await getGuestCharacters(guestId);
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load guest characters:', error);
    }
  };

  const handlePuterSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithPuter();
      if (user) {
        setPuterUser(user);
        await loadPuterCharacters(user.uuid);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestRegister = async () => {
    if (!guestUsername.trim() || !guestPassword.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    
    try {
      const result = await registerGuestAccount(guestUsername.trim(), guestPassword);
      if (result.success && result.account) {
        setGuestUser(result.account);
        setGuestUsername('');
        setGuestPassword('');
        await loadGuestCharacters(result.account.id);
      } else {
        setAuthError(result.error || 'Registration failed');
      }
    } catch (error) {
      setAuthError('Registration failed');
      console.error('Guest register failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!guestUsername.trim() || !guestPassword.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    
    try {
      const result = await loginGuestAccount(guestUsername.trim(), guestPassword);
      if (result.success && result.account) {
        setGuestUser(result.account);
        setGuestUsername('');
        setGuestPassword('');
        await loadGuestCharacters(result.account.id);
      } else {
        setAuthError(result.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('Login failed');
      console.error('Guest login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      if (puterUser) {
        await signOutFromPuter();
        setPuterUser(null);
      }
      if (guestUser) {
        logoutGuest();
        setGuestUser(null);
      }
      setCharacters([]);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCharacter = async () => {
    const userId = puterUser?.uuid || guestUser?.id;
    if (!userId || !newCharacterName.trim() || !newCharacterClass) return;

    setIsCreating(true);
    try {
      const newCharacter: GrudgeCharacter = {
        id: generateUUID(),
        puterUuid: userId,
        name: newCharacterName.trim(),
        classId: newCharacterClass,
        level: 1,
        experience: 0,
        gold: 1000,
        skillPoints: 5
      };

      if (puterUser) {
        await saveCharacterToPuter(newCharacter);
      } else if (guestUser) {
        await saveGuestCharacter(guestUser.id, newCharacter);
      }
      
      setCharacters(prev => [...prev, newCharacter]);
      setNewCharacterName('');
      setNewCharacterClass('');
      setShowCreateForm(false);
      onCharacterSelect(newCharacter);
    } catch (error) {
      console.error('Failed to create character:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      if (puterUser) {
        await deleteCharacterFromPuter(characterId);
      } else if (guestUser) {
        await deleteGuestCharacter(guestUser.id, characterId);
      }
      setCharacters(prev => prev.filter(c => c.id !== characterId));
    } catch (error) {
      console.error('Failed to delete character:', error);
    }
  };

  const isLoggedIn = puterUser || guestUser;
  const currentUsername = puterUser?.username || guestUser?.username;

  const handlePasswordChange = async () => {
    if (!guestUser) return;
    
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordChangeError('Password must be at least 4 characters');
      return;
    }

    setIsChangingPassword(true);
    setPasswordChangeError('');

    const result = await resetGuestPassword(guestUser.username, newPassword, currentPassword);
    
    setIsChangingPassword(false);

    if (result.success) {
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordChangeError(result.error || 'Failed to change password');
    }
  };

  const handleExportData = async () => {
    if (!guestUser) return;

    const data = await exportGuestData(guestUser.id);
    if (data) {
      downloadExport(data);
      toast({ title: 'Export Complete', description: 'Your character data has been downloaded.' });
    } else {
      toast({ title: 'Export Failed', description: 'Could not export your data.', variant: 'destructive' });
    }
  };

  // Render character management (when logged in)
  const renderCharacterSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[hsl(43_70%_65%)] font-heading">Your Characters</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-[hsl(43_85%_55%)] hover:text-[hsl(43_90%_70%)]"
          data-testid="button-toggle-create"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {showCreateForm && (
        <div className="p-4 stone-panel rounded border-2 border-[hsl(43_40%_30%)] space-y-3">
          <Input
            placeholder="Character Name"
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] placeholder:text-[hsl(45_15%_40%)]"
            data-testid="input-character-name"
          />
          <Select value={newCharacterClass} onValueChange={setNewCharacterClass}>
            <SelectTrigger className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]" data-testid="select-class">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent className="fantasy-panel border-[hsl(43_50%_35%)]">
              {CLASSES.map(cls => (
                <SelectItem key={cls.id} value={cls.id} className="text-[hsl(45_30%_80%)] focus:bg-[hsl(225_25%_20%)] focus:text-[hsl(43_85%_65%)]">
                  <span className="flex items-center gap-2">
                    <span>{cls.icon}</span>
                    <span>{cls.name}</span>
                    <span className="text-xs opacity-60">({cls.archetype})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreateCharacter}
            disabled={isCreating || !newCharacterName.trim() || !newCharacterClass}
            className="w-full"
            data-testid="button-create-character"
          >
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Character
          </Button>
        </div>
      )}

      {characters.length === 0 ? (
        <p className="text-sm text-[hsl(45_20%_50%)] text-center py-4 font-body">
          No characters yet. Create one to start!
        </p>
      ) : (
        <div className="space-y-2">
          {characters.map(char => {
            const cls = CLASSES.find(c => c.id === char.classId);
            const isSelected = selectedCharacter?.id === char.id;
            const displayIcon = cls?.icon || (char.profession ? LEGACY_PROFESSION_ICONS[char.profession] : null) || '⚔️';
            const displayClass = cls?.name || char.profession || 'Adventurer';
            
            return (
              <div
                key={char.id}
                className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 border-2 ${
                  isSelected 
                    ? 'bg-[hsl(225_25%_18%)] border-[hsl(43_60%_45%)]' 
                    : 'stone-panel border-[hsl(43_30%_25%)] hover:border-[hsl(43_50%_40%)]'
                }`}
                onClick={() => onCharacterSelect(char)}
                data-testid={`card-character-${char.id}`}
                style={isSelected ? {boxShadow: '0 0 12px hsl(43 85% 55% / 0.3)'} : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{displayIcon}</span>
                  <div>
                    <p className="font-heading font-medium text-[hsl(43_85%_70%)]">{char.name}</p>
                    <p className="text-xs text-[hsl(45_20%_55%)] font-body">
                      Level {char.level} {displayClass} • {char.gold}g
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="text-xs text-[hsl(43_85%_55%)] font-heading font-bold tracking-wide">ACTIVE</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCharacter(char.id);
                    }}
                    className="text-[hsl(45_15%_45%)] hover:text-[hsl(0_65%_55%)]"
                    data-testid={`button-delete-${char.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[hsl(43_85%_55%)]" />
          {isLoggedIn ? 'Your Characters' : 'Sign In to Play'}
        </CardTitle>
        <CardDescription className="text-[hsl(45_15%_55%)]">
          {isLoggedIn 
            ? `Logged in as ${currentUsername}` 
            : 'Create a guest account or sign in with Puter'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isLoggedIn ? (
          <div className="space-y-4">
            <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-3 mt-4">
                <div>
                  <Label className="text-[hsl(43_70%_65%)]">Username</Label>
                  <Input
                    placeholder="Enter username"
                    value={guestUsername}
                    onChange={(e) => setGuestUsername(e.target.value)}
                    className="mt-1 inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                    data-testid="input-login-username"
                  />
                </div>
                <div>
                  <Label className="text-[hsl(43_70%_65%)]">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                      className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] pr-10"
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(45_20%_50%)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {authError && <p className="text-sm text-[hsl(0_65%_55%)]">{authError}</p>}
                <Button 
                  onClick={handleGuestLogin} 
                  disabled={isLoading}
                  className="w-full"
                  data-testid="button-guest-login"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                  Login
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-3 mt-4">
                <div>
                  <Label className="text-[hsl(43_70%_65%)]">Username</Label>
                  <Input
                    placeholder="Choose username (3-20 chars)"
                    value={guestUsername}
                    onChange={(e) => setGuestUsername(e.target.value)}
                    className="mt-1 inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                    data-testid="input-register-username"
                  />
                </div>
                <div>
                  <Label className="text-[hsl(43_70%_65%)]">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Choose password (min 4 chars)"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuestRegister()}
                      className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] pr-10"
                      data-testid="input-register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(45_20%_50%)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {authError && <p className="text-sm text-[hsl(0_65%_55%)]">{authError}</p>}
                <Button 
                  onClick={handleGuestRegister} 
                  disabled={isLoading}
                  className="w-full"
                  data-testid="button-guest-register"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>

            {isPuterAvailable() && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[hsl(43_30%_25%)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[hsl(225_28%_12%)] px-2 text-[hsl(45_15%_45%)]">Or</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePuterSignIn} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-[hsl(43_40%_30%)] text-[hsl(45_30%_80%)]"
                  data-testid="button-puter-signin"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                  Sign in with Puter
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 inset-panel rounded border-2 border-[hsl(43_40%_30%)]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[hsl(43_85%_55%)]" />
                <span className="text-sm text-[hsl(45_30%_80%)] font-heading">{currentUsername}</span>
                <span className="text-xs text-[hsl(45_15%_45%)]">
                  {guestUser ? 'Guest' : 'Puter'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {guestUser && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleExportData}
                      className="text-[hsl(45_20%_50%)] hover:text-[hsl(43_85%_65%)]"
                      title="Export Data"
                      data-testid="button-export"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-[hsl(45_20%_50%)] hover:text-[hsl(43_85%_65%)]"
                      title="Change Password"
                      data-testid="button-change-password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-[hsl(45_20%_50%)] hover:text-[hsl(0_65%_55%)]"
                  data-testid="button-signout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showPasswordChange && guestUser && (
              <div className="p-4 stone-panel rounded border-2 border-[hsl(43_40%_30%)] space-y-3">
                <Label className="text-[hsl(43_70%_65%)] font-heading">Change Password</Label>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                  data-testid="input-current-password"
                />
                <Input
                  type="password"
                  placeholder="New password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                  data-testid="input-new-password"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                  data-testid="input-confirm-new-password"
                />
                {passwordChangeError && (
                  <p className="text-sm text-[hsl(0_65%_55%)]">{passwordChangeError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordChangeError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="flex-1"
                    data-testid="button-save-password"
                  >
                    {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>
            )}

            {renderCharacterSection()}
          </>
        )}
      </CardContent>
    </Card>
  );
}
