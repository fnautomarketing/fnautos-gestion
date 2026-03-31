const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('clientes').select('id, nombre_fiscal, nombre_comercial, cif, direccion, ciudad, codigo_postal, telefono:telefono_principal, email:email_principal').order('nombre_fiscal', { ascending: true });
  console.log("Error:", error);
  console.log("Data count:", data?.length);
}
test();
