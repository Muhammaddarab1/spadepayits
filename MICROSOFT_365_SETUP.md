# Microsoft 365 Integration & Email Notifications Setup

## Overview

This guide explains how to integrate Microsoft Outlook/Office 365 with your ticket management system. Users are synced from your Microsoft 365 tenant, and automatic email notifications are sent when tickets are assigned or updated.

---

## What Gets Set Up

### 1. **User Synchronization**
- Pull user list from your Microsoft 365 tenant
- Create local user accounts automatically
- Update user profile data (name, email, department, job title)
- Track which users are synced via `microsoftId` field

### 2. **Email Notifications**
- Send HTML emails when tickets are assigned
- Notify users of status changes
- Configurable SMTP (Office 365, Gmail, or generic)
- Non-blocking notifications (don't delay ticket creation)

### 3. **Admin Interface**
- One-click sync button in Users management page
- Sync status dashboard showing statistics
- Email configuration testing tool

---

## Setup Steps

### Step 1: Create Azure AD Application

You need to register an app in Azure to authenticate with Microsoft Graph API.

**In Azure Portal:**

1. Go to **Azure portal** (https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**
4. Fill in:
   - **Name:** `Ticket System`
   - **Supported account types:** Single tenant (your organization only)
5. Click **Register**

**Copy these values** (you'll need them):
- **Application (client) ID** → Save as `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → Save as `AZURE_TENANT_ID`

**Create Client Secret:**

1. In app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Set expiry (e.g., 24 months)
4. Copy the **Value** → Save as `AZURE_CLIENT_SECRET`

**Set API Permissions:**

1. Go to **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Search and add:
   - `User.Read.All` (read all users)
   - `Mail.Send` (optional, for sending emails via API)
6. Click **Grant admin consent**

---

### Step 2: Configure Environment Variables

Add these variables to your `.env` file in the server directory:

```env
# Azure AD / Microsoft 365
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Email Configuration (choose one)
EMAIL_SERVICE=office365
EMAIL_FROM=noreply@yourcompany.com
EMAIL_USER=your-email@company.onmicrosoft.com
EMAIL_PASSWORD=your-app-password-or-password
```

**Email Service Options:**

#### Option A: Office 365 (SMTP)
```env
EMAIL_SERVICE=office365
EMAIL_FROM=noreply@yourcompany.com
EMAIL_USER=your-account@company.onmicrosoft.com
EMAIL_PASSWORD=your-password
```

#### Option B: Gmail (SMTP)
```env
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use App Password, not regular password
```

#### Option C: Generic SMTP
```env
EMAIL_SERVICE=generic
EMAIL_FROM=noreply@company.com
EMAIL_USER=your-email@company.com
EMAIL_PASSWORD=your-password
SMTP_HOST=mail.company.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

### Step 3: Install Dependencies

In your server directory:

```bash
npm install
```

The following packages are already added:
- `@azure/identity` - Azure authentication
- `@microsoft/microsoft-graph-client` - Microsoft Graph API client
- `axios` - HTTP client
- `nodemailer` - Email sending

---

### Step 4: Verify Configuration

**Test Microsoft Connection:**

1. Go to **Users** page (admin only)
2. Scroll to **Microsoft 365 Integration** panel
3. Click **Sync All Users from Microsoft** button
4. Should show number of users synced

**Test Email Configuration:**

1. In same panel, click **✉️ Test Email Configuration**
2. Should show success message if configured correctly

---

## How It Works

### User Sync Process

```
Admin clicks "Sync All Users from Microsoft"
         ↓
API calls Microsoft Graph API
         ↓
Fetches all users from tenant
         ↓
For each user:
  - Check if already exists in DB
  - Create new user OR update existing user
  - Assign "User" role and default permissions
  - Generate random password (user must reset on first login)
         ↓
Display sync summary with counts
```

### Email Notification Flow

```
Admin assigns ticket to user
         ↓
Ticket saved to database
         ↓
Background job triggered (non-blocking)
         ↓
Fetch assignee email from database
         ↓
Send HTML email via configured SMTP
         ↓
User receives notification
```

### Email Templates

**Ticket Assignment Email:**
- Shows ticket title, description, priority
- Includes "View Ticket" button
- Links to application

**Status Change Email:**
- Shows old and new status
- Notifies assignees + ticket creator
- Includes ticket link

---

## API Endpoints

### GET `/api/sync/status`
Get current sync configuration and statistics.

**Admin only**

**Response:**
```json
{
  "microsoftConfigured": true,
  "microsoftMessage": "Microsoft Azure configuration is valid",
  "syncStats": {
    "totalUsers": 45,
    "syncedUsers": 35,
    "unsyncedUsers": 10,
    "syncPercentage": 78
  }
}
```

---

### POST `/api/sync/users`
Trigger full sync of all users from Microsoft 365.

**Admin only**

**Response:**
```json
{
  "success": true,
  "message": "Synced 45 users from Microsoft 365",
  "summary": {
    "total": 45,
    "created": 5,
    "updated": 35,
    "skipped": 5,
    "errors": []
  }
}
```

---

### POST `/api/sync/user-by-email`
Sync a specific user by email.

**Admin only**

**Request:**
```json
{
  "email": "john.doe@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created from Microsoft 365 data",
  "created": true
}
```

---

### GET `/api/sync/test-email`
Test email configuration.

**Admin only**

**Response:**
```json
{
  "success": true,
  "message": "Email configuration is valid"
}
```

---

## Database Changes

The `User` model now includes:

```javascript
{
  microsoftId: String,      // Microsoft user ID
  department: String,       // From Microsoft 365
  jobTitle: String,         // From Microsoft 365
  // ... existing fields ...
}
```

When users are synced from Microsoft, these fields are automatically populated.

---

## File Structure

**New server files:**

```
server/
├── utils/
│   ├── microsoftGraph.js          # Microsoft Graph API client
│   ├── emailService.js            # Email notification service
│   └── userSync.js                # User sync logic
├── routes/
│   └── sync.js                    # Sync API endpoints
└── models/
    └── User.js (updated)          # Added microsoftId, department, jobTitle
```

**Updated files:**

```
server/
├── controllers/
│   └── ticketController.js        # Added email notifications on assign/update
├── server.js                      # Added sync routes
└── package.json                   # Added dependencies

client/
└── src/pages/
    └── Users.jsx                  # Added MicrosoftSyncPanel component
```

---

## Troubleshooting

### "Missing environment variables" Error

**Solution:** Check your `.env` file has:
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

**Steps:**
1. Go to Azure Portal
2. Get values from app registration
3. Add to `.env` file
4. Restart server

---

### "Microsoft Authentication Failed" Error

**Possible causes:**

1. **Wrong credentials** - Copy values exactly from Azure Portal
2. **App permissions not granted** - Go to Azure Portal → API permissions → Grant admin consent
3. **Client secret expired** - Create new secret in Azure Portal

---

### Emails Not Sending

**Troubleshooting steps:**

1. **Test configuration** - Click "✉️ Test Email Configuration" in Users page
2. **Check credentials** - Verify EMAIL_USER and EMAIL_PASSWORD
3. **Check firewall** - SMTP port 587 should be open
4. **Review logs** - Check server console for error messages

**For Office 365:**
- Use your full email as EMAIL_USER
- Verify account has no IP restrictions
- Check if 2FA is enabled (may need App Password instead)

---

### Users Not Syncing

**Check:**

1. Is Microsoft configuration valid? - Should show in sync status
2. Do users exist in Microsoft 365 tenant?
3. Check server logs for error messages
4. Try syncing one user by email first

---

## Features & Permissions

### Required Permissions

Users need `users.manage` permission to:
- Sync users from Microsoft
- Test email configuration
- View sync statistics

This is typically granted to **Admin** role.

### Automatic Notifications

Notifications are sent automatically when:
- ✉️ Ticket is assigned to a user
- 🔄 Ticket status changes
- 📌 Ticket is updated with new assignees

Notifications are **non-blocking** (won't slow down the application).

---

## Customization

### Change Email Templates

Edit in `server/utils/emailService.js`:

- `sendTicketAssignmentEmail()` - Customize ticket assignment email
- `sendTicketStatusChangeEmail()` - Customize status change email

### Change Sync Frequency

Currently manual (admin click), but you can make it automatic:

**Example: Sync every day at midnight**

```javascript
// In server.js
import cron from 'node-cron';
import { syncUsersFromMicrosoft } from './utils/userSync.js';

// Every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled user sync...');
  try {
    const result = await syncUsersFromMicrosoft();
    console.log('Sync completed:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
});
```

---

## Security Notes

1. **Client secrets are sensitive** - Never commit `.env` to version control
2. **Email passwords** - For Office 365, use App-specific passwords if 2FA is enabled
3. **API permissions** - Only assign `User.Read.All`, not admin-level permissions
4. **User passwords** - New synced users get random passwords; they must reset on first login

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review server console logs for error messages
3. Verify Azure AD app registration is complete
4. Test email configuration in UI before syncing users

---

## Summary

You now have:

✅ Microsoft 365 user synchronization
✅ Automatic email notifications on ticket assignment
✅ Admin dashboard for managing sync
✅ Email configuration testing

Users are automatically imported from your Microsoft tenant and kept in sync. When tickets are assigned, they receive professional HTML emails with direct links to the ticket.
