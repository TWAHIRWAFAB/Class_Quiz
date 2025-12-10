# GitHub Actions Notifications Setup

This document explains how to configure email and Slack notifications for the CI/CD pipeline.

## Email Notifications (Gmail)

### Step 1: Create a Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not already enabled)
3. Go to "App passwords" (at the bottom of the page)
4. Select "Mail" and "Windows Computer" (or your device type)
5. Generate an app password - you'll get a 16-character password

### Step 2: Add GitHub Secrets

Go to: **https://github.com/TWAHIRWAFAB/Class_Quiz/settings/secrets/actions**

Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `EMAIL_USERNAME` | `twahirwafabrice12@gmail.com` |
| `EMAIL_PASSWORD` | Your 16-character Gmail app password (from Step 1) |

### Step 3: Verify

The next time a test fails, you'll receive an email at `twahirwafabrice12@gmail.com` with:
- ❌ Failure notification
- Repository and branch info
- Link to view the workflow run

---

## Slack Notifications (Optional)

### Step 1: Create Slack Webhook

1. Go to: https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `Class_Quiz_CI`
4. Choose your Slack workspace
5. Go to "Incoming Webhooks" → "Add New Webhook to Workspace"
6. Select a channel (e.g., #deployments)
7. Copy the Webhook URL

### Step 2: Add GitHub Secret

Go to: **https://github.com/TWAHIRWAFAB/Class_Quiz/settings/secrets/actions**

Add:

| Secret Name | Value |
|-------------|-------|
| `SLACK_WEBHOOK_URL` | Your webhook URL from Step 1 |

### Step 3: Verify

The next push will send a Slack notification with:
- ✅ or ❌ Pipeline status
- Test, Build, Lint, Security job results
- Link to view the workflow

---

## What You Receive

### 📧 Email (on test failure)
- Subject: `❌ CI/CD Pipeline Test Failed`
- Shows which tests failed
- Direct link to workflow run

### 💬 Slack (on every push)
- Shows all job statuses (Lint, Test, Build, Security)
- Color-coded (green for success, red for failure)
- Quick link to view workflow details

---

## Troubleshooting

**Email not received?**
- Check Gmail app password is correct
- Check email is not in spam
- Verify secrets are added to GitHub (Settings → Secrets and variables → Actions)

**Slack notification not sent?**
- Verify webhook URL is correct
- Check the webhook channel still exists
- Confirm secret is added to GitHub

---

## To Test Manually

Run a test workflow to verify notifications:
```bash
git commit --allow-empty -m "Test notifications"
git push origin main
```

Then check:
- ✅ GitHub Actions runs the workflow
- ✅ Email received (if tests fail)
- ✅ Slack message sent (if webhook configured)
