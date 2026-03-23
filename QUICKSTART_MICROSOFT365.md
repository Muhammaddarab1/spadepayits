# Quick Start Guide - Microsoft 365 Integration

Get your system up and running in 5 easy steps.

---

## 📋 Pre-requisites

- Microsoft 365 tenant (Office 365 account)
- Azure AD admin access
- Server running
- Gmail account OR Office 365 mailbox (for email)

---

## ⚡ 5-Minute Setup

### Step 1: Get Azure AD Credentials (10 min)

1. Go to https://portal.azure.com
2. Search for "App registrations" → Click "New registration"
3. Name it `Ticket System`
4. Click "Register"

**Copy these 3 values:**

```
Tenant ID (Directory ID):    ________________________
Client ID (App ID):          ________________________
Client Secret:               ________________________  (Make new one in "Certificates & secrets")
```

5. Go to **API permissions** → **+ Add permission**
6. Select **Microsoft Graph** → **Application permissions**
7. Search and select `User.Read.All`
8. Click **Grant admin consent for [Your org]**

### Step 2: Update .env File (2 min)

Edit `server/.env`:

```env
AZURE_TENANT_ID=paste-tenant-id-here
AZURE_CLIENT_ID=paste-client-id-here
AZURE_CLIENT_SECRET=paste-client-secret-here

# For Office 365
EMAIL_SERVICE=office365
EMAIL_FROM=noreply@company.com
EMAIL_USER=your-email@company.onmicrosoft.com
EMAIL_PASSWORD=your-password

# OR for Gmail
# EMAIL_SERVICE=gmail
# EMAIL_FROM=your-email@gmail.com
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=google-app-password
```

### Step 3: Install Dependencies (3 min)

```bash
cd server
npm install
npm start
```

### Step 4: Restart Server

Just restart your server. New packages should load.

### Step 5: Test & Sync (2 min)

1. Open admin panel → Users page
2. Scroll to blue **"Microsoft 365 Integration"** section
3. Click **"📥 Sync All Users from Microsoft"**
4. See your users synced! ✨

---

## ✉️ Test Email Notifications

1. In same panel, click **"✉️ Test Email Configuration"**
2. Should show "✓ Email configuration is working!"
3. Create a ticket, assign it
4. Check your email! 📧

---

## 🎯 That's It!

You now have:
- ✅ Users synced from Microsoft 365
- ✅ Automatic email notifications
- ✅ Admin dashboard for managing sync

---

## 🚨 Common Issues

### Still can't sync?

**Check 1:** Are env vars restarted?
```bash
# Stop server (Ctrl+C)
# Restart
npm start
```

**Check 2:** Go to https://portal.azure.com and verify:
- App registration exists
- Client secret not expired
- API permissions have checkmark ✓

**Check 3:** Check server logs for error messages

### Emails not working?

Click **"✉️ Test Email Configuration"** button to debug.

**For Office 365 with 2FA:**
- Don't use regular password
- Use "App password" instead
- Generate one in Microsoft account security settings

---

## 📚 For More Details

See `MICROSOFT_365_SETUP.md` for:
- Detailed troubleshooting
- Advanced customization
- Email template customization
- Automatic scheduled syncs

---

## 🆘 Still Stuck?

1. Check server console for error messages
2. Read `MICROSOFT_365_SETUP.md` troubleshooting section
3. Verify Azure AD app configuration
4. Test email with "Test Email" button in admin panel
