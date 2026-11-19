import fs from 'node:fs';import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').trim().split(/\r?\n/).map(l=>l.split('=')));
const client=createClient(env.EXPO_PUBLIC_SUPABASE_URL,env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {error}=await client.auth.signInWithPassword(JSON.parse(fs.readFileSync('.env.auth-test','utf8')));if(error)throw error;
for(const table of ['organization_members','vehicles']){const {data,error,status}=await client.from(table).select(table==='vehicles'?'id,organization_id,title,price,created_at':'organization_id,role');console.log(JSON.stringify({table,status,rows:data?.length,code:error?.code,message:error?.message}));}
await client.auth.signOut({scope:'local'});
