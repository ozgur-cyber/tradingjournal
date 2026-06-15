import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjfxuqmpntykfheoxorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnh1cW1wbnR5a2ZoZW94b3JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUyMDMzMSwiZXhwIjoyMDk3MDk2MzMxfQ.Uu8lve0GHUNsFSxscbqJQSmye8-9cde7F4MeMxmWgwo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRoles() {
  console.log("Roller düzeltiliyor...");
  
  // forexrico16@gmail.com haricindeki herkesi User yap
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'User' })
    .neq('email', 'forexrico16@gmail.com');

  if (error) {
    console.error("Hata:", error);
  } else {
    console.log("Roller başarıyla güncellendi!");
  }
}

fixRoles();
