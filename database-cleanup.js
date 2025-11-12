#!/usr/bin/env node

/**
 * PostgreSQL Full Cleanup Script (Tables + Enums)
 * Runs a dynamic PL/pgSQL block to drop all tables and enums in the public schema.
 */

const { Client } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL not set in .env file");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function cleanupDatabase() {
  const cleanupQuery = `
  DO
  $$
  DECLARE
      r RECORD;
  BEGIN
      -- Drop all tables in the public schema
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;

      -- Drop all views in the public schema
      FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
          EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
      END LOOP;

      -- Drop all sequences in the public schema
      FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
      END LOOP;

      -- Drop all enum types in the public schema
      FOR r IN (
          SELECT t.typname
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typtype = 'e' AND n.nspname = 'public'
      ) LOOP
          EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
  END;
  $$;
  `;

  try {
    console.log("🔗 Connecting to database...");
    await client.connect();
    console.log("✅ Connected!");

    console.log("\n🧹 Cleaning database (tables, views, sequences, enums)...");
    await client.query(cleanupQuery);

    console.log("\n✅ Database cleanup complete!");
    console.log("🚀 Ready to run migrations or TypeORM sync.\n");
  } catch (error) {
    console.error("❌ Error during cleanup:");
    console.error(error);
  } finally {
    await client.end();
    console.log("🔌 Disconnected from database.");
  }
}

cleanupDatabase();


// #!/usr/bin/env node

// /**
//  * Database Cleanup Script
//  * Deletes all tables and enums from the PostgreSQL database
//  * 
//  * Usage:
//  *   node database-cleanup.js
//  * 
//  * Prerequisites:
//  *   - DATABASE_URL must be set in .env file
//  *   - Node.js must be installed
//  */

// const { Client } = require('pg');
// require('dotenv').config();

// const databaseUrl = process.env.DATABASE_URL;

// if (!databaseUrl) {
//   console.error('❌ ERROR: DATABASE_URL not set in .env file');
//   process.exit(1);
// }

// const client = new Client({
//   connectionString: databaseUrl,
//   ssl: { rejectUnauthorized: false },
// });

// const dropTableStatements = [
//   'DROP TABLE IF EXISTS "typeorm_metadata" CASCADE',
//   'DROP TABLE IF EXISTS "notifications" CASCADE',
//   'DROP TABLE IF EXISTS "sponsorships" CASCADE',
//   'DROP TABLE IF EXISTS "donations" CASCADE',
//   'DROP TABLE IF EXISTS "team_settings" CASCADE',
//   'DROP TABLE IF EXISTS "user_settings" CASCADE',
//   'DROP TABLE IF EXISTS "team_members" CASCADE',
//   'DROP TABLE IF EXISTS "team_invitations" CASCADE',
//   'DROP TABLE IF EXISTS "teams" CASCADE',
//   'DROP TABLE IF EXISTS "activities" CASCADE',
//   'DROP TABLE IF EXISTS "file_versions" CASCADE',
//   'DROP TABLE IF EXISTS "project_files" CASCADE',
//   'DROP TABLE IF EXISTS "project_access" CASCADE',
//   'DROP TABLE IF EXISTS "project_items" CASCADE',
//   'DROP TABLE IF EXISTS "projects" CASCADE',
//   'DROP TABLE IF EXISTS "users" CASCADE',
// ];

// const dropEnumStatements = [
//   'DROP TYPE IF EXISTS "public"."users_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."project_items_file_type_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."project_access_access_type_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."activities_type_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."projects_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."projects_visibility_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."team_invitations_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."teams_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."team_members_role_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."team_members_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."donations_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."donations_payment_method_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."donations_recurring_frequency_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."notifications_type_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."notifications_status_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."sponsorships_tier_enum" CASCADE',
//   'DROP TYPE IF EXISTS "public"."sponsorships_status_enum" CASCADE',
// ];

// async function cleanupDatabase() {
//   try {
//     console.log('🔗 Connecting to database...');
//     await client.connect();
//     console.log('✅ Connected!');

//     console.log('\n🗑️  Dropping tables...');
//     for (const statement of dropTableStatements) {
//       try {
//         await client.query(statement);
//         console.log(`  ✓ ${statement}`);
//       } catch (error) {
//         console.log(`  ⊘ ${statement} (already dropped or doesn't exist)`);
//       }
//     }

//     console.log('\n🗑️  Dropping enums...');
//     for (const statement of dropEnumStatements) {
//       try {
//         await client.query(statement);
//         console.log(`  ✓ ${statement}`);
//       } catch (error) {
//         console.log(`  ⊘ ${statement} (already dropped or doesn't exist)`);
//       }
//     }

//     console.log('\n✅ Database cleanup complete!');
//     console.log('\n📋 Remaining tables in public schema:');
    
//     const result = await client.query(
//       `SELECT table_name FROM information_schema.tables 
//        WHERE table_schema = 'public' 
//        ORDER BY table_name`
//     );

//     if (result.rows.length === 0) {
//       console.log('   ✓ No tables found (database is clean)');
//     } else {
//       result.rows.forEach(row => {
//         console.log(`   ⚠️  ${row.table_name}`);
//       });
//     }

//     console.log('\n🚀 Ready to run: npm run start:dev');
//     console.log('   TypeORM will auto-create all tables with correct schema\n');

//   } catch (error) {
//     console.error('❌ Error during cleanup:');
//     console.error(error);
//     process.exit(1);
//   } finally {
//     await client.end();
//     console.log('🔌 Disconnected from database');
//   }
// }

// cleanupDatabase();
