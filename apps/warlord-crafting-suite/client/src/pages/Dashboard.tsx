import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, Swords, Cloud } from "lucide-react";
import { Link } from "wouter";
import { useCharacter } from "@/contexts/CharacterContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { PuterLogin } from "@/components/PuterLogin";
import { isPuterAvailable, type GrudgeCharacter } from "@/lib/puter";
import { CLASSES } from '@/lib/gameData';
import heroBg from '@assets/image_1766824734293.png';
import minerCardBg from '@assets/19b5ef8344550_1766824963866.png';
import foresterCardBg from '@assets/19b5ef87e834d_1766824973931.png';
import mysticCardBg from '@assets/19b5ef8230364_1766824979288.png';
import chefCardBg from '@assets/19b5ef82a42b7_1766824985064.png';
import engineerCardBg from '@assets/19b5ef87ac892_1766824989260.png';
import tablesCardBg from '@assets/generated_images/steampunk_blueprint_background_with_gears.png';
import minerIcon from '@assets/generated_images/miner_profession_game_icon.png';
import foresterIcon from '@assets/generated_images/forester_profession_game_icon.png';
import mysticIcon from '@assets/generated_images/mystic_profession_game_icon.png';
import chefIcon from '@assets/generated_images/chef_profession_game_icon.png';
import engineerIcon from '@assets/generated_images/engineer_profession_game_icon.png';
import tablesIcon from '@assets/generated_images/tables_data_management_icon.png';
import grudgeLogo from '@assets/grudge-logo.png';

const PROFESSION_LEVELS = [
  { name: "Miner", iconImage: minerIcon, color: "text-amber-500", glowColor: "hsl(43 85% 55%)" },
  { name: "Forester", iconImage: foresterIcon, color: "text-green-500", glowColor: "hsl(142 71% 45%)" },
  { name: "Mystic", iconImage: mysticIcon, color: "text-purple-400", glowColor: "hsl(271 91% 65%)" },
  { name: "Chef", iconImage: chefIcon, color: "text-orange-400", glowColor: "hsl(32 95% 44%)" },
  { name: "Engineer", iconImage: engineerIcon, color: "text-orange-500", glowColor: "hsl(24 94% 50%)" },
];

const MODULES = [
  {
    title: "Miner",
    description: "Mining, Smelting, and Tunnel Defense systems.",
    iconImage: minerIcon,
    href: "/miner",
    iconColor: "text-amber-500",
    glowColor: "hsl(43 85% 55%)",
    bgImage: minerCardBg
  },
  {
    title: "Forester",
    description: "Forestry, Leatherworking, and Naval Construction.",
    iconImage: foresterIcon,
    href: "/forester",
    iconColor: "text-green-500",
    glowColor: "hsl(142 71% 45%)",
    bgImage: foresterCardBg
  },
  {
    title: "Mystic",
    description: "Enchanting, Spellcraft, and Ritual Magic.",
    iconImage: mysticIcon,
    href: "/mystic",
    iconColor: "text-purple-400",
    glowColor: "hsl(271 91% 65%)",
    bgImage: mysticCardBg
  },
  {
    title: "Chef",
    description: "Cooking, Alchemy, and Preservation.",
    iconImage: chefIcon,
    href: "/chef",
    iconColor: "text-orange-400",
    glowColor: "hsl(32 95% 44%)",
    bgImage: chefCardBg
  },
  {
    title: "Engineer",
    description: "Engineering, Siege Weapons, and Automata.",
    iconImage: engineerIcon,
    href: "/engineer",
    iconColor: "text-orange-500",
    glowColor: "hsl(24 94% 50%)",
    bgImage: engineerCardBg
  },
  {
    title: "Recipes",
    description: "Purchase recipes, view inventory, and track drops.",
    iconImage: tablesIcon,
    href: "/recipes",
    iconColor: "text-cyan-400",
    glowColor: "hsl(190 80% 50%)",
    bgImage: tablesCardBg
  },
];


export default function Dashboard() {
  const { character, setCharacter, isPuterMode, setFromPuterCharacter } = useCharacter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [selectedPuterChar, setSelectedPuterChar] = useState<GrudgeCharacter | null>(null);

  const handlePuterCharacterSelect = (puterChar: GrudgeCharacter) => {
    setSelectedPuterChar(puterChar);
    setFromPuterCharacter(puterChar);
    toast({ title: "Character Loaded!", description: `Welcome back, ${puterChar.name}!` });
  };

  const handleCreateCharacter = async () => {
    if (!characterName.trim()) {
      toast({ title: "Error", description: "Please enter a character name", variant: "destructive" });
      return;
    }
    if (!selectedClass) {
      toast({ title: "Error", description: "Please select a class", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: characterName,
          classId: selectedClass,
          userId: null,
          level: 1,
          experience: 0,
          gold: 1000,
          skillPoints: 5,
        }),
      });

      if (!res.ok) throw new Error("Failed to create character");

      const newCharacter = await res.json();
      setCharacter(newCharacter);
      setShowCreateForm(false);
      setCharacterName("");
      setSelectedClass("");
      toast({ title: "Success!", description: `${newCharacter.name} has been created!` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create character", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (!character || showCreateForm) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <img 
              src={grudgeLogo} 
              alt="GRUDGE Warlords" 
              className="w-24 h-24 mx-auto object-contain"
              style={{filter: 'drop-shadow(0 0 20px hsl(43 85% 55% / 0.5))'}}
            />
          </div>
          <h1 className="text-4xl font-heading font-bold gold-text">Welcome to GRUDGE Warlords</h1>
          <p className="text-[hsl(45_20%_60%)] font-body text-lg">
            {isPuterAvailable() 
              ? "Sign in with Puter for cloud save and free AI, or create a local character"
              : "Create your character to begin your journey"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isPuterAvailable() && (
            <PuterLogin 
              onCharacterSelect={handlePuterCharacterSelect}
              selectedCharacter={selectedPuterChar}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isPuterAvailable() ? "Local Character" : "Create Character"}
                {!isPuterAvailable() && <Cloud className="w-4 h-4 text-[hsl(45_15%_45%)]" />}
              </CardTitle>
              <CardDescription className="text-[hsl(45_15%_55%)]">
                {isPuterAvailable() 
                  ? "Create a character stored on this server"
                  : "Choose your name and class to start your adventure"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="character-name" className="text-[hsl(43_70%_65%)] font-heading">Character Name</Label>
                <Input
                  id="character-name"
                  data-testid="input-character-name"
                  placeholder="Enter character name..."
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] placeholder:text-[hsl(45_15%_40%)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class" className="text-[hsl(43_70%_65%)] font-heading">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class" data-testid="select-class" className="inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)]">
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent className="fantasy-panel border-[hsl(43_50%_35%)]">
                    {Object.entries(CLASSES).map(([id, classInfo]) => (
                      <SelectItem key={id} value={id} data-testid={`option-class-${id.toLowerCase()}`} className="text-[hsl(45_30%_80%)] focus:bg-[hsl(225_25%_20%)] focus:text-[hsl(43_85%_65%)]">
                        {classInfo.icon} {classInfo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  data-testid="button-create-character"
                  onClick={handleCreateCharacter}
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Character"}
                </Button>
                {character && (
                  <Button
                    data-testid="button-cancel-create"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCharacterName("");
                      setSelectedClass("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Character Stats Bar */}
      <Card className="flex-shrink-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-heading font-bold gold-text" data-testid="text-character-name">{character.name}</h2>
              <p className="text-sm text-[hsl(45_20%_55%)] font-body" data-testid="text-character-class">{character.classId || character.profession || 'Adventurer'} • Level {character.level}</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center inset-panel px-4 py-2 rounded">
                <div className="text-xs text-[hsl(43_50%_50%)] uppercase tracking-wider font-heading">Gold</div>
                <div className="text-xl font-bold text-[hsl(43_85%_55%)]" data-testid="text-character-gold" style={{textShadow: '0 0 8px hsl(43 85% 55% / 0.5)'}}>{character.gold.toLocaleString()}</div>
              </div>
              <div className="text-center inset-panel px-4 py-2 rounded">
                <div className="text-xs text-[hsl(43_50%_50%)] uppercase tracking-wider font-heading">Skill Points</div>
                <div className="text-xl font-bold text-[hsl(220_70%_60%)]" data-testid="text-character-skill-points" style={{textShadow: '0 0 8px hsl(220 70% 60% / 0.5)'}}>{character.skillPoints}</div>
              </div>
              <div className="text-center inset-panel px-4 py-2 rounded">
                <div className="text-xs text-[hsl(43_50%_50%)] uppercase tracking-wider font-heading">Experience</div>
                <div className="text-xl font-bold text-[hsl(120_60%_50%)]" data-testid="text-character-experience" style={{textShadow: '0 0 8px hsl(120 60% 50% / 0.5)'}}>{character.experience}</div>
              </div>
            </div>
            <Button
              data-testid="button-new-character"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Character
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <div 
        className="flex-shrink-0 relative overflow-hidden ornate-frame rounded p-6 md:p-8"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-uncial mb-4">
            Welcome to <span className="gold-text">GRUDGE</span>
          </h1>
          <p className="text-lg text-[hsl(45_20%_60%)] mb-8 leading-relaxed font-body">
            Manage your profession specialization trees, crafting recipes, and character progression systems all in one place.
          </p>
          
          <div className="flex flex-wrap gap-3">
            {PROFESSION_LEVELS.map((prof, i) => {
              const level = 1;
              return (
                <div key={i} className="flex items-center gap-2 stone-panel px-3 py-2 rounded border-2 border-[hsl(43_40%_30%)]" style={{boxShadow: `0 0 8px ${prof.glowColor}40`}}>
                  <div className="w-8 h-8 rounded overflow-hidden border border-[hsl(43_40%_30%)]" style={{background: 'linear-gradient(180deg, hsl(225 25% 18%) 0%, hsl(225 28% 12%) 100%)'}}>
                    <img src={prof.iconImage} alt={prof.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(43_50%_50%)] uppercase tracking-wider font-heading">{prof.name}</div>
                    <div className={`font-heading font-bold ${prof.color}`}>Lv. {level}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {MODULES.map((module) => (
          <Link key={module.title} href={module.href} className="block">
            <div 
              className="group relative overflow-hidden fantasy-panel rounded p-4 cursor-pointer border-2 border-[hsl(43_50%_30%)] h-full flex flex-col transition-all duration-200 hover:border-[hsl(43_60%_45%)] hover:shadow-lg" 
              data-testid={`card-module-${module.title.toLowerCase()}`}
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                ...(module.bgImage && {
                  backgroundImage: `url(${module.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                })
              }}
            >
              {module.bgImage && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              )}
              <div 
                className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-20 transition-all duration-300 group-hover:opacity-40" 
                style={{background: `radial-gradient(circle, ${module.glowColor} 0%, transparent 70%)`}}
              />
              
              <div className="relative z-10 flex flex-col flex-1">
                <div 
                  className={`w-10 h-10 rounded flex items-center justify-center mb-3 border-2 border-[hsl(43_40%_30%)] overflow-hidden flex-shrink-0 ${module.iconColor}`}
                  style={{
                    background: 'linear-gradient(180deg, hsl(225 25% 18%) 0%, hsl(225 28% 12%) 100%)',
                    boxShadow: `0 0 12px ${module.glowColor}`
                  }}
                >
                  <img src={module.iconImage} alt={module.title} className="w-8 h-8 object-cover" />
                </div>
                
                <h3 className="text-lg font-bold font-heading text-[hsl(43_85%_65%)] mb-1 group-hover:text-[hsl(43_90%_75%)] transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-[hsl(45_20%_55%)] mb-auto font-body line-clamp-2">
                  {module.description}
                </p>
                
                <div className="flex items-center text-xs font-heading font-bold text-[hsl(43_50%_45%)] group-hover:text-[hsl(43_85%_65%)] transition-colors mt-3">
                  Open <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
