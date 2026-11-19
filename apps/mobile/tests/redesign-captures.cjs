const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {createClient}=require('@supabase/supabase-js');
const env=Object.fromEntries(fs.readFileSync('.env','utf8').trim().split(/\r?\n/).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));
const client=createClient(env.EXPO_PUBLIC_SUPABASE_URL,env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const out=path.resolve('../../docs/evidence/redesign-2026-11-05'),root=path.resolve('dist');
const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+req.url.split('?')[0]);if(!p.startsWith(root+path.sep))return res.writeHead(403).end();if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':p.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(p).pipe(res)});
let browser,page,id;const report={date:new Date().toISOString(),api:'real',checks:[],errors:[]};
(async()=>{try{
 const account=JSON.parse(fs.readFileSync('.env.redesign-test','utf8'));const auth=await client.auth.signInWithPassword(account);if(auth.error)throw auth.error;
 const previous=JSON.parse(fs.readFileSync('../../docs/evidence/live-marketplace/1bdeb89cfd/report.json','utf8'));
 const photo=previous.photosRetained[0],uid=auth.data.user.id;assert.ok(photo.startsWith('user/'+uid+'/'));
 const created=await client.from('listings').insert({owner_user_id:uid,title:'Teste visual MotorSync',price:50000.50,location:'Salvador, BA',category:'vehicles',subcategory:'cars',publication_status:'published',photo_paths:[photo],attributes:{year:'2020',mileage:'50000',brand:'Toyota',model:'Corolla'}}).select('id').single();if(created.error)throw created.error;id=created.data.id;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>report.errors.push(e.message));
 const btn=n=>page.getByRole('button',{name:n,exact:true}).filter({visible:true});
 await page.goto(base+'/login');await page.getByRole('textbox',{name:'E-mail',exact:true}).fill(account.email);await page.getByRole('textbox',{name:'Senha',exact:true}).fill(account.password);await btn('Entrar').click();await btn('Sair da conta').waitFor();
 for(const theme of ['light','dark']){
  await page.goto(base+'/profile');await btn(theme==='light'?'Claro':'Escuro').click();
  await page.goto(base+'/management');await page.getByText('Ainda sem controle financeiro ativo',{exact:true}).waitFor();await page.getByText('Carregando resumo…',{exact:true}).waitFor({state:'hidden'});await page.screenshot({path:path.join(out,'management-auth-'+theme+'.png')});
  await page.goto(base+'/explore');await page.getByRole('textbox',{name:'Pesquisar anúncios',exact:true}).fill('Teste visual MotorSync');await btn('Foto de Teste visual MotorSync').waitFor();
  await page.waitForFunction(()=>!document.querySelector('[role="progressbar"]'));
  const photoButton=btn('Foto de Teste visual MotorSync');await photoButton.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('img')].some(i=>i.src.includes('/storage/')&&i.complete&&i.naturalWidth>0));
  await photoButton.locator('..').locator('..').screenshot({path:path.join(out,'market-card-'+theme+'.png')});report.checks.push(theme+': signed photo rendered; final management pending state captured');
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.errors.push(e.message);process.exitCode=1;}finally{
 if(id){const deleted=await client.from('listings').delete().eq('id',id);if(deleted.error)report.errors.push(deleted.error.message);report.remainingTestRows=(await client.from('listings').select('id').eq('id',id)).data?.length;}
 await client.auth.signOut({scope:'local'});await browser?.close();server.close();fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
