const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { fnautosConfig } = require('./src/config/clients/fnautos.ts'); // Can't require TS easily in node without ts-node

console.log("Config razonSocial:", "JIMMY ANDRES BENITEZ CORTES");

async function check() {
  const { data } = await supabase.from('empresas').select('*');
  console.log("Empresas:", data);
}
check();
