import { Project, SyntaxKind } from "ts-morph";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

type PermissionMeta = {
  module: string;
  description?: string;
};

async function generatePermissions(appNames?: string[]) {
  try {
    const project = new Project();

    // 🔍 Auto-discover jika appNames tidak diberikan
    if (!appNames || appNames.length === 0) {
      appNames = discoverAppNames("apps");
      console.log(`📦 Discovered apps: ${appNames.join(", ")}`);
    }

    // Tambahkan semua file TS dari app-app yang ditemukan
    for (const appName of appNames) {
      project.addSourceFilesAtPaths(`apps/${appName}/src/**/*.ts`);
    }

    const sourceFiles = project.getSourceFiles();
    const controllerFiles = sourceFiles.filter(
      (file) =>
        file.getBaseName().endsWith(".controller.ts") &&
        !file.getBaseName().includes(".spec."),
    );

    const permissionsMap = new Map<string, PermissionMeta>();

    for (const file of controllerFiles) {
      for (const cls of file.getClasses()) {
        if (!cls.getDecorator("Controller")) continue;

        for (const method of cls.getMethods()) {
          const permissionDecorator = method.getDecorator("Permission");
          if (!permissionDecorator) continue;

          const callExpr = permissionDecorator.getCallExpression();
          if (!callExpr) continue;

          const args = callExpr.getArguments();
          if (
            args.length >= 2 &&
            args[0].isKind(SyntaxKind.StringLiteral) &&
            args[1].isKind(SyntaxKind.StringLiteral)
          ) {
            const name = args[0].getText().slice(1, -1);
            const module = args[1].getText().slice(1, -1);
            const description =
              args.length >= 3 && args[2].isKind(SyntaxKind.StringLiteral)
                ? args[2].getText().slice(1, -1)
                : undefined;

            if (
              permissionsMap.has(name) &&
              permissionsMap.get(name)?.module !== module
            ) {
              console.error(
                `❌ Konflik: "${name}" dipakai di modul "${permissionsMap.get(name)?.module}" dan "${module}"`,
              );
            } else {
              permissionsMap.set(name, { module, description });
            }
          }
        }
      }
    }

    // ⬇️ Simpan ke database
    for (const [name, { module, description }] of permissionsMap) {
      const existing = await prisma.permission.findUnique({ where: { name } });

      if (!existing) {
        await prisma.permission.create({
          data: { name, module, description },
        });
        console.log(`✅ Created: ${name} (${module})`);
      } else {
        const needUpdate =
          !existing.description && !!description && existing.module === module;

        if (needUpdate) {
          await prisma.permission.update({
            where: { name },
            data: { description },
          });
          console.log(`✏️  Updated description: ${name}`);
        } else if (existing.module !== module) {
          console.warn(
            `⚠️  Module mismatch: ${name} (${existing.module} vs ${module})`,
          );
        }
      }
    }

    console.log("🎉 Selesai generate permissions.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 🔍 Discover folder dalam /apps
function discoverAppNames(appsRoot: string): string[] {
  return fs
    .readdirSync(appsRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

// ✅ Bisa dipanggil dari CLI langsung
if (require.main === module) {
  const inputApps = process.argv.slice(2);
  generatePermissions(inputApps).catch(console.error);
}
