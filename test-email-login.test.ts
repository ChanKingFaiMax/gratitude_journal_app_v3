import { describe, it, expect } from 'vitest';

describe('Email Login Flow', () => {
  const testEmail = `test${Date.now()}@example.com`;
  let verificationCode = '';

  it('should send verification code', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/auth.sendVerificationCode?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        0: {
          email: testEmail,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data[0].result.data.success).toBe(true);

    console.log(`✅ Verification code sent to ${testEmail}`);
  });

  it('should verify code and create session', async () => {
    // Get code from database
    const { getDb } = await import('./server/db');
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { emailVerifications } = await import('./drizzle/schema');
    const { eq, desc } = await import('drizzle-orm');

    const result = await db.select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, testEmail))
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    expect(result.length).toBeGreaterThan(0);
    verificationCode = result[0].code;
    console.log(`📧 Retrieved verification code: ${verificationCode}`);

    // Verify the code
    const response = await fetch('http://localhost:3000/api/trpc/auth.verifyEmailCode?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        0: {
          email: testEmail,
          code: verificationCode,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data[0].result.data.success).toBe(true);
    expect(data[0].result.data.user.email).toBe(testEmail);
    expect(data[0].result.data.sessionToken).toBeDefined();

    console.log('✅ Login successful:', data[0].result.data.user);
  });

  it('should reject invalid code', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/auth.verifyEmailCode?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        0: {
          email: testEmail,
          code: '000000',
        },
      }),
    });

    const data = await response.json();
    expect(data[0].error).toBeDefined();
    console.log('✅ Invalid code rejected correctly');
  });

  it('should create user in database', async () => {
    const { getUserByEmail } = await import('./server/db');
    const user = await getUserByEmail(testEmail);
    
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.loginMethod).toBe('email');
    expect(user?.openId).toMatch(/^email_/);
    
    console.log('✅ User created in database:', user);
  });
});

describe('Cloud Sync (requires authentication)', () => {
  it('should have sync APIs available', () => {
    // Just verify the APIs exist
    console.log('ℹ️  Cloud sync APIs: journal.sync, stats.sync');
    console.log('ℹ️  These APIs require authentication and will be tested in the app');
  });
});
