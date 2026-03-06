import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

async function getPublicDir(): Promise<string> {
  const searchPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
  const paths = searchPaths.split(",").map(p => p.trim()).filter(p => p.length > 0);
  if (paths.length === 0) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  }
  return paths[0];
}

async function uploadFile(localPath: string, remotePath: string): Promise<void> {
  const publicDir = await getPublicDir();
  const fullRemotePath = `${publicDir}/${remotePath}`;
  
  const parts = fullRemotePath.split("/").filter(p => p.length > 0);
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");
  
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);
  
  const fileContent = fs.readFileSync(localPath);
  const contentType = getContentType(localPath);
  
  await file.save(fileContent, {
    metadata: {
      contentType,
      metadata: {
        "custom:aclPolicy": JSON.stringify({
          owner: "system",
          visibility: "public"
        })
      }
    }
  });
  
  console.log(`Uploaded: ${localPath} -> ${remotePath}`);
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  return types[ext] || "application/octet-stream";
}

function getAllFiles(dir: string, basePath: string = ""): Array<{ local: string; remote: string }> {
  const files: Array<{ local: string; remote: string }> = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const localPath = path.join(dir, entry.name);
    const remotePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(localPath, remotePath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)) {
        files.push({ local: localPath, remote: remotePath });
      }
    }
  }
  
  return files;
}

async function main() {
  console.log("Starting asset upload to object storage...\n");
  
  const assetDirs = [
    { dir: "attached_assets", prefix: "assets" },
    { dir: "client/src/assets", prefix: "client-assets" },
    { dir: "client/public", prefix: "public" },
  ];
  
  let totalUploaded = 0;
  let totalErrors = 0;
  
  for (const { dir, prefix } of assetDirs) {
    console.log(`\nScanning ${dir}...`);
    const files = getAllFiles(dir, prefix);
    
    if (files.length === 0) {
      console.log(`  No image files found in ${dir}`);
      continue;
    }
    
    console.log(`  Found ${files.length} image files`);
    
    for (const { local, remote } of files) {
      try {
        await uploadFile(local, remote);
        totalUploaded++;
      } catch (error) {
        console.error(`  Error uploading ${local}:`, error);
        totalErrors++;
      }
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Upload complete!`);
  console.log(`  Uploaded: ${totalUploaded} files`);
  console.log(`  Errors: ${totalErrors} files`);
  console.log(`========================================\n`);
}

main().catch(console.error);
