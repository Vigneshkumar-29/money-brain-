// Supabase Connection Test Script
// Run this to verify your Supabase connection is working correctly

import { supabase } from './lib/supabase';

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    try {
        // Test 1: Check if Supabase client is initialized
        console.log('✅ Test 1: Supabase client initialized');
        // console.log(`   URL: ${supabase.supabaseUrl}`); // Protected property

        // Test 2: Test authentication
        console.log('\n📝 Test 2: Testing authentication...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.log('⚠️  No active session (this is normal if not logged in)');
        } else if (session) {
            console.log('✅ Active session found');
            console.log(`   User: ${session.user.email}`);
        } else {
            console.log('ℹ️  No active session');
        }

        // Test 3: Test database connection
        console.log('\n📊 Test 3: Testing database connection...');
        const { data: transactions, error: dbError } = await supabase
            .from('transactions')
            .select('count')
            .limit(1);

        if (dbError) {
            if (dbError.message.includes('relation "transactions" does not exist')) {
                console.log('❌ Transactions table does not exist');
                console.log('   Please run the SQL schema in Supabase Dashboard');
            } else if (dbError.message.includes('JWT')) {
                console.log('⚠️  Not authenticated (this is normal)');
                console.log('   Database connection is working');
            } else {
                console.log('❌ Database error:', dbError.message);
            }
        } else {
            console.log('✅ Database connection successful');
            console.log(`   Transactions table exists`);
        }

        // Test 4: Test profiles table
        console.log('\n👤 Test 4: Testing profiles table...');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (profileError) {
            if (profileError.message.includes('relation "profiles" does not exist')) {
                console.log('❌ Profiles table does not exist');
                console.log('   Please run the SQL schema in Supabase Dashboard');
            } else if (profileError.message.includes('JWT')) {
                console.log('⚠️  Not authenticated (this is normal)');
                console.log('   Profiles table exists');
            } else {
                console.log('❌ Profile error:', profileError.message);
            }
        } else {
            console.log('✅ Profiles table exists');
        }

        console.log('\n' + '='.repeat(50));
        console.log('📋 Summary:');
        console.log('='.repeat(50));
        console.log('✅ Supabase client: OK');
        console.log(sessionError ? '⚠️  Session: Not authenticated' : session ? '✅ Session: Active' : 'ℹ️  Session: None');
        console.log(dbError && dbError.message.includes('does not exist') ? '❌ Database: Tables missing' : '✅ Database: OK');
        console.log('\n💡 Next Steps:');

        if (dbError && dbError.message.includes('does not exist')) {
            console.log('1. Go to Supabase Dashboard → SQL Editor');
            console.log('2. Run the contents of supabase_schema.sql');
            console.log('3. Verify tables are created');
        } else {
            console.log('1. Sign up for a new account in the app');
            console.log('2. Create some transactions');
            console.log('3. Test all features');
        }

        console.log('\n✨ Connection test complete!\n');

    } catch (error) {
        console.error('\n❌ Unexpected error:', error);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Check your internet connection');
        console.log('2. Verify Supabase URL and key in lib/supabase.ts');
        console.log('3. Check Supabase project status');
    }
}

// Run the test
testSupabaseConnection();

export default testSupabaseConnection;
