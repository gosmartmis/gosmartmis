import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  const results: string[] = [];

  // 1. Create the bucket if it doesn't exist
  const { data: bucket, error: bucketErr } = await supabaseAdmin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  if (bucketErr) {
    if (bucketErr.message.includes('already exists')) {
      results.push('Bucket already exists — skipped');
    } else {
      return new Response(JSON.stringify({ error: bucketErr.message, results }), { status: 500 });
    }
  } else {
    results.push(`Bucket created: ${bucket?.name}`);
  }

  // 2. Set up RLS policies via raw SQL using the admin client
  const policies = [
    {
      name: 'Avatar images are publicly accessible',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Avatar images are publicly accessible') THEN
            CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
          END IF;
        END $$;
      `,
    },
    {
      name: 'Users can upload their own avatar',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Users can upload their own avatar') THEN
            CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
          END IF;
        END $$;
      `,
    },
    {
      name: 'Users can update their own avatar',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Users can update their own avatar') THEN
            CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
          END IF;
        END $$;
      `,
    },
    {
      name: 'Users can delete their own avatar',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Users can delete their own avatar') THEN
            CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
          END IF;
        END $$;
      `,
    },
  ];

  for (const policy of policies) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql }).maybeSingle();
    // Try direct query if rpc doesn't exist
    const { error: pgErr } = await (supabaseAdmin as any).from('_dummy_').select().limit(0);
    
    // Use postgres directly
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
      },
      body: JSON.stringify({ sql: policy.sql }),
    });
    results.push(`Policy "${policy.name}": ${res.ok ? 'applied' : 'check manually'}`);
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
