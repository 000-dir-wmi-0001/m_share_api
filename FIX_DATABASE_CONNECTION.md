# 🔧 Fix Database Connection - Two Options

## ❌ Current Problem

Your `.env` file points to a database that doesn't exist:
- Database: `app_db` 
- Server: `ep-polished-butterfly-a8ek3gmo-pooler.eastus2.azure.neon.tech`
- Error: `database "app_db" does not exist`

---

## ✅ OPTION 1: Create Database in Neon (EASIEST)

### Step 1: Open Neon Console
1. Go to: https://console.neon.tech
2. Login with your account

### Step 2: Create a new database
1. Click on your project (M-Share or similar)
2. Click **Create Database**
3. Enter name: `app_db`
4. Click **Create**

### Step 3: Get the connection string
1. Click on the database name
2. Copy the **Connection string** (Full URL)
3. It should look like:
   ```
   postgresql://neondb_owner:PASSWORD@HOST/app_db?sslmode=require
   ```

### Step 4: Update `.env` file
```properties
DATABASE_URL=postgresql://neondb_owner:PASSWORD@HOST/app_db?sslmode=require
```

### Step 5: Run backend
```bash
npm run start:dev
```

✅ Done! TypeORM will auto-create all tables.

---

## ✅ OPTION 2: Use Existing Database

If you already have a working Neon project:

### Step 1: Get correct connection string
1. Go to https://console.neon.tech
2. Find your project with data
3. Copy the **Connection string**

### Step 2: Update `.env`
```properties
DATABASE_URL=postgresql://user:password@host/database_name?sslmode=require
PGHOST=host
PGDATABASE=database_name
PGUSER=user
PGPASSWORD=password
```

### Step 3: Run backend
```bash
npm run start:dev
```

---

## ✅ OPTION 3: Delete Everything and Start Fresh

**If you want a completely new database:**

### Step 1: Delete current Neon branch
1. Go to https://console.neon.tech
2. Find your project
3. Delete the current branch

### Step 2: Create new branch
1. Click **Create Branch**
2. Name it "main"
3. Click **Create**

### Step 3: Get new connection details
1. Click on the new branch
2. Copy the connection string
3. Update `.env`

### Step 4: Run backend
```bash
npm run start:dev
```

---

## 🔍 Verify Current Connection

Check what Neon databases you have:

### In Neon Console:
1. Go to https://console.neon.console
2. Click on your project name
3. You should see branches with databases listed

### What you need:
- ✅ Project name
- ✅ Database name (e.g., "neondb" or "app_db")
- ✅ Full connection string
- ✅ Username and password

---

## 📝 Update `.env` Template

Once you have the details, update your `.env`:

```properties
# From Neon Console Connection String
PGHOST=your-host.neon.tech
PGDATABASE=your_database_name
PGUSER=neondb_owner
PGPASSWORD=your_password
DATABASE_URL=postgresql://neondb_owner:your_password@your-host.neon.tech/your_database_name?sslmode=require

# Application
APP_PORT=3000
API_PORT=3000
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:3001
FRONTEND_URLS=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

---

## ✅ After Updating .env

```bash
# 1. Restart backend
npm run start:dev

# 2. Wait for startup message
# Should see: ✅ M-Share API v1.0.0

# 3. Test registration
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123"}'

# 4. Expected response: 201 Created
```

---

**Action:** Go to https://console.neon.tech and create the `app_db` database 🚀
