import { describe, it, expect } from 'vitest';

describe('Complete Email Login Flow Test', () => {
  const testEmail = 'cloudycaddy@gmail.com';
  let verificationCode = '';
  let sessionToken = '';

  it('Step 1: Send verification code email', async () => {
    console.log('\n📧 Step 1: Sending verification code to', testEmail);
    
    // Use the tRPC client directly
    const { trpc } = await import('./lib/trpc-server-test');
    
    try {
      const result = await trpc.auth.sendVerificationCode({
        email: testEmail,
        language: 'zh',
      });
      
      expect(result.success).toBe(true);
      console.log('✅ Verification code sent successfully');
      console.log('📬 Please check your email inbox:', testEmail);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }, 30000);

  it('Step 2: Retrieve verification code from database', async () => {
    console.log('\n🔍 Step 2: Retrieving verification code from database');
    
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
    
    console.log('✅ Verification code retrieved:', verificationCode);
    console.log('⏰ Expires at:', new Date(result[0].expiresAt).toLocaleString());
  });

  it('Step 3: Login with verification code', async () => {
    console.log('\n🔐 Step 3: Logging in with verification code');
    
    const { trpc } = await import('./lib/trpc-server-test');
    
    try {
      const result = await trpc.auth.verifyEmailCode({
        email: testEmail,
        code: verificationCode,
      });
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.sessionToken).toBeDefined();
      
      sessionToken = result.sessionToken;
      
      console.log('✅ Login successful!');
      console.log('👤 User:', result.user);
      console.log('🎫 Session token:', sessionToken.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  });

  it('Step 4: Verify user created in database', async () => {
    console.log('\n👤 Step 4: Verifying user in database');
    
    const { getUserByEmail } = await import('./server/db');
    const user = await getUserByEmail(testEmail);
    
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.loginMethod).toBe('email');
    expect(user?.openId).toMatch(/^email_/);
    
    console.log('✅ User verified in database');
    console.log('   ID:', user?.id);
    console.log('   OpenID:', user?.openId);
    console.log('   Login Method:', user?.loginMethod);
  });

  it('Step 5: Test cloud sync - Create journal entry', async () => {
    console.log('\n📝 Step 5: Testing cloud sync - Creating journal entry');
    
    const { getUserByEmail, syncJournalEntries } = await import('./server/db');
    const user = await getUserByEmail(testEmail);
    
    if (!user) throw new Error('User not found');
    
    const testEntry = {
      localId: `test_${Date.now()}`,
      topic: '测试日记',
      content: '这是一条测试日记，用于验证云端同步功能。',
      source: 'free' as const,
      mastersSummary: [],
      formlessReflection: undefined,
      language: 'zh' as const,
      localCreatedAt: new Date(),
      localUpdatedAt: new Date(),
    };
    
    const synced = await syncJournalEntries(user.id, [testEntry]);
    
    expect(synced.length).toBeGreaterThan(0);
    expect(synced[0].topic).toBe(testEntry.topic);
    expect(synced[0].content).toBe(testEntry.content);
    
    console.log('✅ Journal entry synced to cloud');
    console.log('   Entry ID:', synced[0].id);
    console.log('   Topic:', synced[0].topic);
  });

  it('Step 6: Test cloud sync - Retrieve entries', async () => {
    console.log('\n📥 Step 6: Testing cloud sync - Retrieving entries');
    
    const { getUserByEmail } = await import('./server/db');
    const { getDb } = await import('./server/db');
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const { journalEntries } = await import('./drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const user = await getUserByEmail(testEmail);
    
    if (!user) throw new Error('User not found');
    
    const entries = await db.select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, user.id));
    
    expect(entries.length).toBeGreaterThan(0);
    
    console.log('✅ Retrieved', entries.length, 'entries from cloud');
    console.log('   Latest entry:', entries[0].topic);
  });
});
