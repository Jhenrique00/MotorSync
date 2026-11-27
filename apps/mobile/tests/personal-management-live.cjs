// Real business API tests. Retains clearly labelled records and sale history.
// No administrative key, SQL, memberships, migrations, or cleanup deletes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');
const url='https://kyfkizweglxuymnfkrsz.supabase.co';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
assert.equal(env.EXPO_PUBLIC_SUPABASE_URL,url);
const key=env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;assert.ok(key.startsWith('sb_publishable_'));
const make=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const client=make(),guest=make(),run=crypto.randomBytes(5).toString('hex');
const account=JSON.parse(fs.readFileSync('.env.redesign-test','utf8'));
const directory=path.resolve('../../docs/evidence/personal-management-live',run);fs.mkdirSync(directory,{recursive:true});
const report={date:new Date().toISOString(),project:'kyfkizweglxuymnfkrsz',run,mode:'REAL Supabase API; no mocks; labelled records retained',physicalAndroid:false,checks:[],failures:[],records:{}};
const save=()=>fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2));
const unwrap=async(q)=>{const {data,error}=await q;if(error)throw new Error(`${error.code||''}: ${error.message}`);return data;};
async function check(name,fn){await fn();report.checks.push(name);save();console.log('PASS '+name);}
(async()=>{try{
 const {createCommercialApi}=await import('../src/services/commercialApi.js');
 const {createVehicleApi}=await import('../src/services/vehicleRepository.js');
 const {createListingApi}=await import('../src/services/listingRepository.js');
 const {saleResult}=await import('../src/utils/commercialResults.js');
 const commercial=createCommercialApi(client),vehicles=createVehicleApi(client),listings=createListingApi(client);
 await unwrap(client.auth.signInWithPassword({email:account.email,password:account.password}));
 const {user}=await unwrap(client.auth.getUser());report.user={id:user.id,email:user.email};save();
 await check('authenticated test account has no organization and personal backend is enabled',async()=>{
  assert.equal((await commercial.members()).length,0);assert.equal(await commercial.personalReady(),true);
 });
 let customer,vehicle,listing,proposal,sale,photo;
 await check('independent personal customer persists notes and edited phone',async()=>{
  customer=await commercial.saveCustomer('personal',{name:`Teste real ${run}`,email:'',phone:'',notes:'Validação API real; sem empresa.'});report.records.customer=customer.id;save();
  customer=await commercial.saveCustomer('personal',{...customer,phone:'71999990000'},customer.id);
  assert.equal(customer.owner_user_id,user.id);assert.equal(customer.organization_id,null);
  assert.equal((await commercial.customers('personal')).find(c=>c.id===customer.id).phone,'71999990000');
 });
 await check('personal stock persists known purchase and preparation costs',async()=>{
  vehicle=await vehicles.save('personal',{title:`Teste real ${run} direto`,price:'200',purchase_cost:'100',preparation_cost:'20'});
  report.records.directVehicle=vehicle.id;save();assert.equal(vehicle.organization_id,null);assert.equal(vehicle.purchase_cost,100);
 });
 await check('real photo upload, private draft and signed owner download',async()=>{
  photo=`user/${user.id}/${run}.jpg`;report.records.photo=photo;save();
  const file='C:/Users/João Henrique/OneDrive/Imagens/Camera Roll/WhatsApp Image 2026-10-16 at 10.38.42.jpeg';
  await unwrap(client.storage.from('listing-photos').upload(photo,fs.readFileSync(file),{contentType:'image/jpeg',upsert:false}));
  listing=await listings.save({vehicle_id:vehicle.id,title:vehicle.title,price:'200',category:'vehicles',subcategory:'cars',location:'Salvador BA',description:'Registro identificado para teste de integração; não é oferta comercial.',attributes:{},photo_paths:[photo],publication_status:'draft'});
  report.records.listing=listing.id;save();
  assert.equal((await unwrap(guest.from('listings').select('id').eq('id',listing.id))).length,0);
  assert.ok((await guest.storage.from('listing-photos').createSignedUrl(photo,60)).error);
  const signed=await unwrap(client.storage.from('listing-photos').createSignedUrl(photo,60));
  const download=await fetch(signed.signedUrl);assert.equal(download.status,200);assert.ok((await download.arrayBuffer()).byteLength>0);
 });
 await check('published linked listing becomes public without disclosing private costs',async()=>{
  listing=await listings.save({...listing,publication_status:'published'},listing.id);
  const data=await unwrap(guest.from('listings').select('*').eq('id',listing.id).single());assert.equal(data.vehicle_id,vehicle.id);assert.equal(data.purchase_cost,undefined);
 });
 await check('optional draft gains vehicle and acceptance does not create a sale',async()=>{
  proposal=await commercial.createProposal('personal',{customer_id:customer.id,vehicle_id:'',amount:'190',terms:'Teste PIX'});report.records.proposal=proposal.id;save();assert.equal(proposal.vehicle_id,null);
  proposal=await commercial.updateProposal(proposal.id,{...proposal,vehicle_id:vehicle.id},'draft');
  proposal=await commercial.updateProposal(proposal.id,proposal,'sent');proposal=await commercial.updateProposal(proposal.id,proposal,'accepted');
  assert.equal((await vehicles.get(vehicle.id)).commercial_status,'available');assert.equal((await commercial.sales('personal')).filter(s=>s.vehicle_id===vehicle.id).length,0);
 });
 await check('concurrent direct sale retries produce exactly one sale and archive listing',async()=>{
  const input={customer_id:customer.id,vehicle_id:vehicle.id,amount:'195',terms:'Teste venda direta PIX',sold_at:new Date().toISOString()};
  const result=await Promise.all([commercial.directSale(input),commercial.directSale(input)]);assert.equal(result[0].id,result[1].id);sale=result[0];report.records.directSale=sale.id;save();
  assert.equal((await vehicles.get(vehicle.id)).commercial_status,'sold');assert.equal((await listings.get(listing.id)).publication_status,'archived');
  assert.equal((await commercial.proposals('personal')).find(p=>p.id===proposal.id).status,'cancelled');
  assert.equal(saleResult(sale).profit,75);assert.equal(sale.purchase_cost,100);assert.equal(sale.preparation_cost,20);
 });
 await check('sale hides listing and prevents issuing new public photo URLs',async()=>{
  assert.equal((await unwrap(guest.from('listings').select('id').eq('id',listing.id))).length,0);
  assert.ok((await guest.storage.from('listing-photos').createSignedUrl(photo,60)).error);
 });
 await check('sale by accepted proposal persists unknown costs without inventing profit',async()=>{
  const v=await vehicles.save('personal',{title:`Teste real ${run} proposta`,price:'300'});report.records.proposalVehicle=v.id;save();
  let p=await commercial.createProposal('personal',{customer_id:customer.id,vehicle_id:v.id,amount:'290',terms:'Teste proposta PIX'});report.records.soldProposal=p.id;save();
  p=await commercial.updateProposal(p.id,p,'sent');p=await commercial.updateProposal(p.id,p,'accepted');
  const s=await commercial.completeSale(p.id);report.records.proposalSale=s.id;save();assert.equal(saleResult(s).profit,null);assert.equal((await vehicles.get(v.id)).commercial_status,'sold');
 });
 await check('history protects sold inventory and linked customer; anonymous commercial reads denied',async()=>{
  assert.ok((await client.from('vehicles').update({price:1}).eq('id',vehicle.id)).error);
  await assert.rejects(()=>commercial.deleteCustomer('personal',customer.id));
  for(const table of ['customers','sales'])assert.ok((await guest.from(table).select('id').limit(1)).error);
  const history=await commercial.events(proposal.id);assert.ok(history.length>=4);
 });
 await check('new authenticated client after logout restores persisted sales from server',async()=>{
  await client.auth.signOut({scope:'local'});const next=make();
  try{await unwrap(next.auth.signInWithPassword({email:account.email,password:account.password}));
   const rows=await unwrap(next.from('sales').select('*').in('id',[report.records.directSale,report.records.proposalSale]));assert.equal(rows.length,2);
  }finally{await next.auth.signOut({scope:'local'});}
 });
}catch(error){report.failures.push(error.message);process.exitCode=1;console.error(error.message);}finally{
 await client.auth.signOut({scope:'local'});report.passed=report.checks.length;report.failed=report.failures.length;save();console.log(JSON.stringify({report:path.join(directory,'report.json'),passed:report.passed,failed:report.failed,records:report.records}));
}})();
