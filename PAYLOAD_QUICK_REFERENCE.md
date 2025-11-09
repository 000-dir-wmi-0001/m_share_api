# 📝 Payload Quick Reference - All Changes at a Glance

## Register User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "avatar_url": "/path/to/avatar.jpg",
  "bio": "Software Developer",
  "location": "San Francisco, USA",
  "timezone": "America/Los_Angeles"
}
```

## Create Team
```json
{
  "name": "Development Team",
  "description": "Our development team",
  "slug": "development-team",
  "is_private": false,
  "logo_url": "/logos/dev-team.png"
}
```

## Update Team
```json
{
  "name": "Development Team Updated",
  "description": "Updated description",
  "is_private": false,
  "logo_url": "/logos/dev-team-new.png"
}
```

## Create Project
```json
{
  "name": "New Project",
  "description": "Project description",
  "slug": "new-project",
  "visibility": "public",
  "team_id": "team-123",
  "is_password_protected": false,
  "password": "optional-password"
}
```

## Update Project
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "visibility": "private",
  "status": "active"
}
```

## Create Project Item
```json
{
  "name": "Item Title",
  "description": "Item description",
  "content": "Item content or file data",
  "mime_type": "text/plain",
  "order": 1,
  "is_watermarked": false,
  "language": "en"
}
```

## Update Project Item
```json
{
  "name": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "order": 2
}
```

## Grant Project Access
```json
{
  "access_type": "view",
  "allow_download": true,
  "allow_share": false,
  "allow_view_notifications": true,
  "expires_at": "2024-12-09T00:00:00Z"
}
```

## Update Project Access
```json
{
  "access_type": "edit",
  "allow_download": true,
  "allow_share": true,
  "allow_view_notifications": true,
  "expires_at": "2024-12-09T00:00:00Z"
}
```

## Create Donation
```json
{
  "amount": 50.00,
  "currency": "USD",
  "payment_method": "stripe",
  "is_recurring": false,
  "recurring_frequency": "monthly",
  "message": "Great work!"
}
```

## Create Sponsorship
```json
{
  "tier": "gold",
  "amount": 100.00,
  "currency": "USD",
  "start_date": "2024-11-09T00:00:00Z",
  "end_date": "2024-12-09T00:00:00Z",
  "auto_renew": true,
  "message": "Thanks for the sponsorship!"
}
```

## Update Sponsorship
```json
{
  "status": "active",
  "auto_renew": true,
  "message": "Updated sponsorship message"
}
```

---

## Key Reminders

✅ **Always use:**
- `name` (not `title`) for Project Items
- `slug` when creating Projects
- `is_private` (not `status`) for Teams
- Required dates for Sponsorships
- `content` field for Project Items
- `access_type` with permissions for Project Access

❌ **Never use:**
- `country` in User registration
- `status` in Team/Project creation
- `category` in Project creation
- `project_id` in Donations
- `recurring_frequency` in Sponsorship creation
- `title` for Project Items

