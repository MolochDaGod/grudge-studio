import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  getGuestAccounts, 
  getGuestCharacters,
  deleteGuestAccount,
  adminResetGuestPassword,
  type GuestAccount,
  type GrudgeCharacter,
  isPuterAvailable,
} from '@/lib/puter';
import { CLASSES } from '@/lib/gameData';
import { Shield, Users, Lock, Eye, EyeOff, LogOut, RefreshCw, Trash2, KeyRound, ChevronDown, ChevronRight, Image, Palette, ExternalLink, Cloud, CloudOff, Loader2, Coins, BookOpen, Package, Database, Sword, Shirt, FlaskConical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SPRITE_MANIFEST, ASSET_CATEGORIES, SpriteCategory } from '@/lib/assets';
import { checkWorkerHealth, getCloudManifest, getCloudSpriteUrl, WORKER_ENDPOINT, saveSpriteAssignment, type SpriteAssignment, type SaveResult } from '@/lib/puterSprites';
import { toast } from '@/hooks/use-toast';
import { ALL_RECIPES, RECIPE_STATS } from '@/data/recipes';
import { STARTER_RECIPES_BY_PROFESSION } from '@/data/starterRecipes';
import { RECIPES as CRAFTING_RECIPES, TIERS } from '@/data/crafting';
import { WEAPON_SETS } from '@/data/tieredCrafting';
import { CRAFTING_MATERIALS } from '@/data/materials';
import { RECIPE_AUDIT, MATERIAL_VALIDATION } from '@/data/recipeAudit';

const LEGACY_PROFESSION_ICONS: Record<string, string> = {
  'Miner': '⚒️',
  'Forester': '🌲',
  'Mystic': '🔮',
  'Chef': '👨‍🍳',
  'Engineer': '🔧',
};

function getCharacterIcon(char: GrudgeCharacter): string {
  if (char.classId) {
    const classInfo = CLASSES.find(c => c.id === char.classId);
    if (classInfo) return classInfo.icon;
  }
  if (char.profession) {
    const icon = LEGACY_PROFESSION_ICONS[char.profession];
    if (icon) return icon;
  }
  return '⚔️';
}

function getCharacterLabel(char: GrudgeCharacter): string {
  if (char.classId) {
    const classInfo = CLASSES.find(c => c.id === char.classId);
    if (classInfo) return classInfo.name;
  }
  return char.profession || 'Adventurer';
}

interface AccountWithCharacters extends GuestAccount {
  characters?: GrudgeCharacter[];
  expanded?: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<AccountWithCharacters[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset password dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAccountId, setResetAccountId] = useState<string | null>(null);
  const [resetAccountUsername, setResetAccountUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Cloud sprites state
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);
  const [workerVersion, setWorkerVersion] = useState('');
  const [cloudManifest, setCloudManifest] = useState<Record<string, string[]>>({});
  const [cloudSpriteCount, setCloudSpriteCount] = useState(0);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  // Sprite assignment state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSprite, setSelectedSprite] = useState<{
    id: string;
    category: string;
    path: string;
    source: 'local' | 'cloud';
  } | null>(null);
  const [assignmentType, setAssignmentType] = useState<'item' | 'ability' | 'skill' | 'ui' | 'other'>('item');
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentId, setAssignmentId] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        setError('');
        loadAccounts();
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch {
      setError('Authentication failed');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAccounts([]);
  };

  const loadCloudSprites = async () => {
    setIsLoadingCloud(true);
    try {
      const health = await checkWorkerHealth();
      setWorkerOnline(health.status === 'ok');
      setWorkerVersion(health.version || 'unknown');
      
      if (health.status === 'ok') {
        const manifest = await getCloudManifest();
        if (manifest.success) {
          setCloudManifest(manifest.manifest);
          setCloudSpriteCount(manifest.totalSprites);
        }
      }
    } catch (err) {
      console.error('Failed to load cloud sprites:', err);
      setWorkerOnline(false);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const allAccounts = await getGuestAccounts();
      setAccounts(allAccounts.map(a => ({ ...a, expanded: false })));
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = async (accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        if (!acc.expanded && !acc.characters) {
          // Load characters
          getGuestCharacters(accountId).then(chars => {
            setAccounts(p => p.map(a => 
              a.id === accountId ? { ...a, characters: chars, expanded: true } : a
            ));
          });
          return acc;
        }
        return { ...acc, expanded: !acc.expanded };
      }
      return acc;
    }));
  };

  const handleDeleteAccount = async (accountId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete the account "${username}" and all their characters? This cannot be undone.`)) {
      return;
    }

    const result = await deleteGuestAccount(accountId);
    if (result.success) {
      toast({ title: 'Account Deleted', description: `Account "${username}" has been deleted.` });
      loadAccounts();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete account', variant: 'destructive' });
    }
  };

  const openResetDialog = (accountId: string, username: string) => {
    setResetAccountId(accountId);
    setResetAccountUsername(username);
    setNewPassword('');
    setConfirmPassword('');
    setResetDialogOpen(true);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSpriteClick = (id: string, category: string, path: string, source: 'local' | 'cloud') => {
    setSelectedSprite({ id, category, path, source });
    setAssignmentName(id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    setAssignmentId('');
    setAssignmentType('item');
  };

  const handleAssignSprite = async () => {
    if (!selectedSprite || !assignmentName) return;
    
    const assignment: SpriteAssignment = {
      spriteId: selectedSprite.id,
      spriteCategory: selectedSprite.category,
      spritePath: selectedSprite.path,
      spriteSource: selectedSprite.source,
      assignmentType,
      assignmentName,
      assignmentId: assignmentId || undefined,
      assignedAt: new Date().toISOString(),
    };
    
    const result = await saveSpriteAssignment(assignment);
    
    if (!result.success) {
      toast({
        title: 'Failed to Save',
        description: result.error || 'Could not save sprite assignment',
        variant: 'destructive',
      });
      return;
    }
    
    if (result.cloudSync) {
      toast({
        title: 'Sprite Assigned & Synced',
        description: `"${selectedSprite.id}" assigned to ${assignmentType}: ${assignmentName}. Synced to Puter cloud.`,
      });
    } else {
      toast({
        title: 'Saved Locally',
        description: `"${selectedSprite.id}" assigned locally. Connect to Puter for cloud sync.`,
      });
    }
    
    setSelectedSprite(null);
    setAssignmentName('');
    setAssignmentId('');
  };

  const handleResetPassword = async () => {
    if (!resetAccountId || isResetting) return;

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }

    setIsResetting(true);
    const result = await adminResetGuestPassword(resetAccountId, newPassword);
    setIsResetting(false);

    if (result.success) {
      toast({ title: 'Password Reset', description: `Password for "${resetAccountUsername}" has been reset.` });
      setResetDialogOpen(false);
      setResetAccountId(null);
      setResetAccountUsername('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to reset password', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md fantasy-panel border-2 border-[hsl(43_50%_35%)]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(43_85%_55%)] to-[hsl(35_90%_45%)] flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[hsl(225_30%_10%)]" />
            </div>
            <CardTitle className="text-2xl font-uncial gold-text">Admin Panel</CardTitle>
            <CardDescription className="text-[hsl(45_15%_55%)]">
              Enter password to access admin features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] pr-10"
                data-testid="input-admin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(45_20%_50%)] hover:text-[hsl(43_85%_65%)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {error && (
              <p className="text-sm text-[hsl(0_65%_55%)] text-center">{error}</p>
            )}
            
            <Button 
              onClick={handleLogin} 
              className="w-full"
              data-testid="button-admin-login"
            >
              <Shield className="w-4 h-4 mr-2" />
              Access Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-uncial gold-text">Admin Panel</h1>
            <p className="text-[hsl(45_15%_55%)] text-sm mt-1">
              Manage user accounts and view system data
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadAccounts}
              disabled={isLoading}
              data-testid="button-refresh-accounts"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="accounts" className="flex items-center gap-2" data-testid="tab-accounts">
              <Users className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="economy" className="flex items-center gap-2" data-testid="tab-economy">
              <Coins className="w-4 h-4" />
              Economy
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2" data-testid="tab-recipes">
              <BookOpen className="w-4 h-4" />
              Recipes
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2" data-testid="tab-items">
              <Package className="w-4 h-4" />
              Items
            </TabsTrigger>
            <TabsTrigger value="sprites" className="flex items-center gap-2" data-testid="tab-sprites">
              <Image className="w-4 h-4" />
              Sprites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Users className="w-5 h-5" />
                  Registered Guest Accounts
                </CardTitle>
                <CardDescription className="text-[hsl(45_15%_55%)]">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''} registered
                  {isPuterAvailable() ? ' (synced with Puter cloud)' : ' (local storage)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-[hsl(45_20%_50%)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8 text-[hsl(45_20%_50%)]">
                    No guest accounts registered yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div key={account.id} className="border border-[hsl(43_30%_25%)] rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 hover:bg-[hsl(225_25%_15%)] transition-colors cursor-pointer"
                          onClick={() => toggleExpand(account.id)}
                          data-testid={`row-account-${account.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <button className="text-[hsl(45_20%_50%)]">
                              {account.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div>
                              <p className="font-heading text-[hsl(45_30%_80%)]">{account.username}</p>
                              <p className="text-xs text-[hsl(45_15%_50%)]">
                                Created: {new Date(account.createdAt).toLocaleDateString()} | 
                                Last login: {new Date(account.lastLogin).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openResetDialog(account.id, account.username)}
                              className="text-[hsl(45_20%_55%)] hover:text-[hsl(43_85%_65%)]"
                              data-testid={`button-reset-${account.id}`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id, account.username)}
                              className="text-[hsl(45_20%_55%)] hover:text-[hsl(0_65%_55%)]"
                              data-testid={`button-delete-${account.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {account.expanded && (
                          <div className="px-4 pb-3 pt-1 bg-[hsl(225_28%_10%)] border-t border-[hsl(43_30%_20%)]">
                            <p className="text-xs text-[hsl(45_20%_50%)] mb-2">Characters:</p>
                            {account.characters && account.characters.length > 0 ? (
                              <div className="grid gap-2">
                                {account.characters.map(char => (
                                  <div key={char.id} className="flex items-center justify-between p-2 bg-[hsl(225_25%_14%)] rounded border border-[hsl(43_30%_20%)]">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{getCharacterIcon(char)}</span>
                                      <div>
                                        <p className="text-sm text-[hsl(43_85%_70%)]">{char.name}</p>
                                        <p className="text-xs text-[hsl(45_15%_50%)]">
                                          Level {char.level} {getCharacterLabel(char)} | {char.gold}g
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-[hsl(45_15%_45%)] italic">No characters</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Shield className="w-5 h-5" />
                  System Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[hsl(43_30%_20%)]">
                  <span className="text-[hsl(45_15%_55%)]">Puter Available</span>
                  <span className={isPuterAvailable() ? 'text-green-400' : 'text-[hsl(45_20%_50%)]'}>
                    {isPuterAvailable() ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[hsl(43_30%_20%)]">
                  <span className="text-[hsl(45_15%_55%)]">Storage Mode</span>
                  <span className="text-[hsl(45_30%_80%)]">
                    {isPuterAvailable() ? 'Puter KV + LocalStorage' : 'LocalStorage Only'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[hsl(45_15%_55%)]">Total Guest Accounts</span>
                  <span className="text-[hsl(43_85%_65%)] font-bold">{accounts.length}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="economy" className="space-y-6">
            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Coins className="w-5 h-5" />
                  Economy Overview
                </CardTitle>
                <CardDescription className="text-[hsl(45_15%_55%)]">
                  Game economy settings and tier pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-[hsl(225_28%_12%)] border border-amber-600/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-[hsl(45_15%_55%)]">Registered Accounts</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{accounts.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[hsl(225_28%_12%)] border border-blue-600/30">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-[hsl(45_15%_55%)]">Total Recipes</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{RECIPE_STATS.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[hsl(225_28%_12%)] border border-green-600/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-[hsl(45_15%_55%)]">Crafting Materials</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{CRAFTING_MATERIALS.length}</p>
                  </div>
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Price Tiers</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
                  {TIERS.map((tier, i) => (
                    <div key={tier} className="p-2 rounded bg-[hsl(225_25%_15%)] border border-[hsl(43_30%_25%)] text-center">
                      <span className="text-xs text-[hsl(45_20%_50%)]">{tier}</span>
                      <p className="text-sm font-bold text-amber-400">{Math.pow(2, i) * 100}g</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Recipe Acquisition</h3>
                <div className="grid md:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded bg-green-900/20 border border-green-600/30">
                    <p className="text-green-400 font-semibold">{RECIPE_STATS.purchasable} Purchasable</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">Buy from shop for gold</p>
                  </div>
                  <div className="p-3 rounded bg-blue-900/20 border border-blue-600/30">
                    <p className="text-blue-400 font-semibold">{RECIPE_STATS.skillTree} Skill Tree</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">Unlock via profession skills</p>
                  </div>
                  <div className="p-3 rounded bg-purple-900/20 border border-purple-600/30">
                    <p className="text-purple-400 font-semibold">{RECIPE_STATS.dropOnly} Drop Only</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">Rare drops from bosses</p>
                  </div>
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Complete Tiered Recipe Audit</h3>
                <div className="p-4 rounded-lg bg-gradient-to-r from-[hsl(225_28%_12%)] to-[hsl(225_28%_15%)] border-2 border-emerald-600/50 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-emerald-400">
                      {RECIPE_AUDIT.totals.exceeds ? '✅' : '❌'} Recipe Target Status
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {RECIPE_AUDIT.totals.percentage}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-[hsl(45_30%_80%)]">{RECIPE_AUDIT.totals.allTieredRecipes}</p>
                      <p className="text-xs text-[hsl(45_20%_50%)]">Total Tiered Recipes</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-400">{RECIPE_AUDIT.totals.baseItems}</p>
                      <p className="text-xs text-[hsl(45_20%_50%)]">Base Items</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-400">{RECIPE_AUDIT.totals.target}</p>
                      <p className="text-xs text-[hsl(45_20%_50%)]">Target Goal</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-red-900/20 border border-red-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sword className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-semibold">Weapons</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{RECIPE_AUDIT.weapons.tiered}</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">{RECIPE_AUDIT.weapons.base} base × 8 tiers</p>
                  </div>
                  <div className="p-3 rounded bg-blue-900/20 border border-blue-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Shirt className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Armor</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{RECIPE_AUDIT.armor.tiered}</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">{RECIPE_AUDIT.armor.sets} sets × {RECIPE_AUDIT.armor.slots} slots × {RECIPE_AUDIT.armor.materials} mats × 8 tiers</p>
                  </div>
                  <div className="p-3 rounded bg-green-900/20 border border-green-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <FlaskConical className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">Consumables</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{RECIPE_AUDIT.consumables.total}</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">Bandages, Grenades, Traps, etc.</p>
                  </div>
                  <div className="p-3 rounded bg-purple-900/20 border border-purple-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-semibold">Starter</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{RECIPE_AUDIT.starter.total}</p>
                    <p className="text-xs text-[hsl(45_20%_50%)]">Free T0-T1 recipes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <BookOpen className="w-5 h-5" />
                  Recipe Database
                </CardTitle>
                <CardDescription className="text-[hsl(45_15%_55%)]">
                  {ALL_RECIPES.length} recipes across all professions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Starter Recipes (Free)</h3>
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {Object.entries(STARTER_RECIPES_BY_PROFESSION).map(([profession, recipes]) => (
                    <div key={profession} className="p-3 rounded-lg bg-[hsl(225_28%_12%)] border border-[hsl(43_30%_25%)]">
                      <h4 className="text-[hsl(43_85%_65%)] font-semibold mb-2 text-sm">{profession}</h4>
                      <div className="space-y-1">
                        {recipes.map(r => (
                          <div key={r.id} className="text-xs text-[hsl(45_20%_60%)] flex items-center gap-1">
                            <span className={r.type === 'Refining' ? 'text-amber-400' : r.type === 'Utility' ? 'text-green-400' : r.type === 'Armor' ? 'text-blue-400' : 'text-purple-400'}>
                              {r.type === 'Refining' ? '⚒️' : r.type === 'Utility' ? '🧪' : r.type === 'Armor' ? '🛡️' : '🧪'}
                            </span>
                            {r.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Recipes by Category</h3>
                <div className="grid md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded bg-[hsl(225_25%_15%)] border border-red-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sword className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-semibold">Weapons</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{ALL_RECIPES.filter(r => r.category === 'weapon').length}</p>
                  </div>
                  <div className="p-3 rounded bg-[hsl(225_25%_15%)] border border-blue-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Shirt className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Armor</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{ALL_RECIPES.filter(r => r.category === 'armor').length}</p>
                  </div>
                  <div className="p-3 rounded bg-[hsl(225_25%_15%)] border border-green-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <FlaskConical className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">Consumables</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{ALL_RECIPES.filter(r => r.category === 'consumable').length}</p>
                  </div>
                  <div className="p-3 rounded bg-[hsl(225_25%_15%)] border border-purple-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-semibold">Materials</span>
                    </div>
                    <p className="text-2xl font-bold text-[hsl(45_30%_80%)]">{ALL_RECIPES.filter(r => r.category === 'material').length}</p>
                  </div>
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Crafting Recipes ({CRAFTING_RECIPES.length})</h3>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-[hsl(43_30%_25%)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[hsl(225_28%_12%)] sticky top-0">
                      <tr className="text-left text-[hsl(45_20%_55%)]">
                        <th className="p-2">Recipe</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Tier</th>
                        <th className="p-2">Station</th>
                        <th className="p-2">Success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CRAFTING_RECIPES.slice(0, 25).map(r => (
                        <tr key={r.id} className="border-t border-[hsl(43_30%_20%)] hover:bg-[hsl(225_25%_15%)]">
                          <td className="p-2 text-[hsl(45_30%_80%)]">{r.name}</td>
                          <td className="p-2 text-[hsl(45_20%_55%)]">{r.type}</td>
                          <td className="p-2 text-amber-400">{r.tier}</td>
                          <td className="p-2 text-[hsl(45_20%_55%)]">{r.station}</td>
                          <td className="p-2 text-green-400">{r.chance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {CRAFTING_RECIPES.length > 25 && (
                    <div className="p-2 text-center text-xs text-[hsl(45_20%_50%)] bg-[hsl(225_28%_10%)]">
                      ...and {CRAFTING_RECIPES.length - 25} more recipes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Database className="w-5 h-5" />
                  Item Database
                </CardTitle>
                <CardDescription className="text-[hsl(45_15%_55%)]">
                  Weapons, armor, and materials across all tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Weapon Sets ({Object.keys(WEAPON_SETS).length} categories)</h3>
                <div className="grid md:grid-cols-3 gap-3 mb-6">
                  {Object.entries(WEAPON_SETS).slice(0, 9).map(([category, weapons]) => (
                    <div key={category} className="p-3 rounded-lg bg-[hsl(225_28%_12%)] border border-[hsl(43_30%_25%)]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[hsl(43_85%_65%)] font-semibold text-sm capitalize">{category}</h4>
                        <span className="text-xs text-[hsl(45_20%_50%)]">{weapons.length} items</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {weapons.slice(0, 4).map(w => (
                          <span key={w.id} className="text-xs px-1.5 py-0.5 bg-[hsl(225_25%_18%)] rounded text-[hsl(45_20%_60%)]">
                            {w.name.split(' ')[0]}
                          </span>
                        ))}
                        {weapons.length > 4 && (
                          <span className="text-xs text-[hsl(45_15%_50%)]">+{weapons.length - 4}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-[hsl(43_85%_65%)] font-semibold mb-3">Crafting Materials ({CRAFTING_MATERIALS.length})</h3>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-[hsl(43_30%_25%)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[hsl(225_28%_12%)] sticky top-0">
                      <tr className="text-left text-[hsl(45_20%_55%)]">
                        <th className="p-2">Material</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Tier</th>
                        <th className="p-2">Profession</th>
                        <th className="p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CRAFTING_MATERIALS.slice(0, 20).map(m => (
                        <tr key={m.id} className="border-t border-[hsl(43_30%_20%)] hover:bg-[hsl(225_25%_15%)]">
                          <td className="p-2 text-[hsl(45_30%_80%)]">{m.icon} {m.name}</td>
                          <td className="p-2 text-[hsl(45_20%_55%)] capitalize">{m.category}</td>
                          <td className="p-2 text-amber-400">T{m.tier}</td>
                          <td className="p-2 text-[hsl(45_20%_55%)]">{m.gatheredBy || '—'}</td>
                          <td className="p-2 text-green-400">{m.tier * 50}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {CRAFTING_MATERIALS.length > 20 && (
                    <div className="p-2 text-center text-xs text-[hsl(45_20%_50%)] bg-[hsl(225_28%_10%)]">
                      ...and {CRAFTING_MATERIALS.length - 20} more materials
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sprites" className="space-y-6">
            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                      <Cloud className="w-5 h-5" />
                      Puter Cloud Sprites
                    </CardTitle>
                    <CardDescription className="text-[hsl(45_15%_55%)]">
                      {workerOnline === null ? 'Checking...' : workerOnline ? `${cloudSpriteCount} sprites in cloud storage` : 'Worker offline'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadCloudSprites}
                      disabled={isLoadingCloud}
                      className="border-[hsl(43_40%_35%)] text-[hsl(43_85%_65%)]"
                      data-testid="button-refresh-cloud"
                    >
                      {isLoadingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                    <a 
                      href="/sprites" 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[hsl(43_85%_55%)] to-[hsl(35_90%_45%)] text-[hsl(225_30%_10%)] text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
                      data-testid="link-sprite-gallery"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Gallery
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 rounded-lg bg-[hsl(225_28%_12%)] border border-[hsl(43_30%_25%)]">
                  <div className="flex items-center gap-2 mb-2">
                    {workerOnline === null ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : workerOnline ? (
                      <Cloud className="w-4 h-4 text-green-400" />
                    ) : (
                      <CloudOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-semibold ${workerOnline === null ? 'text-amber-400' : workerOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {workerOnline === null ? 'Checking Worker...' : workerOnline ? 'Worker Online' : 'Worker Offline'}
                    </span>
                    {workerVersion && workerOnline && (
                      <span className="text-xs text-[hsl(45_15%_50%)]">v{workerVersion}</span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(45_20%_50%)] break-all">{WORKER_ENDPOINT}</p>
                </div>

                {Object.keys(cloudManifest).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(cloudManifest).map(([category, items]) => {
                      const isExpanded = expandedCategories.has(`cloud-${category}`);
                      const displayItems = isExpanded ? items : items.slice(0, 8);
                      return (
                        <div key={category} className="border border-[hsl(43_30%_25%)] rounded-lg p-3">
                          <button
                            onClick={() => toggleCategory(`cloud-${category}`)}
                            className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                            data-testid={`button-toggle-cloud-${category}`}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[hsl(43_85%_65%)]" /> : <ChevronRight className="w-4 h-4 text-[hsl(43_85%_65%)]" />}
                              <h4 className="text-[hsl(43_85%_65%)] font-semibold capitalize">{category}</h4>
                            </div>
                            <span className="text-xs text-[hsl(45_20%_50%)]">{items.length} sprites</span>
                          </button>
                          <div className="flex flex-wrap gap-2">
                            {displayItems.map(itemId => (
                              <button
                                key={itemId}
                                onClick={() => handleSpriteClick(itemId, category, getCloudSpriteUrl(category, itemId), 'cloud')}
                                className="w-12 h-12 rounded bg-[hsl(225_25%_18%)] border border-[hsl(43_30%_30%)] flex items-center justify-center overflow-hidden hover:border-[hsl(43_85%_65%)] hover:scale-105 transition-all cursor-pointer"
                                title={`${itemId} - Click to assign`}
                                data-testid={`sprite-cloud-${category}-${itemId}`}
                              >
                                <img 
                                  src={getCloudSpriteUrl(category, itemId)}
                                  alt={itemId}
                                  className="w-10 h-10 object-contain pointer-events-none"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </button>
                            ))}
                            {!isExpanded && items.length > 8 && (
                              <button
                                onClick={() => toggleCategory(`cloud-${category}`)}
                                className="w-12 h-12 rounded bg-[hsl(225_25%_15%)] border border-[hsl(43_30%_25%)] flex items-center justify-center hover:border-[hsl(43_85%_65%)] hover:bg-[hsl(225_25%_20%)] transition-all cursor-pointer"
                                data-testid={`button-expand-cloud-${category}`}
                              >
                                <span className="text-xs text-[hsl(45_20%_50%)]">+{items.length - 8}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : workerOnline === false ? (
                  <div className="text-center py-6 text-[hsl(45_20%_50%)]">
                    <CloudOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Worker offline. Deploy with: <code className="text-xs bg-[hsl(225_28%_15%)] px-2 py-1 rounded">puter worker:create grudge-sprites ./puter/workers/sprite-generator.js</code></p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[hsl(45_20%_50%)]">
                    <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No sprites in cloud storage yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Palette className="w-5 h-5" />
                  Local Sprites (Built-in)
                </CardTitle>
                <CardDescription className="text-[hsl(45_15%_55%)]">
                  {Object.values(SPRITE_MANIFEST).flat().length} sprites across {Object.keys(SPRITE_MANIFEST).length} categories • Click any sprite to assign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Object.keys(SPRITE_MANIFEST) as SpriteCategory[]).map(category => {
                    const items = SPRITE_MANIFEST[category];
                    const categoryPath = ASSET_CATEGORIES.sprites[category];
                    const isExpanded = expandedCategories.has(`local-${category}`);
                    const displayItems = isExpanded ? items : items.slice(0, 8);
                    return (
                      <div key={category} className="border border-[hsl(43_30%_25%)] rounded-lg p-3">
                        <button
                          onClick={() => toggleCategory(`local-${category}`)}
                          className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                          data-testid={`button-toggle-${category}`}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[hsl(43_85%_65%)]" /> : <ChevronRight className="w-4 h-4 text-[hsl(43_85%_65%)]" />}
                            <h4 className="text-[hsl(43_85%_65%)] font-semibold capitalize">{category}</h4>
                          </div>
                          <span className="text-xs text-[hsl(45_20%_50%)]">{items.length} sprites</span>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          {displayItems.map(itemId => (
                            <button
                              key={itemId}
                              onClick={() => handleSpriteClick(itemId, category, `${categoryPath}/${itemId}.png`, 'local')}
                              className="w-12 h-12 rounded bg-[hsl(225_25%_18%)] border border-[hsl(43_30%_30%)] flex items-center justify-center overflow-hidden hover:border-[hsl(43_85%_65%)] hover:scale-105 transition-all cursor-pointer"
                              title={`${itemId} - Click to assign`}
                              data-testid={`sprite-local-${category}-${itemId}`}
                            >
                              <img 
                                src={`${categoryPath}/${itemId}.png`}
                                alt={itemId}
                                className="w-10 h-10 object-contain pointer-events-none"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </button>
                          ))}
                          {!isExpanded && items.length > 8 && (
                            <button
                              onClick={() => toggleCategory(`local-${category}`)}
                              className="w-12 h-12 rounded bg-[hsl(225_25%_15%)] border border-[hsl(43_30%_25%)] flex items-center justify-center hover:border-[hsl(43_85%_65%)] hover:bg-[hsl(225_25%_20%)] transition-all cursor-pointer"
                              data-testid={`button-expand-${category}`}
                            >
                              <span className="text-xs text-[hsl(45_20%_50%)]">+{items.length - 8}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(43_85%_65%)]">
                  <Image className="w-5 h-5" />
                  Sprite Inventory Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[hsl(43_30%_20%)]">
                  <span className="text-[hsl(45_15%_55%)]">Cloud Sprites</span>
                  <span className={`font-bold ${workerOnline ? 'text-blue-400' : 'text-[hsl(45_20%_50%)]'}`}>{cloudSpriteCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[hsl(43_30%_20%)]">
                  <span className="text-[hsl(45_15%_55%)]">Local Sprites</span>
                  <span className="text-green-400 font-bold">{Object.values(SPRITE_MANIFEST).flat().length}</span>
                </div>
                <div className="flex justify-between py-2 mt-2 border-t border-[hsl(43_50%_30%)]">
                  <span className="text-[hsl(43_85%_65%)] font-semibold">Total Available</span>
                  <span className="text-[hsl(43_85%_65%)] font-bold">
                    {cloudSpriteCount + Object.values(SPRITE_MANIFEST).flat().length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(43_85%_65%)]">Reset Password</DialogTitle>
            <DialogDescription className="text-[hsl(45_15%_55%)]">
              Set a new password for "{resetAccountUsername}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                type="password"
                placeholder="New password (min 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSprite} onOpenChange={(open) => !open && setSelectedSprite(null)}>
        <DialogContent className="fantasy-panel border-2 border-[hsl(43_50%_35%)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(43_85%_65%)] flex items-center gap-2">
              <Image className="w-5 h-5" />
              Assign Sprite
            </DialogTitle>
            <DialogDescription className="text-[hsl(45_15%_55%)]">
              Assign this sprite to an item, ability, skill, or UI element
            </DialogDescription>
          </DialogHeader>
          
          {selectedSprite && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[hsl(225_28%_12%)] border border-[hsl(43_30%_25%)]">
                <div className="w-16 h-16 rounded bg-[hsl(225_25%_18%)] border border-[hsl(43_30%_30%)] flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedSprite.path}
                    alt={selectedSprite.id}
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[hsl(43_85%_65%)] font-semibold">{selectedSprite.id}</p>
                  <p className="text-xs text-[hsl(45_20%_50%)]">
                    Category: <span className="capitalize">{selectedSprite.category}</span> • 
                    Source: <span className={selectedSprite.source === 'cloud' ? 'text-blue-400' : 'text-green-400'}>
                      {selectedSprite.source === 'cloud' ? 'Cloud' : 'Local'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[hsl(45_15%_55%)] mb-1 block">Assignment Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['item', 'ability', 'skill', 'ui', 'other'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setAssignmentType(type)}
                        className={`px-2 py-1.5 text-xs rounded border transition-all ${
                          assignmentType === type
                            ? 'bg-[hsl(43_85%_55%)] text-[hsl(225_30%_10%)] border-[hsl(43_85%_65%)]'
                            : 'bg-[hsl(225_28%_15%)] text-[hsl(45_20%_60%)] border-[hsl(43_30%_25%)] hover:border-[hsl(43_50%_40%)]'
                        }`}
                        data-testid={`button-type-${type}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[hsl(45_15%_55%)] mb-1 block">Name</label>
                  <Input
                    placeholder="e.g., Bloodfeud Blade, Fireball, etc."
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                    data-testid="input-assignment-name"
                  />
                </div>

                <div>
                  <label className="text-sm text-[hsl(45_15%_55%)] mb-1 block">ID (Optional)</label>
                  <Input
                    placeholder="e.g., weapon-001, skill-fireball"
                    value={assignmentId}
                    onChange={(e) => setAssignmentId(e.target.value)}
                    className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]"
                    data-testid="input-assignment-id"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSprite(null)}>Cancel</Button>
            <Button onClick={handleAssignSprite} disabled={!assignmentName}>
              <Image className="w-4 h-4 mr-2" />
              Assign Sprite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-8 text-center">
        <a 
          href="https://developer.puter.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-[hsl(45_15%_50%)] hover:text-[hsl(43_85%_65%)] transition-colors"
        >
          Powered by Puter
        </a>
      </footer>
    </div>
  );
}
