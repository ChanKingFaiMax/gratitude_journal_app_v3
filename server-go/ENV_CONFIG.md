# Go Backend Environment Configuration

This document describes the environment variables needed for the Go backend.

## Required Environment Variables

```bash
# Server Configuration
PORT=3000
ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gratitude_journal?sslmode=disable

# JWT
JWT_SECRET=your_random_jwt_secret_here_change_in_production
JWT_EXPIRY=168h

# OpenRouter AI Service
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Firebase (Optional - for Firebase Authentication)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Email Service (for verification codes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=Awaken <your-email@gmail.com>

# CORS
CORS_ORIGINS=http://localhost:8081,https://your-app.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_DURATION=1m
```

## How to Configure

1. Copy the above configuration to a `.env` file in the `server-go/` directory
2. Update the values with your actual credentials
3. Never commit `.env` file to version control
