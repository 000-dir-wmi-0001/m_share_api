# API Documentation vs DTOs/Entities Mismatch Analysis

## 🔍 Identified Mismatches

### 1. **User Registration (POST /auth/register)**

#### ❌ Current Documentation
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "country": "USA"
}
```

#### ✅ Actual DTO (CreateUserDto)
```typescript
{
  "name": "John Doe",           // ✓ Correct
  "email": "john@example.com",  // ✓ Correct
  "password": "SecurePassword123!",  // ✓ Correct
  "avatar_url"?: string,        // ✗ Missing from docs
  "bio"?: string,               // ✗ Missing from docs
  "location"?: string,          // ✗ Missing from docs
  "timezone"?: string,          // ✗ Missing from docs
  "phone"?: string              // ✓ Correct
  // ❌ "country" field NOT in DTO
}
```

**Issues:**
- ❌ Remove: `country` (not in DTO)
- ✅ Add optional: `avatar_url`, `bio`, `location`, `timezone`

---

### 2. **User Login (POST /auth/login)**

#### Documentation Status: ✅ CORRECT
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

---

### 3. **Team Creation (POST /teams)**

#### ❌ Current Documentation
```json
{
  "name": "Development Team",
  "description": "Our development team",
  "status": "active"
}
```

#### ✅ Actual DTO (CreateTeamDto)
```typescript
{
  "name": "Development Team",        // ✓ Correct
  "description"?: "Our development team",  // ✓ Correct
  "slug"?: string,                   // ✗ Missing from docs
  "is_private"?: boolean,            // ✗ Missing from docs (docs shows "status": "active")
  "logo_url"?: string                // ✗ Missing from docs
  // ❌ "status" NOT in CreateTeamDto
}
```

**Issues:**
- ❌ Remove: `status` (only in response, not in create)
- ✅ Add optional: `slug`, `is_private`, `logo_url`

---

### 4. **Team Update (PUT /teams/:id)**

#### ❌ Current Documentation
```json
{
  "name": "Development Team Updated",
  "description": "Updated description",
  "status": "active"
}
```

#### ✅ Actual DTO (UpdateTeamDto)
```typescript
{
  "name"?: string,              // ✓ Correct
  "description"?: string,       // ✓ Correct
  "is_private"?: boolean,       // ✗ Missing from docs
  "logo_url"?: string           // ✗ Missing from docs
  // ❌ "status" NOT in UpdateTeamDto
}
```

**Issues:**
- ❌ Remove: `status`
- ✅ Add optional: `is_private`, `logo_url`

---

### 5. **Team Stats Response (GET /teams/:id/stats)**

#### ❌ Current Documentation Response
```json
{
  "teamId": "team-123",
  "name": "Development Team",
  "memberCount": 5,
  "projectCount": 3,
  "createdAt": "2024-11-09T00:00:00Z",
  "status": "active"
}
```

**Note:** This response format is not documented in any DTO - needs verification with actual controller

---

### 6. **Add Team Member (POST /teams/:teamId/members)**

#### ❌ Current Documentation
```json
{
  "user_id": "user-456",
  "role": "member"
}
```

#### ✅ Actual DTO (AddTeamMemberDto)
```typescript
{
  "user_id": "user-456",        // ✓ Correct
  "role"?: TeamRole             // ✓ Correct (optional)
  // ✓ All fields correct
}
```

**Status:** ✅ CORRECT

---

### 7. **Update Team Member (PUT /teams/:teamId/members/:id)**

#### ❌ Current Documentation
```json
{
  "role": "admin",
  "status": "active"
}
```

#### ✅ Actual DTO (UpdateTeamMemberDto)
```typescript
{
  "role"?: TeamRole,            // ✓ Correct
  "status"?: MemberStatus       // ✓ Correct
  // ✓ All fields correct
}
```

**Status:** ✅ CORRECT

---

### 8. **Team Invitation (POST /teams/:teamId/invitations)**

#### ❌ Current Documentation
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

#### ✅ Actual DTO (InviteToTeamDto)
```typescript
{
  "email": "newmember@example.com",  // ✓ Correct
  "role"?: TeamRole                  // ✓ Correct (optional)
}
```

**Status:** ✅ CORRECT

---

### 9. **Project Creation (POST /projects)**

#### ❌ Current Documentation
```json
{
  "name": "New Project",
  "description": "Project description",
  "category": "Technology",
  "status": "active",
  "visibility": "public",
  "team_id": "team-123"
}
```

#### ✅ Actual DTO (CreateProjectDto)
```typescript
{
  "name": "New Project",                    // ✓ Correct
  "description"?: "Project description",   // ✓ Correct
  "slug": "new-project",                   // ✗ Required in DTO but optional in docs
  "visibility"?: Visibility,               // ✓ Correct (optional)
  "team_id"?: "team-123",                  // ✓ Correct (optional)
  "is_password_protected"?: boolean,       // ✗ Missing from docs
  "password"?: string                      // ✗ Missing from docs
  // ❌ "category" NOT in DTO
  // ❌ "status" NOT in CreateProjectDto
}
```

**Issues:**
- ❌ Remove: `category`, `status`
- ✅ Add: `slug` (required)
- ✅ Add optional: `is_password_protected`, `password`

---

### 10. **Project Update (PUT /projects/:id)**

#### ❌ Current Documentation
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "active"
}
```

#### ✅ Actual DTO (UpdateProjectDto)
```typescript
{
  "name"?: string,              // ✓ Correct
  "description"?: string,       // ✓ Correct
  "visibility"?: Visibility,    // ✗ Missing from docs
  "status"?: ProjectStatus      // ✓ Correct
}
```

**Issues:**
- ✅ Add optional: `visibility`

---

### 11. **Project Item Creation (POST /projects/:projectId/items)**

#### ❌ Current Documentation
```json
{
  "title": "Item Title",
  "description": "Item description",
  "status": "pending",
  "priority": "high",
  "type": "task"
}
```

#### ✅ Actual DTO (CreateProjectItemDto)
```typescript
{
  "name": "Item Title",                     // ✗ Docs uses "title"
  "description"?: "Item description",       // ✓ Correct
  "content": "string",                      // ✗ Missing from docs (required)
  "mime_type"?: string,                     // ✗ Missing from docs
  "order"?: number,                         // ✗ Missing from docs
  "is_watermarked"?: boolean,               // ✗ Missing from docs
  "language"?: string                       // ✗ Missing from docs
  // ❌ "status", "priority", "type" NOT in DTO
}
```

**Issues:**
- ❌ Remove: `status`, `priority`, `type`
- ✅ Add required: `content`
- ✅ Rename: `title` → `name`
- ✅ Add optional: `mime_type`, `order`, `is_watermarked`, `language`

---

### 12. **Project Item Update (PUT /projects/:projectId/items/:id)**

#### ❌ Current Documentation
```json
{
  "title": "Updated Title",
  "status": "completed",
  "priority": "low"
}
```

#### ✅ Actual DTO (UpdateProjectItemDto)
```typescript
{
  "name"?: string,              // ✗ Docs uses "title"
  "description"?: string,       // ✗ Missing from docs
  "content"?: string,           // ✗ Missing from docs
  "order"?: number              // ✗ Missing from docs
  // ❌ "status", "priority" NOT in DTO
}
```

**Issues:**
- ❌ Remove: `status`, `priority`
- ✅ Rename: `title` → `name`
- ✅ Add optional: `description`, `content`, `order`

---

### 13. **Upload File (POST /projects/:projectId/files)**

#### ✅ Current Documentation Status: CORRECT
- Uses multipart/form-data with `file`, `folder`, `description`

---

### 14. **Update File (PUT /projects/:projectId/files/:fileId)**

#### ✅ Current Documentation Status: CORRECT
```json
{
  "name": "new-name.pdf",
  "description": "Updated description",
  "folder": "archives"
}
```

---

### 15. **Project Access (POST /projects/:projectId/access)**

#### ❌ Current Documentation
```json
{
  "user_id": "user-456",
  "access_type": "view"
}
```

#### ✅ Actual DTO (CreateProjectAccessDto)
```typescript
{
  "access_type"?: AccessType,               // ✓ Present but different structure
  "allow_download"?: boolean,               // ✗ Missing from docs
  "allow_share"?: boolean,                  // ✗ Missing from docs
  "allow_view_notifications"?: boolean,     // ✗ Missing from docs
  "expires_at"?: Date                       // ✗ Missing from docs
  // ❌ "user_id" NOT in CreateProjectAccessDto
}
```

**Issues:**
- ❌ Remove: `user_id`
- ✅ Add optional: `allow_download`, `allow_share`, `allow_view_notifications`, `expires_at`

---

### 16. **Donation Creation (POST /donations)**

#### ❌ Current Documentation
```json
{
  "project_id": "project-123",
  "amount": 50.00,
  "currency": "USD",
  "payment_method": "stripe"
}
```

#### ✅ Actual DTO (CreateDonationDto)
```typescript
{
  "amount": 50.00,                          // ✓ Correct
  "currency"?: "USD",                       // ✓ Correct (optional)
  "payment_method": "stripe",               // ✓ Correct
  "is_recurring"?: boolean,                 // ✗ Missing from docs
  "recurring_frequency"?: RecurringFrequency, // ✗ Missing from docs
  "message"?: string                        // ✗ Missing from docs
  // ❌ "project_id" NOT in CreateDonationDto
}
```

**Issues:**
- ❌ Remove: `project_id`
- ✅ Add optional: `is_recurring`, `recurring_frequency`, `message`

---

### 17. **Sponsorship Creation (POST /sponsorships)**

#### ❌ Current Documentation
```json
{
  "project_id": "project-123",
  "tier": "gold",
  "recurring_frequency": "monthly"
}
```

#### ✅ Actual DTO (CreateSponsorshipDto)
```typescript
{
  "tier": SponsorshipTier,                  // ✓ Correct (required)
  "amount": number,                         // ✗ Missing from docs (required)
  "currency"?: string,                      // ✗ Missing from docs
  "start_date": Date,                       // ✗ Missing from docs (required)
  "end_date"?: Date,                        // ✗ Missing from docs
  "auto_renew"?: boolean,                   // ✗ Missing from docs
  "message"?: string                        // ✗ Missing from docs
  // ❌ "project_id" NOT in CreateSponsorshipDto
  // ❌ "recurring_frequency" NOT in CreateSponsorshipDto
}
```

**Issues:**
- ❌ Remove: `project_id`, `recurring_frequency`
- ✅ Add required: `amount`, `start_date`
- ✅ Add optional: `currency`, `end_date`, `auto_renew`, `message`

---

### 18. **Sponsorship Update (PUT /sponsorships/:id)**

#### ❌ Current Documentation
```json
{
  "tier": "platinum",
  "status": "active"
}
```

#### ✅ Actual DTO (UpdateSponsorshipDto)
```typescript
{
  "status"?: SponsorshipStatus,             // ✓ Correct
  "auto_renew"?: boolean,                   // ✗ Missing from docs
  "message"?: string                        // ✗ Missing from docs
  // ❌ "tier" NOT in UpdateSponsorshipDto
}
```

**Issues:**
- ❌ Remove: `tier`
- ✅ Add optional: `auto_renew`, `message`

---

## 📊 Summary of Changes Needed

| Endpoint | Type | Issues | Priority |
|----------|------|--------|----------|
| POST /auth/register | User | Remove `country`, add 4 optional fields | High |
| POST /teams | Team | Remove `status`, add 3 optional fields | High |
| PUT /teams/:id | Team | Remove `status`, add 2 optional fields | High |
| POST /projects | Project | Remove `category`/`status`, add `slug` (required), add 2 optional | High |
| PUT /projects/:id | Project | Add `visibility` optional | Medium |
| POST /projects/:projectId/items | Item | Remove 3 fields, rename `title`→`name`, add `content` (required), add 4 optional | High |
| PUT /projects/:projectId/items/:id | Item | Remove 2 fields, rename `title`→`name`, add 3 optional | High |
| POST /projects/:projectId/access | Access | Remove `user_id`, add 4 optional fields | High |
| POST /donations | Donation | Remove `project_id`, add 3 optional fields | High |
| POST /sponsorships | Sponsorship | Remove `project_id`/`recurring_frequency`, add `amount` (required), add 4 optional | High |
| PUT /sponsorships/:id | Sponsorship | Remove `tier`, add 2 optional fields | High |

---

## ✅ Endpoints That Are Correct

- POST /auth/login
- POST /teams/:teamId/members (Add)
- PUT /teams/:teamId/members/:id (Update)
- POST /teams/:teamId/invitations
- POST /projects/:projectId/files (Upload)
- PUT /projects/:projectId/files/:fileId (Update)

