// Local mock of the Razorpay REST API (orders, payments, capture, refunds) for offline testing.
const http=require('http'),crypto=require('crypto');
exports.start=(KEY,SECRET,port)=>new Promise(res=>{
  const S={orders:{},payments:{},refunds:{},calls:[],failRefund:0};
  const id=(p)=>p+'_'+crypto.randomBytes(7).toString('hex');
  const srv=http.createServer((req,rsp)=>{
    let b='';req.on('data',d=>b+=d);req.on('end',()=>{
      const send=(c,j)=>{rsp.writeHead(c,{'content-type':'application/json'});rsp.end(JSON.stringify(j))};
      const au=req.headers.authorization||''; const exp='Basic '+Buffer.from(KEY+':'+SECRET).toString('base64');
      if(au!==exp) return send(401,{error:{description:'Authentication failed'}});
      const u=new URL(req.url,'http://x'); const p=u.pathname.replace(/^\/v1/,''); const j=b?JSON.parse(b):{}; S.calls.push(req.method+' '+p);
      let m;
      if(req.method==='POST'&&p==='/orders'){ if(!Number.isInteger(j.amount)||j.amount<100) return send(400,{error:{description:'Order amount less than minimum amount allowed'}}); const o={id:id('order'),amount:j.amount,currency:j.currency,receipt:j.receipt,status:'created'};S.orders[o.id]=o;return send(200,o);}
      if(req.method==='GET'&&p==='/orders') return send(200,{items:[]});
      if((m=p.match(/^\/orders\/([^/]+)\/payments$/))) return send(200,{items:Object.values(S.payments).filter(x=>x.order_id===m[1])});
      if((m=p.match(/^\/payments\/([^/]+)$/))&&req.method==='GET'){const x=S.payments[m[1]];return x?send(200,x):send(404,{error:{description:'not found'}});}
      if((m=p.match(/^\/payments\/([^/]+)\/capture$/))){const x=S.payments[m[1]]; if(!x||x.status!=='authorized'||j.amount!==x.amount) return send(400,{error:{description:'capture failed'}}); x.status='captured';return send(200,x);}
      if((m=p.match(/^\/payments\/([^/]+)\/refund$/))){const x=S.payments[m[1]]; if(S.failRefund>0){S.failRefund--;return send(500,{error:{description:'Razorpay temporary error'}});} if(!x||x.status!=='captured') return send(400,{error:{description:'payment not captured'}}); if(x.refunded) return send(400,{error:{description:'The payment has been fully refunded already'}}); if(j.amount>x.amount) return send(400,{error:{description:'refund amount exceeds'}}); x.refunded=true; const r={id:id('rfnd'),payment_id:x.id,amount:j.amount,status:'processed'};S.refunds[r.id]=r;return send(200,r);}
      send(404,{error:{description:'no route '+p}});
    });
  }).listen(port,()=>res({S,srv,pay:(orderId,status,extra={})=>{const o=S.orders[orderId];const x={id:id('pay'),order_id:orderId,amount:o.amount,currency:'INR',status,method:'upi',...extra};S.payments[x.id]=x;return x;}}));
});
