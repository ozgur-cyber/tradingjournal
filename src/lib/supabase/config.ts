import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjfxuqmpntykfheoxorp.supabase.co';
// Uyarı: Normalde frontend tarafında 'anon' (public) key kullanılır. 
// Sizin ilettiğiniz key 'service_role' (tüm yetkilere sahip admin key) olduğu için geçici olarak kullanıyoruz.
// Canlıya çıkarken bunu Supabase panelindeki 'anon/public' key ile değiştirmelisiniz.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnh1cW1wbnR5a2ZoZW94b3JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUyMDMzMSwiZXhwIjoyMDk3MDk2MzMxfQ.Uu8lve0GHUNsFSxscbqJQSmye8-9cde7F4MeMxmWgwo';

export const supabase = createClient(supabaseUrl, supabaseKey);
