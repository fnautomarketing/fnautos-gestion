/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    console.log('🔄 Starting migration for RFC-025: Multi-Company Support...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Read SQL file
        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260208_rfc025_multi_company.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements because Supabase HTTP API via rpc/exec usually handles one statement or we need a specific way to execute raw SQL.
        // However, standard supabase-js doesn't have a direct 'sql' method exposed easily unless enabled via an RPC function or using the pg driver.
        // BUT, since I don't have a direct SQL execution RPC set up, I might be limited.

        // WAIT. If I don't have an RPC function `exec_sql`, I can't just run SQL from the client unless I use the postgres connection string.
        // Let's check if the user has a `exec` or `exec_sql` RPC function. If not, I can create one... oh wait, to create one I need to run SQL!

        // ALTERNATIVE: Use the `pg` library directly if the user provided the database connection string.
        // Checking .env.local for DATABASE_URL...

        console.log('⚠️  Standard supabase-js client cannot execute arbitrary SQL without an RPC function.');
        console.log('ℹ️  Checking for DATABASE_URL for direct connection...');

        if (process.env.DATABASE_URL) {
            console.log('✅ DATABASE_URL found. Using `pg` to execute migration...');
            const { Client } = require('pg');
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });

            await client.connect();
            await client.query(sql);
            await client.end();
            console.log('✅ Migration executed successfully via direct Postgres connection!');
        } else {
            console.error('❌ DATABASE_URL not found. Cannot execute migration automatically.');
            console.log('👉 Please execute the SQL file manually in Supabase Dashboard.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error executing migration:', error);
        process.exit(1);
    }
}

runMigration();
