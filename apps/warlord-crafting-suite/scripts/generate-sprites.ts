import { init } from "@heyputer/puter.js/src/init.cjs";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const CRAFTING_MATERIALS = [
  // Ores (T1-T8) - COMPLETE
  { id: "copper-ore", name: "Copper Ore", category: "ore" },
  { id: "iron-ore", name: "Iron Ore", category: "ore" },
  { id: "steel-ore", name: "Steel Ore", category: "ore" },
  { id: "mithril-ore", name: "Mithril Ore", category: "ore" },
  { id: "adamantine-ore", name: "Adamantine Ore", category: "ore" },
  { id: "orichalcum-ore", name: "Orichalcum Ore", category: "ore" },
  { id: "starmetal-ore", name: "Starmetal Ore", category: "ore" },
  { id: "divine-ore", name: "Divine Ore", category: "ore" },
  // Ingots (T1-T8) - COMPLETE
  { id: "copper-ingot", name: "Copper Ingot", category: "component" },
  { id: "iron-ingot", name: "Iron Ingot", category: "component" },
  { id: "steel-ingot", name: "Steel Ingot", category: "component" },
  { id: "mithril-ingot", name: "Mithril Ingot", category: "component" },
  { id: "adamantine-ingot", name: "Adamantine Ingot", category: "component" },
  { id: "orichalcum-ingot", name: "Orichalcum Ingot", category: "component" },
  { id: "starmetal-ingot", name: "Starmetal Ingot", category: "component" },
  { id: "divine-ingot", name: "Divine Ingot", category: "component" },
  // Logs (T1-T8) - COMPLETE
  { id: "pine-log", name: "Pine Log", category: "wood" },
  { id: "oak-log", name: "Oak Log", category: "wood" },
  { id: "maple-log", name: "Maple Log", category: "wood" },
  { id: "ash-log", name: "Ash Log", category: "wood" },
  { id: "ironwood-log", name: "Ironwood Log", category: "wood" },
  { id: "ebony-log", name: "Ebony Log", category: "wood" },
  { id: "wyrmwood-log", name: "Wyrmwood Log", category: "wood" },
  { id: "worldtree-log", name: "Worldtree Log", category: "wood" },
  // Planks (T1-T8) - MISSING
  { id: "pine-plank", name: "Pine Plank", category: "plank" },
  { id: "oak-plank", name: "Oak Plank", category: "plank" },
  { id: "maple-plank", name: "Maple Plank", category: "plank" },
  { id: "ash-plank", name: "Ash Plank", category: "plank" },
  { id: "ironwood-plank", name: "Ironwood Plank", category: "plank" },
  { id: "ebony-plank", name: "Ebony Plank", category: "plank" },
  { id: "wyrmwood-plank", name: "Wyrmwood Plank", category: "plank" },
  { id: "worldtree-plank", name: "Worldtree Plank", category: "plank" },
  // Essence (T1-T8) - COMPLETE
  { id: "minor-essence", name: "Minor Essence", category: "essence" },
  { id: "lesser-essence", name: "Lesser Essence", category: "essence" },
  { id: "greater-essence", name: "Greater Essence", category: "essence" },
  { id: "superior-essence", name: "Superior Essence", category: "essence" },
  { id: "refined-essence", name: "Refined Essence", category: "essence" },
  { id: "perfect-essence", name: "Perfect Essence", category: "essence" },
  { id: "ancient-essence", name: "Ancient Essence", category: "essence" },
  { id: "divine-essence", name: "Divine Essence", category: "essence" },
  // Gems (T1-T8) - COMPLETE
  { id: "rough-gem", name: "Rough Gem", category: "gem" },
  { id: "flawed-gem", name: "Flawed Gem", category: "gem" },
  { id: "standard-gem", name: "Standard Gem", category: "gem" },
  { id: "fine-gem", name: "Fine Gem", category: "gem" },
  { id: "pristine-gem", name: "Pristine Gem", category: "gem" },
  { id: "flawless-gem", name: "Flawless Gem", category: "gem" },
  { id: "radiant-gem", name: "Radiant Gem", category: "gem" },
  { id: "divine-gem", name: "Divine Gem", category: "gem" },
  // Leather (T1-T8)
  { id: "rawhide", name: "Rawhide", category: "leather" },
  { id: "thick-hide", name: "Thick Hide", category: "leather" },
  { id: "rugged-leather", name: "Rugged Leather", category: "leather" },
  { id: "hardened-leather", name: "Hardened Leather", category: "leather" },
  { id: "wyrm-leather", name: "Wyrm Leather", category: "leather" },
  { id: "infernal-leather", name: "Infernal Leather", category: "leather" },
  { id: "titan-leather", name: "Titan Leather", category: "leather" },
  { id: "divine-leather", name: "Divine Leather", category: "leather" },
  // Cloth Thread (T1-T8) - MISSING
  { id: "linen-thread", name: "Linen Thread", category: "thread" },
  { id: "cotton-thread", name: "Cotton Thread", category: "thread" },
  { id: "wool-thread", name: "Wool Thread", category: "thread" },
  { id: "silk-thread", name: "Silk Thread", category: "thread" },
  { id: "enchanted-thread", name: "Enchanted Thread", category: "thread" },
  { id: "arcane-thread", name: "Arcane Thread", category: "thread" },
  { id: "celestial-thread", name: "Celestial Thread", category: "thread" },
  { id: "divine-thread", name: "Divine Thread", category: "thread" },
  // Cloth Fabric (T1-T8) - MISSING
  { id: "linen-cloth", name: "Linen Cloth", category: "cloth" },
  { id: "cotton-cloth", name: "Cotton Cloth", category: "cloth" },
  { id: "wool-cloth", name: "Wool Cloth", category: "cloth" },
  { id: "silk-cloth", name: "Silk Cloth", category: "cloth" },
  { id: "enchanted-cloth", name: "Enchanted Cloth", category: "cloth" },
  { id: "arcane-cloth", name: "Arcane Cloth", category: "cloth" },
  { id: "celestial-cloth", name: "Celestial Cloth", category: "cloth" },
  { id: "divine-cloth", name: "Divine Cloth", category: "cloth" },
  // Gears (T1-T8) - MISSING
  { id: "bronze-gear", name: "Bronze Gear", category: "gear" },
  { id: "iron-gear", name: "Iron Gear", category: "gear" },
  { id: "steel-gear", name: "Steel Gear", category: "gear" },
  { id: "mithril-gear", name: "Mithril Gear", category: "gear" },
  { id: "adamantine-gear", name: "Adamantine Gear", category: "gear" },
  { id: "orichalcum-gear", name: "Orichalcum Gear", category: "gear" },
  { id: "starmetal-gear", name: "Starmetal Gear", category: "gear" },
  { id: "divine-gear", name: "Divine Gear", category: "gear" },
  // Ingredients - Basic
  { id: "salt", name: "Salt", category: "ingredient" },
  { id: "spice", name: "Spice", category: "ingredient" },
  { id: "herb", name: "Herb", category: "ingredient" },
  { id: "mushroom", name: "Mushroom", category: "ingredient" },
  { id: "raw-meat", name: "Raw Meat", category: "meat" },
  { id: "raw-fish", name: "Raw Fish", category: "fish" },
  // Tiered Meats (T1-T8) - MISSING
  { id: "quality-meat", name: "Quality Meat", category: "meat" },
  { id: "prime-meat", name: "Prime Meat", category: "meat" },
  { id: "exotic-meat", name: "Exotic Meat", category: "meat" },
  { id: "monster-meat", name: "Monster Meat", category: "meat" },
  { id: "dragon-meat", name: "Dragon Meat", category: "meat" },
  { id: "titan-meat", name: "Titan Meat", category: "meat" },
  { id: "divine-meat", name: "Divine Meat", category: "meat" },
  // Tiered Fish (T1-T8) - MISSING
  { id: "river-fish", name: "River Fish", category: "fish" },
  { id: "ocean-fish", name: "Ocean Fish", category: "fish" },
  { id: "deep-fish", name: "Deep Sea Fish", category: "fish" },
  { id: "arcane-fish", name: "Arcane Fish", category: "fish" },
  { id: "leviathan-fish", name: "Leviathan Fish", category: "fish" },
  { id: "kraken-fish", name: "Kraken Fish", category: "fish" },
  { id: "divine-fish", name: "Divine Fish", category: "fish" },
  // Other ingredients - MISSING
  { id: "vegetable", name: "Vegetable", category: "ingredient" },
  { id: "grain", name: "Grain", category: "ingredient" },
  { id: "flour", name: "Flour", category: "ingredient" },
  { id: "honey", name: "Honey", category: "ingredient" },
  { id: "rare-spice", name: "Rare Spice", category: "ingredient" },
  { id: "mystic-spice", name: "Mystic Spice", category: "ingredient" },
  { id: "dragon-pepper", name: "Dragon Pepper", category: "ingredient" },
  { id: "celestial-herb", name: "Celestial Herb", category: "ingredient" },
  { id: "divine-nectar", name: "Divine Nectar", category: "ingredient" },
  // Engineering components - MISSING
  { id: "coal", name: "Coal", category: "component" },
  { id: "flux", name: "Flux", category: "component" },
  { id: "string", name: "String", category: "component" },
  { id: "bowstring", name: "Bowstring", category: "component" },
  { id: "gunpowder", name: "Gunpowder", category: "component" },
  { id: "circuit", name: "Circuit", category: "component" },
  { id: "lens", name: "Lens", category: "component" },
  { id: "spring", name: "Spring", category: "component" },
  // Infusions - MISSING
  { id: "fire-infusion", name: "Fire Infusion", category: "infusion" },
  { id: "frost-infusion", name: "Frost Infusion", category: "infusion" },
  { id: "lightning-infusion", name: "Lightning Infusion", category: "infusion" },
  { id: "nature-infusion", name: "Nature Infusion", category: "infusion" },
  { id: "holy-infusion", name: "Holy Infusion", category: "infusion" },
  { id: "shadow-infusion", name: "Shadow Infusion", category: "infusion" },
  { id: "arcane-infusion", name: "Arcane Infusion", category: "infusion" },
  { id: "divine-infusion", name: "Divine Infusion", category: "infusion" },
];

const WEAPONS = [
  // Swords (1H) - COMPLETE
  { id: "bloodfeud-blade", name: "Bloodfeud Blade", category: "sword" },
  { id: "wraithfang", name: "Wraithfang", category: "sword" },
  { id: "oathbreaker", name: "Oathbreaker", category: "sword" },
  { id: "kinrend", name: "Kinrend", category: "sword" },
  { id: "dusksinger", name: "Dusksinger", category: "sword" },
  { id: "emberclad", name: "Emberclad", category: "sword" },
  { id: "soulreaver", name: "Soulreaver", category: "sword" },
  { id: "grimshard", name: "Grimshard", category: "sword" },
  // Axes (1H) - COMPLETE
  { id: "bloodfeud-cleaver", name: "Bloodfeud Cleaver", category: "axe" },
  { id: "wraithfang-cleaver", name: "Wraithfang Cleaver", category: "axe" },
  { id: "oathbreaker-cleaver", name: "Oathbreaker Cleaver", category: "axe" },
  { id: "kinrend-cleaver", name: "Kinrend Cleaver", category: "axe" },
  { id: "dusksinger-cleaver", name: "Dusksinger Cleaver", category: "axe" },
  { id: "emberclad-cleaver", name: "Emberclad Cleaver", category: "axe" },
  { id: "soulreaver-cleaver", name: "Soulreaver Cleaver", category: "axe" },
  { id: "grimshard-cleaver", name: "Grimshard Cleaver", category: "axe" },
  // Greatswords (2H) - MISSING
  { id: "greatsword-doomspire", name: "Doomspire Greatsword", category: "greatsword" },
  { id: "greatsword-bloodspire", name: "Bloodspire Greatsword", category: "greatsword" },
  { id: "greatsword-wraithblade", name: "Wraithblade Greatsword", category: "greatsword" },
  { id: "greatsword-emberbrand", name: "Emberbrand Greatsword", category: "greatsword" },
  { id: "greatsword-ironwrath", name: "Ironwrath Greatsword", category: "greatsword" },
  { id: "greatsword-duskreaver", name: "Duskreaver Greatsword", category: "greatsword" },
  // Greataxes (2H) - MISSING
  { id: "greataxe-skullsunder", name: "Skullsunder Greataxe", category: "greataxe" },
  { id: "greataxe-bloodreaver", name: "Bloodreaver Greataxe", category: "greataxe" },
  { id: "greataxe-wraithhew", name: "Wraithhew Greataxe", category: "greataxe" },
  { id: "greataxe-embermaul", name: "Embermaul Greataxe", category: "greataxe" },
  { id: "greataxe-ironrend", name: "Ironrend Greataxe", category: "greataxe" },
  { id: "greataxe-dusksplitter", name: "Dusksplitter Greataxe", category: "greataxe" },
  // Bows - PARTIAL
  { id: "bloodfeud-bow", name: "Bloodfeud Bow", category: "bow" },
  { id: "wraithfang-bow", name: "Wraithfang Bow", category: "bow" },
  { id: "oathbreaker-bow", name: "Oathbreaker Bow", category: "bow" },
  { id: "kinrend-bow", name: "Kinrend Bow", category: "bow" },
  { id: "bow-shadowflight", name: "Shadowflight Bow", category: "bow" },
  { id: "bow-emberthorn", name: "Emberthorn Bow", category: "bow" },
  // Crossbows - MISSING
  { id: "crossbow-ironveil", name: "Ironveil Crossbow", category: "crossbow" },
  { id: "crossbow-skullpiercer", name: "Skullpiercer Crossbow", category: "crossbow" },
  { id: "crossbow-bloodreaver", name: "Bloodreaver Crossbow", category: "crossbow" },
  { id: "crossbow-wraithspike", name: "Wraithspike Crossbow", category: "crossbow" },
  { id: "crossbow-emberbolt", name: "Emberbolt Crossbow", category: "crossbow" },
  { id: "crossbow-ironshard", name: "Ironshard Crossbow", category: "crossbow" },
  // Guns - MISSING
  { id: "gun-blackpowder", name: "Blackpowder Pistol", category: "gun" },
  { id: "gun-ironstorm", name: "Ironstorm Rifle", category: "gun" },
  { id: "gun-bloodcannon", name: "Bloodcannon", category: "gun" },
  { id: "gun-wraithbarrel", name: "Wraithbarrel", category: "gun" },
  { id: "gun-emberrifle", name: "Emberrifle", category: "gun" },
  { id: "gun-duskblaster", name: "Duskblaster", category: "gun" },
  // Staves - PARTIAL
  { id: "bloodfeud-staff", name: "Bloodfeud Staff", category: "staff" },
  { id: "wraithfang-staff", name: "Wraithfang Staff", category: "staff" },
  { id: "oathbreaker-staff", name: "Oathbreaker Staff", category: "staff" },
  { id: "kinrend-staff", name: "Kinrend Staff", category: "staff" },
  // Fire Staves - MISSING
  { id: "staff-fire-emberwrath", name: "Emberwrath Fire Staff", category: "staff" },
  { id: "staff-fire-infernal", name: "Infernal Grudge Staff", category: "staff" },
  { id: "staff-fire-flameblood", name: "Flameblood Spire", category: "staff" },
  { id: "staff-fire-hellfire", name: "Hellfire Oathbreaker", category: "staff" },
  // Frost Staves - MISSING
  { id: "staff-frost-glacial", name: "Glacial Spire Staff", category: "staff" },
  { id: "staff-frost-grudge", name: "Frostgrudge Staff", category: "staff" },
  { id: "staff-frost-iceblood", name: "Iceblood Spire", category: "staff" },
  { id: "staff-frost-frigid", name: "Frigid Oathbreaker", category: "staff" },
  // Daggers - PARTIAL
  { id: "nightfang", name: "Nightfang", category: "dagger" },
  { id: "shadowpiercer", name: "Shadowpiercer", category: "dagger" },
  { id: "venombite", name: "Venombite", category: "dagger" },
  { id: "whisperwind", name: "Whisperwind", category: "dagger" },
  { id: "dagger-bloodshiv", name: "Bloodshiv", category: "dagger" },
  { id: "dagger-emberfang", name: "Emberfang", category: "dagger" },
  // Hammers 1H - PARTIAL
  { id: "bloodfeud-hammer", name: "Bloodfeud Hammer", category: "hammer" },
  { id: "wraithfang-mace", name: "Wraithfang Mace", category: "hammer" },
  { id: "oathbreaker-maul", name: "Oathbreaker Maul", category: "hammer" },
  { id: "kinrend-crusher", name: "Kinrend Crusher", category: "hammer" },
  { id: "hammer1h-ironfist", name: "Ironfist Hammer", category: "hammer" },
  { id: "hammer1h-embermallet", name: "Embermallet", category: "hammer" },
  // Hammers 2H - MISSING
  { id: "hammer2h-titanmaul", name: "Titanmaul", category: "hammer" },
  { id: "hammer2h-bloodcrusher", name: "Bloodcrusher", category: "hammer" },
  { id: "hammer2h-wraithmaul", name: "Wraithmaul", category: "hammer" },
  { id: "hammer2h-emberforge", name: "Emberforge", category: "hammer" },
  { id: "hammer2h-ironbreaker", name: "Ironbreaker", category: "hammer" },
  { id: "hammer2h-duskmallet", name: "Duskmallet", category: "hammer" },
  // Tomes - MISSING
  { id: "tome-fire", name: "Fire Tome", category: "tome" },
  { id: "tome-frost", name: "Frost Tome", category: "tome" },
  { id: "tome-nature", name: "Nature Tome", category: "tome" },
  { id: "tome-holy", name: "Holy Tome", category: "tome" },
  { id: "tome-arcane", name: "Arcane Tome", category: "tome" },
  { id: "tome-lightning", name: "Lightning Tome", category: "tome" },
];

const STYLE_PROMPTS: Record<string, string> = {
  pixel: "pixel art style, 16-bit RPG game sprite, TRANSPARENT BACKGROUND, NO BACKGROUND, centered item only, bold dark outline, clean hard edges, vibrant saturated colors, game inventory icon, isolated object on empty transparent space, no shadows, no floor, no surface, floating item",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  ore: "fantasy RPG ore chunk, raw mining resource, crystalline shiny rock, jagged edges",
  wood: "fantasy RPG wooden log, natural forestry resource, bark texture, rough hewn",
  component: "fantasy RPG refined metal bar ingot, smooth metallic surface, shiny",
  plank: "fantasy RPG wooden plank, sawed lumber board, wood grain texture",
  essence: "fantasy RPG magical essence orb, glowing mystical energy sphere, ethereal glow",
  gem: "fantasy RPG gemstone, brilliant cut crystal, sparkling facets, colorful shine",
  leather: "fantasy RPG leather hide, tanned animal skin, rugged texture, brown",
  cloth: "fantasy RPG cloth fabric, woven textile material, folded soft",
  thread: "fantasy RPG thread spool, wound yarn, crafting material",
  ingredient: "fantasy RPG cooking ingredient, fresh food item, kitchen supply",
  meat: "fantasy RPG raw meat, butchered protein, red flesh",
  fish: "fantasy RPG fish, caught seafood, scales visible",
  gear: "fantasy RPG mechanical gear, cog wheel, metal teeth, engineering part",
  infusion: "fantasy RPG magical infusion vial, glowing liquid bottle, enchanting material",
  sword: "fantasy RPG sword weapon, sharp blade, ornate hilt, single item",
  axe: "fantasy RPG battle axe, curved blade, wooden handle, single weapon",
  bow: "fantasy RPG bow, elegant curved limbs, taut string, archery weapon",
  crossbow: "fantasy RPG crossbow, mechanical bow, trigger mechanism, bolts",
  gun: "fantasy RPG flintlock pistol, steampunk firearm, brass and wood",
  staff: "fantasy RPG magical staff, glowing crystal top, wooden shaft, wizard",
  tome: "fantasy RPG magic spellbook, ancient tome, mystical pages, leather bound",
  dagger: "fantasy RPG dagger, short blade, leather grip, assassin weapon",
  hammer: "fantasy RPG war hammer, heavy metal head, long handle, crushing",
  greatsword: "fantasy RPG greatsword, massive two-handed blade, epic weapon",
  greataxe: "fantasy RPG greataxe, huge two-handed axe, brutal cleaver",
  helmet: "fantasy RPG helmet, head armor, protective headgear",
  chest: "fantasy RPG chestplate, body armor, protective torso piece",
  shoulders: "fantasy RPG pauldrons, shoulder armor, protective guards",
  gloves: "fantasy RPG gauntlets, hand armor, protective gloves",
  legs: "fantasy RPG leg armor, greaves, protective leg guards",
  boots: "fantasy RPG boots, foot armor, protective footwear",
  shield: "fantasy RPG shield, defensive barrier, coat of arms",
  offhand: "fantasy RPG offhand item, secondary equipment, held accessory",
};

function buildPrompt(itemName: string, category: string): string {
  const stylePrompt = STYLE_PROMPTS.pixel;
  const categoryPrompt = CATEGORY_PROMPTS[category] || "fantasy RPG game item";
  return `${itemName}, ${categoryPrompt}, ${stylePrompt}, single isolated item, game inventory icon, NO BACKGROUND COLOR, pure transparent background only`;
}

function removeBackground(filePath: string): void {
  try {
    const tmpPath = `${filePath}.tmp.png`;
    
    // Multi-pass background removal using ImageMagick
    // Pass 1: Remove white and near-white
    execSync(`convert "${filePath}" -fuzz 20% -transparent white "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    
    // Pass 2: Remove cream/beige backgrounds
    execSync(`convert "${filePath}" -fuzz 15% -transparent "#F5F5DC" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    execSync(`convert "${filePath}" -fuzz 15% -transparent "#FFFDD0" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    
    // Pass 3: Remove light grays
    execSync(`convert "${filePath}" -fuzz 12% -transparent "#E0E0E0" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    
    // Pass 4: Remove near-white variations
    execSync(`convert "${filePath}" -fuzz 18% -transparent "#FAFAFA" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    
    console.log("    ✓ Background removed");
  } catch (err) {
    console.log("    ! Background removal failed (ImageMagick may not be available)");
  }
}

function getTokenFromPuterCLI(): string | null {
  // Read token from puter-cli config (set by `puter login --save`)
  // Check multiple possible locations
  const possiblePaths = [
    "/home/runner/workspace/.config/puter-cli-nodejs/config.json",
    path.join(process.cwd(), ".config", "puter-cli-nodejs", "config.json"),
    path.join(os.homedir(), ".config", "puter-cli-nodejs", "config.json"),
  ];
  
  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config.profiles && config.profiles.length > 0) {
          const profile = config.profiles.find((p: { uuid: string }) => p.uuid === config.selected_profile) || config.profiles[0];
          if (profile.token) {
            console.log("Found Puter token from:", configPath);
            return profile.token;
          }
        }
      }
    } catch (e) {
      // Config not found or invalid at this path
    }
  }
  return null;
}

function getToken(): string | null {
  // Priority: env var > puter-cli config
  return process.env.PUTER_AUTH_TOKEN || getTokenFromPuterCLI();
}

async function generateSprites() {
  const token = getToken();
  
  if (!token) {
    console.log("No Puter auth token found.");
    console.log("Run: puter login --save");
    return;
  }

  console.log("Initializing Puter with token...");
  const puter = init(token);
  
  const outputDir = "./client/public/2dassets/sprites";
  fs.mkdirSync(outputDir, { recursive: true });

  const allItems = [...CRAFTING_MATERIALS, ...WEAPONS];
  const results: Array<{ id: string; name: string; category: string; path: string; status: string }> = [];
  
  console.log(`\n=== GRUDGE Warlords Sprite Generator ===`);
  console.log(`Generating ${allItems.length} sprites using Puter Flux AI...\n`);

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const filename = `${item.id}.png`;
    const categoryDir = path.join(outputDir, item.category);
    const filePath = path.join(categoryDir, filename);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${allItems.length}] Skipping (exists): ${item.name}`);
      results.push({ ...item, path: filePath, status: "success" });
      continue;
    }
    
    const prompt = buildPrompt(item.name, item.category);
    
    console.log(`[${i + 1}/${allItems.length}] Generating: ${item.name}...`);

    try {
      const response = await puter.ai.txt2img(prompt, { 
        model: "black-forest-labs/FLUX.1-schnell" 
      });
      
      fs.mkdirSync(categoryDir, { recursive: true });
      
      // Handle response - could be base64 data URL or buffer
      if (response) {
        let imageData: Buffer;
        
        if (typeof response === 'object' && 'src' in response && typeof response.src === 'string') {
          // Data URL format
          const base64Data = response.src.replace(/^data:image\/\w+;base64,/, "");
          imageData = Buffer.from(base64Data, "base64");
        } else if (Buffer.isBuffer(response)) {
          imageData = response;
        } else if (typeof response === 'object' && 'data' in response) {
          // Raw data format
          const data = (response as { data: unknown }).data;
          if (Buffer.isBuffer(data)) {
            imageData = data;
          } else if (typeof data === 'string') {
            imageData = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), "base64");
          } else {
            throw new Error("Unknown data format");
          }
        } else {
          // Try to stringify and check
          console.log("  Response type:", typeof response);
          console.log("  Response keys:", Object.keys(response as object));
          throw new Error("Unknown response format");
        }
        
        fs.writeFileSync(filePath, imageData);
        console.log(`  ✓ Saved: ${filePath}`);
        
        // Post-process: remove background
        removeBackground(filePath);
        
        results.push({ ...item, path: filePath, status: "success" });
      } else {
        console.log(`  ✗ No image data returned`);
        results.push({ ...item, path: "", status: "failed" });
      }
      
      // Rate limit - wait between requests
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  ✗ Error: ${errorMsg}`);
      results.push({ ...item, path: "", status: "failed" });
      
      // If rate limited, wait longer
      if (errorMsg.includes("rate") || errorMsg.includes("limit")) {
        console.log("  Rate limited, waiting 10 seconds...");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }

  const successCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed").length;
  
  console.log(`\n=== Generation Complete ===`);
  console.log(`Success: ${successCount}/${allItems.length}`);
  console.log(`Failed: ${failedCount}/${allItems.length}`);

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest saved: ${manifestPath}`);
}

generateSprites().catch(console.error);
