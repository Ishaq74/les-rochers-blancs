import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { hashPassword } from 'better-auth/crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const email = process.argv[2] ?? 'admin@lesrochersblancs.fr';
const password = process.argv[3] ?? 'Admin123!';
const name = process.argv[4] ?? 'Administrateur';

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function createAdmin() {
  console.log(`👤 Creating admin user: ${email}`);

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
  console.log(`   Password: ${password}`);
  console.log(`   Role:     admin`);

  await client.end();
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err);
  process.exit(1);
});
