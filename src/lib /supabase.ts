import { createClient } from '@supabase/supabase-js';

// This one can be used in Server Components / client components for READS
export const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This one is ONLY for server code (API routes/server actions).
// DO NOT import this into any component that runs in the browser.
export const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);