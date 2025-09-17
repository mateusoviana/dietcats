// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get auth user from the incoming JWT
    const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '')
    const { data: userData } = await anon.auth.getUser(
      req.headers.get('Authorization') || undefined
    )
    const user = userData?.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Admin client to perform deletion
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Optionally, clean up user-related storage/assets here
    // await admin.storage.from('avatars').remove([...])

    // Delete auth user (cascades to profiles and related tables via FKs)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
})

