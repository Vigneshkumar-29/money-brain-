import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uqgcnfdtfydmonkvnrnd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ2NuZmR0ZnlkbW9ua3Zucm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzYwMzAsImV4cCI6MjA4MDk1MjAzMH0._kypSWdw0R5pV6eoyKvrsi6ZqLXXofDnjDX8mMnkUxU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
