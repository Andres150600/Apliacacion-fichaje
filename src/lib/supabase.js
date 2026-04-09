import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wcqjdnrcqgokcyyhvjhc.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ArOQhPXl7zgWYiPnq80zwQ_BuRu3zL6'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
