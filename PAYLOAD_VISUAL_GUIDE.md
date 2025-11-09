# 📊 Payload Changes - Visual Guide

## Before vs After Comparison

### 1. User Registration

#### ❌ BEFORE (Wrong)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "country": "USA"              // ❌ NOT IN DTO
}
```

#### ✅ AFTER (Correct)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "avatar_url": "/path/to/avatar.jpg",    // ✅ NEW
  "bio": "Software Developer",            // ✅ NEW
  "location": "San Francisco, USA",       // ✅ NEW
  "timezone": "America/Los_Angeles"       // ✅ NEW
}
```

---

### 2. Create Team

#### ❌ BEFORE (Wrong)
```json
{
  "name": "Development Team",
  "description": "Our development team",
  "status": "active"                // ❌ NOT IN DTO
}
```

#### ✅ AFTER (Correct)
```json
{
  "name": "Development Team",
  "description": "Our development team",
  "slug": "development-team",       // ✅ NEW
  "is_private": false,              // ✅ NEW
  "logo_url": "/logos/dev-team.png" // ✅ NEW
}
```

---

### 3. Create Project

#### ❌ BEFORE (Wrong)
```json
{
  "name": "New Project",
  "description": "Project description",
  "category": "Technology",         // ❌ NOT IN DTO
  "status": "active",               // ❌ NOT IN DTO
  "visibility": "public",
  "team_id": "team-123"
}
```

#### ✅ AFTER (Correct)
```json
{
  "name": "New Project",
  "description": "Project description",
  "slug": "new-project",            // ✅ NEW (REQUIRED)
  "visibility": "public",
  "team_id": "team-123",
  "is_password_protected": false,   // ✅ NEW
  "password": "optional-password"   // ✅ NEW
}
```

---

### 4. Create Project Item

#### ❌ BEFORE (Wrong)
```json
{
  "title": "Item Title",            // ❌ WRONG FIELD NAME
  "description": "Item description",
  "status": "pending",              // ❌ NOT IN DTO
  "priority": "high",               // ❌ NOT IN DTO
  "type": "task"                    // ❌ NOT IN DTO
}
```

#### ✅ AFTER (Correct)
```json
{
  "name": "Item Title",             // ✅ RENAMED FROM "title"
  "description": "Item description",
  "content": "Item content or file data",     // ✅ NEW (REQUIRED)
  "mime_type": "text/plain",                 // ✅ NEW
  "order": 1,                                // ✅ NEW
  "is_watermarked": false,                   // ✅ NEW
  "language": "en"                           // ✅ NEW
}
```

---

### 5. Grant Project Access

#### ❌ BEFORE (Wrong)
```json
{
  "user_id": "user-456",           // ❌ NOT IN DTO
  "access_type": "view"
}
```

#### ✅ AFTER (Correct)
```json
{
  "access_type": "view",
  "allow_download": true,          // ✅ NEW
  "allow_share": false,            // ✅ NEW
  "allow_view_notifications": true, // ✅ NEW
  "expires_at": "2024-12-09T00:00:00Z" // ✅ NEW
}
```

---

### 6. Create Donation

#### ❌ BEFORE (Wrong)
```json
{
  "project_id": "project-123",     // ❌ NOT IN DTO
  "amount": 50.00,
  "currency": "USD",
  "payment_method": "stripe"
}
```

#### ✅ AFTER (Correct)
```json
{
  "amount": 50.00,
  "currency": "USD",
  "payment_method": "stripe",
  "is_recurring": false,            // ✅ NEW
  "recurring_frequency": "monthly", // ✅ NEW
  "message": "Great work!"          // ✅ NEW
}
```

---

### 7. Create Sponsorship

#### ❌ BEFORE (Wrong)
```json
{
  "project_id": "project-123",     // ❌ NOT IN DTO
  "tier": "gold",
  "recurring_frequency": "monthly" // ❌ NOT IN DTO (wrong field)
}
```

#### ✅ AFTER (Correct)
```json
{
  "tier": "gold",
  "amount": 100.00,                        // ✅ NEW (REQUIRED)
  "currency": "USD",                       // ✅ NEW
  "start_date": "2024-11-09T00:00:00Z",   // ✅ NEW (REQUIRED)
  "end_date": "2024-12-09T00:00:00Z",     // ✅ NEW
  "auto_renew": true,                      // ✅ NEW
  "message": "Thanks for the sponsorship!" // ✅ NEW
}
```

---

## 📋 Field Mapping Reference

### Removed Fields (Don't Use Anymore)
```
User:              country
Team:              status (from request)
Project:           category, status (from request)
ProjectItem:       title, status, priority, type
ProjectAccess:     user_id
Donation:          project_id
Sponsorship:       project_id, recurring_frequency (from request)
```

### Renamed Fields (Use New Names)
```
ProjectItem.title  →  ProjectItem.name
```

### Added Required Fields (Must Include)
```
Project.slug          ← Always required
ProjectItem.content   ← Always required
Sponsorship.amount    ← Always required
Sponsorship.start_date ← Always required
```

### Added Optional Fields (Can Include)
```
User:             avatar_url, bio, location, timezone
Team:             slug, is_private, logo_url
Project:          is_password_protected, password
ProjectItem:      mime_type, order, is_watermarked, language
ProjectAccess:    allow_download, allow_share, allow_view_notifications, expires_at
Donation:         is_recurring, recurring_frequency, message
Sponsorship:      currency, end_date, auto_renew, message
```

---

## ✅ Validation Rules

### All Endpoints Now Require
- ✅ Exact field names (no extra variations)
- ✅ Correct data types
- ✅ Only defined fields
- ✅ All required fields

### Validation Pipeline
```
Request Body
    ↓
DTO Class Validation
    ↓
Check Required Fields
    ↓
Check Field Types
    ↓
Check Field Names
    ↓
✅ Accept or ❌ Reject with 400 Bad Request
```

---

## 🔍 Error Examples

### ❌ Still Using Old Fields
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "country": "USA"
}
```

**Error:** `extra field "country" is not allowed`

### ❌ Wrong Field Names
```json
{
  "title": "Item Title",
  "description": "Description",
  "content": "Content"
}
```

**Error:** `property title should not exist`

### ❌ Missing Required Fields
```json
{
  "name": "My Project",
  "visibility": "public"
  // Missing: slug
}
```

**Error:** `field slug is required`

### ✅ Correct Request
```json
{
  "name": "My Project",
  "slug": "my-project",
  "visibility": "public"
}
```

**Response:** `201 Created`

---

## 🎯 Testing Checklist

Before using updated endpoints:

- [ ] Use correct field names (e.g., `name` not `title`)
- [ ] Include all required fields
- [ ] Check field data types
- [ ] Don't send removed fields
- [ ] Use correct enum values
- [ ] Format dates correctly (ISO 8601)
- [ ] Test with frontend validation

---

## 💾 Copy-Paste Templates

### Create Team
```json
{
  "name": "Your Team Name",
  "description": "Your description",
  "slug": "your-team-slug",
  "is_private": false,
  "logo_url": ""
}
```

### Create Project
```json
{
  "name": "Your Project",
  "description": "Your description",
  "slug": "your-project-slug",
  "visibility": "public",
  "team_id": null,
  "is_password_protected": false,
  "password": null
}
```

### Create Project Item
```json
{
  "name": "Item Name",
  "description": "Item description",
  "content": "Item content",
  "mime_type": "text/plain",
  "order": 1,
  "is_watermarked": false,
  "language": "en"
}
```

### Create Donation
```json
{
  "amount": 50,
  "currency": "USD",
  "payment_method": "stripe",
  "is_recurring": false,
  "recurring_frequency": null,
  "message": ""
}
```

### Create Sponsorship
```json
{
  "tier": "gold",
  "amount": 100,
  "currency": "USD",
  "start_date": "2024-11-09T00:00:00Z",
  "end_date": "2024-12-09T00:00:00Z",
  "auto_renew": true,
  "message": ""
}
```

---

**Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Status:** ✅ READY FOR PRODUCTION
