-- ============================================
-- Database Cleanup Script
-- Deletes ALL tables from the database
-- Run this in Neon Console or psql
-- ============================================

-- Drop all tables with CASCADE to remove dependencies
DROP TABLE IF EXISTS "typeorm_metadata" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "sponsorships" CASCADE;
DROP TABLE IF EXISTS "donations" CASCADE;
DROP TABLE IF EXISTS "team_settings" CASCADE;
DROP TABLE IF EXISTS "user_settings" CASCADE;
DROP TABLE IF EXISTS "team_members" CASCADE;
DROP TABLE IF EXISTS "team_invitations" CASCADE;
DROP TABLE IF EXISTS "teams" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "file_versions" CASCADE;
DROP TABLE IF EXISTS "project_files" CASCADE;
DROP TABLE IF EXISTS "project_access" CASCADE;
DROP TABLE IF EXISTS "project_items" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop all ENUMs
DROP TYPE IF EXISTS "public"."users_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."project_items_file_type_enum" CASCADE;
DROP TYPE IF EXISTS "public"."project_access_access_type_enum" CASCADE;
DROP TYPE IF EXISTS "public"."activities_type_enum" CASCADE;
DROP TYPE IF EXISTS "public"."projects_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."projects_visibility_enum" CASCADE;
DROP TYPE IF EXISTS "public"."team_invitations_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."teams_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."team_members_role_enum" CASCADE;
DROP TYPE IF EXISTS "public"."team_members_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."donations_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."donations_payment_method_enum" CASCADE;
DROP TYPE IF EXISTS "public"."donations_recurring_frequency_enum" CASCADE;
DROP TYPE IF EXISTS "public"."notifications_type_enum" CASCADE;
DROP TYPE IF EXISTS "public"."notifications_status_enum" CASCADE;
DROP TYPE IF EXISTS "public"."sponsorships_tier_enum" CASCADE;
DROP TYPE IF EXISTS "public"."sponsorships_status_enum" CASCADE;

-- Verify cleanup
SELECT 'Database cleanup complete!' as message;
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
