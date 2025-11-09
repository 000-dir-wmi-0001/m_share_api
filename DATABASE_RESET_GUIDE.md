# 🚨 Database Reset Required - CRITICAL

## ⚠️ Problem

The database has old schema data that's incompatible with the new entity definitions. Specifically:
- The `name` column already exists but has NULL values
- TypeORM cannot add a NOT NULL constraint when NULL values exist
- The schema is corrupted/out of sync

## ✅ Solution: Reset Your Neon Database

### **Method 1: Delete Branch in Neon Console (RECOMMENDED)**

**This is the fastest and cleanest approach:**

1. **Go to Neon Console:**
   - Open: https://console.neon.tech
   - Login to your account

2. **Find your project:**
   - Look for your M-Share project
   - You should see branches (main, staging, etc.)

3. **Delete the current branch:**
   - Click on the branch with bad data
   - Click **Delete**
   - Confirm deletion

4. **Create a new branch:**
   - Click **Create Branch**
   - Name it (e.g., "main" or "dev")
   - Click **Create**

5. **Copy the new connection string:**
   - It will show you the new `DATABASE_URL`
   - Copy the entire connection string

6. **Update your `.env` file:**
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```
   (Paste the new connection string)

7. **Restart backend:**
   ```bash
   npm run start:dev
   ```

---

### **Method 2: Using Raw SQL (Advanced)**

If you want to keep data, clean up manually:

```sql
-- Connect to database
-- Drop and recreate tables manually
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
-- ... drop all other tables

-- Then restart backend with synchronize: true
```

---

## 🔄 Why This Happened

1. Old database had different schema
2. New entities require `name` column to be NOT NULL
3. Old data has NULL values
4. TypeORM synchronize can't resolve the conflict

## ⏱️ Time Required

- **Method 1:** 2-3 minutes
- **Method 2:** 5-10 minutes

## 🎯 After Reset

Once you reset the database:

1. Backend will auto-create all tables with correct schema
2. All endpoints will work
3. You can start testing

## 📋 Checklist

- [ ] Go to Neon console
- [ ] Delete the branch with bad data
- [ ] Create new branch
- [ ] Copy new DATABASE_URL
- [ ] Update `.env` file
- [ ] Restart backend: `npm run start:dev`
- [ ] Check server starts without errors
- [ ] Try registration endpoint

---

**Choose Method 1 (Neon Console) - it's the cleanest solution!**
