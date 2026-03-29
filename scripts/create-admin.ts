import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { hashPassword } from 'better-auth/crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const email = process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'admin@lesrochersblancs.fr';
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;
const name = process.argv[4] ?? 'Administrateur';

if (!password) {
  console.error('ADMIN_PASSWORD is required (argument or environment variable)');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function createAdmin() {
  console.log(`👤 Creating admin user: ${email}`);

  // Check if admin already exists
  const existing = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (existing.length > 0) {
    console.log('⚠️  Admin user already exists, updating password...');
    const hashedPassword = await hashPassword(password);
    await db.update(schema.account)
      .set({ password: hashedPassword })
      .where(eq(schema.account.userId, existing[0].id));
    console.log('✅ Admin password updated!');
    console.log(`   Email:    ${email}`);
    console.log(`   Role:     ${existing[0].role}`);
    await client.end();
    return;
  }

  const hashedPassword = await hashPassword(password);

  const userId = crypto.randomUUID();

  await db.insert(schema.user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    role: 'admin',
  });

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashedPassword,
  });

  console.log('✅ Admin created successfully!');
  console.log(`   Email:    ${email}`);
  console.log(`   Role:     admin`);

  await client.end();
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err);
  process.exit(1);
});
