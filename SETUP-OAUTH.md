# OAuth Setup Guide - HubSpot & Google Sheets Integration

This guide will walk you through setting up OAuth authentication for both HubSpot and Google Sheets to make your bi-directional sync platform fully functional.

## Table of Contents
1. [HubSpot OAuth Setup](#hubspot-oauth-setup)
2. [Google Cloud OAuth Setup](#google-cloud-oauth-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Testing OAuth Connections](#testing-oauth-connections)

---

## HubSpot OAuth Setup

### Step 1: Create a HubSpot Developer Account

1. Go to [HubSpot Developers](https://developers.hubspot.com/)
2. Sign in with your HubSpot account (or create one)
3. Navigate to **Apps** in the top menu

### Step 2: Create a New App

1. Click **"Create app"** button
2. Fill in the app details:
   - **App name**: `HubSpot Bi-Directional Sync` (or your preferred name)
   - **Description**: `Enterprise-grade bi-directional data synchronization platform`
   - **App logo**: (Optional) Upload your logo

### Step 3: Configure Auth Settings

1. In your app dashboard, navigate to the **"Auth"** tab
2. Configure the following:

   **Redirect URLs:**
   ```
   http://localhost:3000/api/auth/hubspot/callback
   ```

   > **Note**: For production, add your production domain:
   > `https://yourdomain.com/api/auth/hubspot/callback`

3. **Scopes** - Select the following scopes:

   **CRM Scopes (Required):**
   - ✅ `crm.objects.contacts.read` - Read contacts
   - ✅ `crm.objects.contacts.write` - Write contacts
   - ✅ `crm.objects.companies.read` - Read companies
   - ✅ `crm.objects.companies.write` - Write companies
   - ✅ `crm.objects.deals.read` - Read deals
   - ✅ `crm.objects.deals.write` - Write deals

   **Additional Scopes:**
   - ✅ `crm.schemas.contacts.read` - Read contact properties
   - ✅ `crm.schemas.companies.read` - Read company properties
   - ✅ `crm.schemas.deals.read` - Read deal properties
   - ✅ `oauth` - OAuth access

4. Click **"Save"** or **"Update"**

### Step 4: Get Your Credentials

1. In the **"Auth"** tab, you'll find:
   - **Client ID**: Copy this value
   - **Client Secret**: Click "Show" and copy this value

   > ⚠️ **Important**: Keep your Client Secret secure! Never commit it to version control.

2. Note down these values - you'll need them for environment variables.

### Step 5: Install Your App (For Testing)

1. Go to the **"Auth"** tab
2. Click **"Test in your portal"** or use the **"Install URL"**
3. This will be the URL users click to authorize your app

---

## Google Cloud OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Project details:
   - **Project name**: `HubSpot Sync Platform`
   - **Organization**: (Select if applicable)
4. Click **"Create"**

### Step 2: Enable Google Sheets API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**
4. Also enable **"Google Drive API"** (recommended for file access)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **User Type**:
   - **Internal**: Only for Google Workspace users in your organization
   - **External**: For any Google account (choose this for testing)
3. Click **"Create"**

4. **App Information:**
   - **App name**: `HubSpot Sync Platform`
   - **User support email**: Your email
   - **App logo**: (Optional)
   - **Application home page**: `http://localhost:3000`
   - **Authorized domains**: Leave empty for localhost testing

5. **Developer contact information**: Your email
6. Click **"Save and Continue"**

7. **Scopes** - Click **"Add or Remove Scopes"**:
   - ✅ `https://www.googleapis.com/auth/spreadsheets` - Read/write sheets
   - ✅ `https://www.googleapis.com/auth/drive.file` - Access created files
   - ✅ `https://www.googleapis.com/auth/userinfo.email` - User email
   - ✅ `https://www.googleapis.com/auth/userinfo.profile` - User profile

8. Click **"Update"** → **"Save and Continue"**

9. **Test users** (if using External):
   - Click **"Add Users"**
   - Add your Google account email
   - Click **"Save and Continue"**

10. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `HubSpot Sync Web Client`

5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```

6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/google/callback
   ```

   > **Note**: For production, add:
   > `https://yourdomain.com/api/auth/google/callback`

7. Click **"Create"**

### Step 5: Get Your Credentials

1. A dialog will appear with:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value

2. You can also download the JSON file for reference
3. Click **"OK"**

> ⚠️ **Important**: Keep your Client Secret secure!

---

## Environment Variables Configuration

### Step 1: Update .env.local File

Open or create `.env.local` in your project root:

```bash
# Database
DATABASE_URL="postgresql://hubspot_user:hubspot_password@localhost:5432/hubspot_sync"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# HubSpot OAuth
HUBSPOT_CLIENT_ID=your_hubspot_client_id_here
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret_here
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/hubspot/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it as your `NEXTAUTH_SECRET` value.

### Step 3: Replace Placeholder Values

Replace the following with your actual values:

- `your_hubspot_client_id_here` → Your HubSpot Client ID
- `your_hubspot_client_secret_here` → Your HubSpot Client Secret
- `your_google_client_id_here` → Your Google Client ID
- `your_google_client_secret_here` → Your Google Client Secret
- `your_nextauth_secret_here` → Generated NextAuth secret

### Example .env.local:

```bash
# Database
DATABASE_URL="postgresql://hubspot_user:hubspot_password@localhost:5432/hubspot_sync"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# HubSpot OAuth
HUBSPOT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
HUBSPOT_CLIENT_SECRET=abcdef12-3456-7890-abcd-ef1234567890
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/hubspot/callback

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing OAuth Connections

### Step 1: Restart Your Dev Server

After updating environment variables, restart the development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 2: Test HubSpot Connection

1. Open your browser: `http://localhost:3000`
2. Navigate to **"Connections"** page
3. Click **"Connect HubSpot"** button
4. You should be redirected to HubSpot's authorization page
5. Review permissions and click **"Connect app"**
6. You'll be redirected back to your app
7. Connection status should show **"Connected"**

### Step 3: Test Google Sheets Connection

1. On the **"Connections"** page
2. Click **"Connect Google Sheets"** button
3. You should be redirected to Google's OAuth consent screen
4. Choose your Google account
5. Review permissions and click **"Allow"**
6. You'll be redirected back to your app
7. Connection status should show **"Connected"**

### Step 4: Verify in Database

Check that accounts are stored in the database:

```bash
npx prisma studio
```

Navigate to the `Account` model and verify you see records with:
- `hubspotAccountId` for HubSpot
- `accessToken` and `refreshToken` for both services

---

## Troubleshooting

### HubSpot Issues

**Problem**: "redirect_uri_mismatch" error

**Solution**:
- Verify the redirect URI in HubSpot app settings exactly matches: `http://localhost:3000/api/auth/hubspot/callback`
- No trailing slash
- Check for http vs https

**Problem**: "insufficient_scope" error

**Solution**:
- Go to HubSpot App settings → Auth tab
- Ensure all required scopes are checked
- Reinstall the app in your test portal

### Google Issues

**Problem**: "redirect_uri_mismatch" error

**Solution**:
- Verify the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/google/callback`
- Check Authorized redirect URIs in OAuth client settings

**Problem**: "access_denied" or "This app isn't verified"

**Solution**:
- Click "Advanced" → "Go to [App Name] (unsafe)"
- This is normal for apps in development/testing mode
- For production, submit app for verification

**Problem**: "invalid_client" error

**Solution**:
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in .env.local
- Ensure no extra spaces or quotes
- Regenerate credentials if needed

### General Issues

**Problem**: Environment variables not loading

**Solution**:
- Ensure file is named exactly `.env.local` (not `.env.local.txt`)
- Restart dev server after changing .env.local
- Check for syntax errors (no spaces around =)

**Problem**: 404 on callback routes

**Solution**:
- Ensure API routes are created (next step in implementation)
- Check file structure: `app/api/auth/[provider]/callback/route.ts`

---

## Next Steps

After completing OAuth setup:

1. ✅ Implement OAuth callback API routes
2. ✅ Test connection flow end-to-end
3. ✅ Implement token refresh logic
4. ✅ Create sync configuration with real data
5. ✅ Test bi-directional sync

---

## Security Best Practices

1. **Never commit secrets**: Add `.env.local` to `.gitignore`
2. **Use environment variables**: Never hardcode credentials
3. **Rotate secrets regularly**: Change secrets periodically
4. **Limit scopes**: Only request permissions you need
5. **Validate tokens**: Always verify and refresh tokens
6. **Use HTTPS in production**: Never use OAuth over HTTP in production

---

## Production Considerations

When deploying to production:

1. Update redirect URIs to your production domain
2. Use environment variables from your hosting platform
3. Enable Google App verification
4. Set up proper error logging
5. Implement rate limiting
6. Add monitoring for token expiration
7. Set up automated token refresh

---

## Support

For issues:
- HubSpot: [HubSpot Developer Docs](https://developers.hubspot.com/docs/api/oauth/overview)
- Google: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**You're all set!** 🎉

Your OAuth credentials are configured. Next, we'll implement the API routes to handle the OAuth flow.
