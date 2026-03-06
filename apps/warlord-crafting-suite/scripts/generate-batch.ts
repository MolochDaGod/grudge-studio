import { init } from "@heyputer/puter.js/src/init.cjs";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

// Current batch: PLANKS (T1-T8)
const BATCH_ITEMS = [
  { id: "pine-plank", name: "Pine Wood Plank", category: "plank" },
  { id: "oak-plank", name: "Oak Wood Plank", category: "plank" },
  { id: "maple-plank", name: "Maple Wood Plank", category: "plank" },
  { id: "ash-plank", name: "Ash Wood Plank", category: "plank" },
  { id: "ironwood-plank", name: "Ironwood Plank", category: "plank" },
  { id: "ebony-plank", name: "Ebony Wood Plank", category: "plank" },
  { id: "wyrmwood-plank", name: "Wyrmwood Plank", category: "plank" },
  { id: "worldtree-plank", name: "Worldtree Sacred Plank", category: "plank" },
];

const CATEGORY_PROMPTS: Record<string, string> = {
  plank: "refined wooden plank, processed lumber, smooth wood board, carpentry material",
};

const STYLE_PROMPT = "2D game sprite, pixel art style, 64x64 icon, fantasy RPG item, clean bold dark outline, centered, floating item, NO BACKGROUND COLOR, pure transparent background only, single object, no shadows, no ground, no scenery";

function buildPrompt(itemName: string, category: string): string {
  const categoryPrompt = CATEGORY_PROMPTS[category] || "fantasy RPG game item";
  return `${itemName}, ${categoryPrompt}, ${STYLE_PROMPT}`;
}

function removeBackground(filePath: string): void {
  try {
    const tmpPath = `${filePath}.tmp.png`;
    execSync(`convert "${filePath}" -fuzz 25% -transparent white "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    execSync(`convert "${filePath}" -fuzz 20% -transparent "#F5F5DC" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    execSync(`convert "${filePath}" -fuzz 20% -transparent "#FFFDD0" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    execSync(`convert "${filePath}" -fuzz 15% -transparent "#E0E0E0" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    execSync(`convert "${filePath}" -fuzz 20% -transparent "#FAFAFA" "${tmpPath}"`, { stdio: 'pipe' });
    fs.renameSync(tmpPath, filePath);
    console.log("    ✓ Background removed");
  } catch (err) {
    console.log("    ! Background removal skipped");
  }
}

function getTokenFromPuterCLI(): string | null {
  const configPaths = [
    "/home/runner/workspace/.config/puter-cli-nodejs/config.json",
    path.join(os.homedir(), ".config/puter-cli-nodejs/config.json"),
    path.join(process.cwd(), ".config/puter-cli-nodejs/config.json"),
  ];
  for (const configPath of configPaths) {
    console.log(`Checking: ${configPath}`);
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        // Check both authToken and profiles[].token
        if (config.authToken) {
          console.log(`Found authToken in: ${configPath}`);
          return config.authToken;
        }
        if (config.profiles && config.profiles.length > 0 && config.profiles[0].token) {
          console.log(`Found profile token in: ${configPath}`);
          return config.profiles[0].token;
        }
      } catch (e) {
        console.log(`Error reading ${configPath}: ${e}`);
      }
    }
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateBatch() {
  const token = getTokenFromPuterCLI();
  if (!token) {
    console.error("No Puter auth token found. Run: puter login --save");
    process.exit(1);
  }

  let puter: any;
  try {
    puter = init({ APIOrigin: "https://api.puter.com", authToken: token });
  } catch (e: any) {
    console.error("Failed to init Puter:", e?.message || e);
    process.exit(1);
  }
  
  const outputDir = "client/public/2dassets/sprites";
  
  console.log(`\n=== Generating ${BATCH_ITEMS.length} PLANK sprites ===\n`);

  for (const item of BATCH_ITEMS) {
    const categoryDir = path.join(outputDir, item.category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const filePath = path.join(categoryDir, `${item.id}.png`);
    
    // Skip if exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭ ${item.name} - already exists`);
      continue;
    }

    console.log(`\n🎨 Generating: ${item.name}`);
    const prompt = buildPrompt(item.name, item.category);
    console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

    try {
      let response: any;
      try {
        response = await puter.ai.txt2img(prompt, false, { model: "flux-schnell" });
      } catch (apiErr: any) {
        console.error(`  ✗ API Error: ${apiErr?.message || apiErr?.error || JSON.stringify(apiErr)}`);
        await sleep(3000);
        continue;
      }
      
      let imageData: Buffer | null = null;
      if (response instanceof Blob) {
        imageData = Buffer.from(await response.arrayBuffer());
      } else if (response && typeof response === "object" && "image" in response) {
        const imgRes = response as { image: Blob };
        imageData = Buffer.from(await imgRes.image.arrayBuffer());
      } else if (response && typeof response === "object") {
        console.log(`  Response type: ${typeof response}`);
        console.log(`  Response keys: ${Object.keys(response as object).join(', ')}`);
        // Try to find any blob-like property
        for (const key of Object.keys(response)) {
          const val = (response as any)[key];
          if (val instanceof Blob) {
            imageData = Buffer.from(await val.arrayBuffer());
            console.log(`  Found blob in: ${key}`);
            break;
          }
        }
      }

      if (imageData && imageData.length > 0) {
        fs.writeFileSync(filePath, imageData);
        console.log(`  ✓ Saved: ${filePath} (${imageData.length} bytes)`);
        removeBackground(filePath);
      } else {
        console.log(`  ✗ No image data returned`);
      }

      // Rate limit delay
      await sleep(2500);
    } catch (err: any) {
      console.error(`  ✗ Error: ${err?.message || JSON.stringify(err)}`);
      await sleep(3000);
    }
  }

  console.log("\n=== Batch Complete ===\n");
}

generateBatch().catch(console.error);
