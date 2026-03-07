import { prisma } from "./lib/prisma";

async function main() {
  console.log("Checking prisma models...");
  console.log("Keys on prisma:", Object.keys(prisma));
  
  // Try to access to trigger runtime check (if any proxy)
  try {
    console.log("systemAdminWhitelist exists?", !!(prisma as any).systemAdminWhitelist);
    console.log("platformSecret exists?", !!(prisma as any).platformSecret);
  } catch (e) {
    console.log("Error accessing models:", e);
  }
}

main().catch(console.error);
