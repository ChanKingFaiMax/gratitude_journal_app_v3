import { describe, it, expect } from 'vitest';

describe('Email Service Test', () => {
  it('should send verification code email', async () => {
    const testEmail = 'cloudycaddy@gmail.com'; // Send to self for testing
    
    const response = await fetch('http://localhost:3000/api/trpc/auth.sendVerificationCode?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        0: {
          email: testEmail,
          language: 'zh',
        },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data[0].result.data.success).toBe(true);

    console.log('✅ Email sent successfully! Check your inbox at', testEmail);
  }, 30000); // 30 second timeout for email sending
});
