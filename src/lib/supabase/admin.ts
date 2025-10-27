import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Ensure this module is never bundled to the client
import 'server-only';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL. Put it in .env.local at the project root and restart the dev server.'
  );
}
if (!serviceKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY (service role). Put it in .env.local (server-only) and restart the dev server.'
  );
}

export const admin = createClient(url, serviceKey);
