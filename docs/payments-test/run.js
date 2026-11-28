const ts=require('/opt/npm-tools/node_modules/typescript'),fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const SRC='/tmp/jm/jamva',OUT='/tmp/rtest/out';
function compile(f){const o=path.join(OUT,f.replace(/\.tsx?$/,'.js'));fs.mkdirSync(path.dirname(o),{recursive:true});fs.writeFileSync(o,ts.transpileModule(fs.readFileSync(path.join(SRC,f),'utf8'),{compilerOptions:{module:1,target:99,esModuleInterop:true,jsx:1}}).outputText);}
['lib/razorpay.ts','lib/payments.ts','lib/orders.ts','lib/env.ts','lib/format.ts','app/api/pay/verify/route.ts','app/api/razorpay/webhook/route.ts','app/api/cron/maintenance/route.ts'].forEach(compile);
const fake=require('./fakedb'); const notes=[]; const stub={
 'next/server':{NextResponse:{json:(b,i)=>({status:(i&&i.status)||200,body:b})}},
 'db':{db:fake.db}, 'notify':{notify:async(u,n)=>{notes.push(['user',u,n.title])},notifyAdmins:async(n)=>{notes.push(['admin',n.title])},whatsappOrder:async()=>{notes.push(['wa'])}},
 'drivers':{announceToDrivers:async()=>{},getDriverCfg:async()=>({pay_percent:100,min_pay:20,max_active:2}),riderPay:(a)=>a},
 'pricing':{getListing:async()=>({yearly_fee:1000,gst_percent:18,trial_days:90}),getVendorListing:async()=>({monthly_fee:199,yearly_fee:1499,gst_percent:18,trial_days:90}),setting:async(k,d)=>d},
};
const orig=Module._resolveFilename;
Module._resolveFilename=function(req,parent,...r){
  const base=req.replace(/^@\/lib\//,'').replace(/^\.\//,'');
  if(stub[req]) return '__stub__'+req; if(/^(@\/lib\/|\.\/)(db|notify|drivers|pricing)$/.test(req)) return '__stub__'+base;
  if(req.startsWith('@/')) return orig.call(this,path.join(OUT,req.slice(2)),parent,...r);
  if(/^(\.|\/)/.test(req)&&parent&&parent.filename.startsWith(OUT)) return orig.call(this,path.resolve(path.dirname(parent.filename),req),parent,...r);
  return orig.call(this,req,parent,...r);};
const origLoad=Module._load; Module._load=function(req,parent,...r){ const s=stub[req]||stub[req.replace(/^@\/lib\//,'').replace(/^\.\//,'')]; if(s&&(stub[req]||/^(@\/lib\/|\.\/)(db|notify|drivers|pricing)$/.test(req))) return s; return origLoad.call(this,req,parent,...r); };
module.exports={fake,notes,OUT,req:(p)=>require(path.join(OUT,p))};
