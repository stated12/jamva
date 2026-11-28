// Minimal in-memory stand-in for the supabase-js calls Jamva makes (enough to exercise payment logic).
const T={}; let seq=1; const uniq={webhook_events:'event_id',payments:'razorpay_order_id'};
exports.T=T; exports.reset=()=>{for(const k of Object.keys(T))delete T[k]; ['orders','payments','order_items','order_events','webhook_events','restaurants','profiles','drivers','notifications'].forEach(k=>T[k]=[]); exports.hooks={}; };
exports.reset();
const tn=t=>t.replace(/^jm_/,'');
function qb(table){
  const name=tn(table); const st={op:'select',f:[],patch:null,rows:null,sel:null,lim:null,one:null,count:false,head:false,sel_str:''};
  const api={
    select(c,o){ st.sel=true; st.sel_str=c||'*'; if(o&&o.count) st.count=true; if(o&&o.head) st.head=true; return api; },
    insert(r){ st.op='insert'; st.rows=Array.isArray(r)?r:[r]; return api; }, upsert(r){ st.op='insert'; st.rows=Array.isArray(r)?r:[r]; return api; },
    update(p){ st.op='update'; st.patch=p; return api; }, delete(){ st.op='delete'; return api; },
    eq(c,v){ st.f.push(r=>r[c]===v); return api; }, neq(c,v){ st.f.push(r=>r[c]!==v); return api; }, in(c,a){ st.f.push(r=>a.includes(r[c])); return api; },
    is(c,v){ st.f.push(r=>(r[c]??null)===v); return api; }, gte(c,v){ st.f.push(r=>r[c]>=v); return api; }, lte(c,v){ st.f.push(r=>r[c]<=v); return api; }, or(){ return api; },
    order(){ return api; }, limit(n){ st.lim=n; return api; }, maybeSingle(){ st.one='maybe'; return api; }, single(){ st.one='single'; return api; },
    then(res,rej){ return Promise.resolve(run()).then(res,rej); },
  };
  function run(){
    const hook=exports.hooks[name+'.'+st.op]; if(hook){ const h=hook(st); if(h) return h; }
    const tbl=T[name]||(T[name]=[]); let out;
    if(st.op==='insert'){
      const key=uniq[name]; const added=[];
      for(const r of st.rows){ if(key&&tbl.some(x=>x[key]===r[key])) return {data:null,error:{code:'23505',message:'duplicate key value violates unique constraint'}};
        const row={id:'id'+(seq++),status:undefined,...r}; if(name==='payments'&&!r.status)row.status='created'; if(name==='orders'&&!row.code)row.code='JVTEST'+seq; tbl.push(row); added.push(row); }
      out=added;
    } else {
      let rows=tbl.filter(r=>st.f.every(f=>f(r)));
      if(st.op==='update'){ rows.forEach(r=>Object.assign(r,st.patch)); out=rows; }
      else if(st.op==='delete'){ T[name]=tbl.filter(r=>!rows.includes(r)); out=rows; }
      else out=rows;
      if(st.lim) out=out.slice(0,st.lim);
    }
    if(st.sel_str&&/restaurants:jm_restaurants/.test(st.sel_str)) out=out.map(o=>({...o,restaurants:(T.restaurants||[]).find(x=>x.id===o.restaurant_id)||null}));
    if(st.head) return {data:null,count:out.length,error:null};
    if(st.one){ if(!out.length) return st.one==='single'?{data:null,error:{message:'no rows'}}:{data:null,error:null}; return {data:out[0],error:null}; }
    return {data:out,error:null};
  }
  return api;
}
exports.db=()=>({from:qb,rpc:async(fn)=>({data:null,error:{message:'rpc '+fn}}),auth:{admin:{}}});
