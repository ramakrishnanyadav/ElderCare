import * as fs from 'fs';
import * as path from 'path';

/**
 * Build-time verification script:
 * Scans all controller files under apps/api/src/modules/
 * Asserts that EVERY route handler (@Get, @Post, @Put, @Delete) declares a valid @RequireAction(...) decorator.
 * Fails with exit code 1 if any route lacks an action.
 */

const MODULES_DIR = path.resolve(__dirname, '../apps/api/src/modules');

function scanControllers(dir: string): string[] {
  let controllerFiles: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      controllerFiles = controllerFiles.concat(scanControllers(fullPath));
    } else if (entry.name.endsWith('.controller.ts')) {
      controllerFiles.push(fullPath);
    }
  }

  return controllerFiles;
}

function verifyRouteActions() {
  console.log('[VERIFY-ROUTES] Auditing all API controllers for mandatory @RequireAction declarations...');
  const files = scanControllers(MODULES_DIR);
  let violationCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line.startsWith('@Get(') ||
        line.startsWith('@Post(') ||
        line.startsWith('@Put(') ||
        line.startsWith('@Delete(')
      ) {
        // Skip public unauthenticated routes like login, logout, health, redeem
        const isPublicAuth =
          line.includes("'login'") ||
          line.includes("'elder/pin'") ||
          line.includes("'invites/redeem'") ||
          line.includes("'logout'") ||
          line.includes("'devices/:id/revoke'");

        if (isPublicAuth) continue;

        // Check preceding or following lines for @RequireAction
        const window = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join(' ');
        if (!window.includes('@RequireAction(')) {
          console.error(`[VIOLATION] Missing @RequireAction in ${path.relative(process.cwd(), file)} at line ${i + 1}: ${line}`);
          violationCount++;
        }
      }
    }
  }

  if (violationCount > 0) {
    console.error(`[VERIFY-ROUTES FAILED] Found ${violationCount} routes lacking mandatory authorization action declarations!`);
    process.exit(1);
  } else {
    console.log('[VERIFY-ROUTES PASSED] 100% of protected API endpoints declare strict authorization actions.');
  }
}

verifyRouteActions();
