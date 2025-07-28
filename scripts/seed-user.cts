import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // pastikan ada role 'superadmin'
  const superadmin = await prisma.role.upsert({
    where: { name: "superadmin" },
    update: { has_notifications: false },
    create: {
      name: "superadmin",
      has_notifications: false,
    },
  });

  console.log(`Role superadmin: ${superadmin.id}`);

  // buat user superadmin  (jika belum ada)
  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "superadmin@mail.com" },
    update: {},
    create: {
      email: "superadmin@demo.io",
      username: "superadmin",
      name: "Super Admin",
      password,
      roles: {
        connect: { id: superadmin.id },
      },
    },
    include: { roles: true },
  });

  console.log(`User superadmin: ${user.id}`);

  //  ambil semua permission
  const permissions = await prisma.permission.findMany({
    select: { id: true },
  });

  // buat set permission → role
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: superadmin.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: superadmin.id,
        permission_id: perm.id,
      },
    });
  }

  console.log(`🎉 Assigned ${permissions.length} permissions to superadmin`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
