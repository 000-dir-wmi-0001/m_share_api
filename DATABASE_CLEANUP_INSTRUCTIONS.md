# 🧹 Database Cleanup Guide

## Overview

Two scripts have been created to clean your database:

1. **database-cleanup.sql** - SQL script (run in Neon Console or psql)
2. **database-cleanup.js** - Node.js script (run from terminal)

---

## ✅ Option 1: Using Node.js Script (EASIEST)

### Step 1: Run the cleanup script

```bash
node database-cleanup.js
```

### Expected Output

```
🔗 Connecting to database...
✅ Connected!

🗑️  Dropping tables...
  ✓ DROP TABLE IF EXISTS "typeorm_metadata" CASCADE
  ✓ DROP TABLE IF EXISTS "notifications" CASCADE
  ✓ DROP TABLE IF EXISTS "sponsorships" CASCADE
  ... (more tables)

🗑️  Dropping enums...
  ✓ DROP TYPE IF EXISTS "public"."users_status_enum" CASCADE
  ... (more enums)

✅ Database cleanup complete!

📋 Remaining tables in public schema:
   ✓ No tables found (database is clean)

🚀 Ready to run: npm run start:dev
```

### Step 2: Start backend

```bash
npm run start:dev
```

TypeORM will automatically create all tables with the correct schema.

---

## ✅ Option 2: Using SQL Script in Neon Console

### Step 1: Open Neon Console

1. Go to https://console.neon.tech
2. Login to your account
3. Select your M-Share project
4. Click on "SQL Editor"

### Step 2: Copy and paste the SQL

1. Open `database-cleanup.sql`
2. Copy all the SQL code
3. Paste into Neon's SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Wait for completion

You should see:
```
Database cleanup complete!
```

And the query result should show:
```
table_name
----------
(0 rows)
```

### Step 4: Start backend

```bash
npm run start:dev
```

---

## ✅ Option 3: Using psql Command Line

If you have `psql` installed locally:

```bash
psql $DATABASE_URL -f database-cleanup.sql
```

---

## 🔄 What Gets Deleted

### Tables Dropped
- ✓ notifications
- ✓ sponsorships
- ✓ donations
- ✓ team_settings
- ✓ user_settings
- ✓ team_members
- ✓ team_invitations
- ✓ teams
- ✓ activities
- ✓ file_versions
- ✓ project_files
- ✓ project_access
- ✓ project_items
- ✓ projects
- ✓ users
- ✓ typeorm_metadata

### Enums Dropped
- ✓ users_status_enum
- ✓ project_items_file_type_enum
- ✓ project_access_access_type_enum
- ✓ activities_type_enum
- ✓ projects_status_enum
- ✓ projects_visibility_enum
- ✓ team_invitations_status_enum
- ✓ teams_status_enum
- ✓ team_members_role_enum
- ✓ team_members_status_enum
- ✓ donations_status_enum
- ✓ donations_payment_method_enum
- ✓ donations_recurring_frequency_enum
- ✓ notifications_type_enum
- ✓ notifications_status_enum
- ✓ sponsorships_tier_enum
- ✓ sponsorships_status_enum

---

## ⚠️ Important Notes

- ❌ **ALL DATA WILL BE DELETED** - This is irreversible
- ✅ **Structure will be recreated** - TypeORM will auto-create tables on startup
- ✅ **Safe in development** - Only use on dev databases
- 🔒 **Never run on production** - This will destroy production data

---

## 📋 Complete Workflow

```bash
# 1. Run cleanup
node database-cleanup.js

# 2. Wait for "Database cleanup complete!" message

# 3. Start backend
npm run start:dev

# 4. Wait for server to start
# You should see: "✅ M-Share API v1.0.0"

# 5. Test registration endpoint
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123"}'

# Expected: 201 Created with user data
```

---

## 🐛 Troubleshooting

### "Command not found: node"
- Make sure Node.js is installed
- Run: `node --version`

### "Cannot find module 'pg'"
- Install dependencies: `npm install`

### "FATAL: remaining connection slots are reserved"
- Wait a few seconds and try again
- Or use the SQL script in Neon Console instead

### "column 'name' contains null values"
- Run this script first to clean the database
- Then start the backend

---

## ✅ Next Steps

After cleanup:

1. ✅ Run the cleanup script
2. ✅ Wait for "Database cleanup complete!"
3. ✅ Start backend: `npm run start:dev`
4. ✅ Test registration endpoint
5. ✅ Check if user creation works

---

## 📞 Commands Quick Reference

```bash
# Clean database using Node.js
node database-cleanup.js

# Clean database using psql (if installed)
psql $DATABASE_URL -f database-cleanup.sql

# Start backend after cleanup
npm run start:dev

# Test registration
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePassword123"}'
```

---

**Ready to clean?** Run: `node database-cleanup.js` 🚀
