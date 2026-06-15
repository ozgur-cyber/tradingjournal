import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjfxuqmpntykfheoxorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnh1cW1wbnR5a2ZoZW94b3JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUyMDMzMSwiZXhwIjoyMDk3MDk2MzMxfQ.Uu8lve0GHUNsFSxscbqJQSmye8-9cde7F4MeMxmWgwo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoConfirm() {
  console.log("Kullanıcılar getiriliyor...");
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Hata:", listError);
    return;
  }

  const founder = usersData.users.find(u => u.email === 'forexrico16@gmail.com');
  
  if (founder) {
    console.log("Kullanıcı bulundu! ID:", founder.id);
    const { data, error } = await supabase.auth.admin.updateUserById(founder.id, {
      email_confirm: true
    });
    
    if (error) {
      console.error("Güncelleme hatası:", error);
    } else {
      console.log("BÜYÜK BAŞARI! E-posta otomatik olarak onaylandı!");
    }
  } else {
    console.log("forexrico16@gmail.com bulunamadı.");
  }
}

autoConfirm();
