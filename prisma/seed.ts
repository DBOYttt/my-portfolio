import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@localhost";
  const password = process.env.ADMIN_PASSWORD ?? "change-me";

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Using insecure defaults."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: "Admin",
    },
  });

  console.log(`✅ Admin user ready: ${user.email}`);

  // Seed tool shortcuts
  await prisma.toolShortcut.upsert({
    where: { id: "tool-n8n" },
    update: {},
    create: {
      id: "tool-n8n",
      name: "n8n",
      url: "http://localhost:5678",
      description: "Workflow automation",
      icon: "⚡",
      openInNewTab: true,
      order: 0,
    },
  });

  console.log("✅ Tool shortcuts seeded");
  console.log("\n🚀 Database ready. Run `npm run dev` to start.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
