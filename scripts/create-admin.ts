import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import * as schema from '../src/db/schema';
import { hashPassword } from 'better-auth/crypto';

const ADMIN_PASSWORD_MIN_LENGTH = 12;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const name = process.argv[4] ?? 'Administrateur';

const adminEmailSchema = z.string().trim().check(z.email({ message: 'ADMIN_EMAIL must be a valid email address' }));
const adminPasswordSchema = z
  .string()
  .min(ADMIN_PASSWORD_MIN_LENGTH, `ADMIN_PASSWORD must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'ADMIN_PASSWORD must be at most 128 characters');

const emailResult = adminEmailSchema.safeParse(process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'admin@lesrochersblancs.fr');

if (!emailResult.success) {
  console.error(emailResult.error.issues[0]?.message ?? 'ADMIN_EMAIL is invalid');
  process.exit(1);
}

const email = emailResult.data;

async function resolveAdminPassword(): Promise<string | null> {
  const passwordFile = process.env.ADMIN_PASSWORD_FILE;
  if (passwordFile) {
    const fileContents = await readFile(passwordFile, 'utf8');
    return fileContents.trim();
  }

  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (process.argv[3]) {
    console.warn('Passing the admin password as a CLI argument exposes it to shell history; prefer ADMIN_PASSWORD or ADMIN_PASSWORD_FILE.');
    return process.argv[3];
  }

  return null;
}

const passwordInput = await resolveAdminPassword();

if (!passwordInput) {
  console.error('ADMIN_PASSWORD is required (environment variable, ADMIN_PASSWORD_FILE, or argument)');
  process.exit(1);
}

const passwordResult = adminPasswordSchema.safeParse(passwordInput);

if (!passwordResult.success) {
  console.error(passwordResult.error.issues[0]?.message ?? 'ADMIN_PASSWORD is invalid');
  process.exit(1);
}

const password = passwordResult.data;

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
