import { useState, useCallback } from "react";

// ─── OPERATIONS MASTER ────────────────────────────────────────────────────────
// limType:
//   "none"     = Manual entry, no upper limit (Cutting, Fusing, Checking)
//   "checking" = Cannot exceed Checking Input qty
//   "order"    = Cannot exceed Order Qty (Ironing, Packing)

const OPS = [
  { id:"cutting",      name:"Cutting",       limType:"none",     extra:null,           billing:true,  group:"manual"   },
  { id:"fusing",       name:"Fusing",        limType:"none",     extra:null,           billing:true,  group:"manual"   },
  { id:"checkingInput",name:"Checking Input",limType:"cutting",  extra:null,           billing:false, group:"tracking" },
  { id:"powerTable",   name:"Power Table",   limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"snls",         name:"SNLS",          limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"kaja",         name:"Kaja",          limType:"checking", extra:"No of Kaja",   billing:true,  group:"checking" },
  { id:"button",       name:"Button",        limType:"checking", extra:"No of Button", billing:true,  group:"checking" },
  { id:"bartag",       name:"Bartag",        limType:"checking", extra:"No of Bartag", billing:true,  group:"checking" },
  { id:"rope",         name:"Rope",          limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"buckles",      name:"Buckles",       limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"piccoding",    name:"Piccoding",     limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"netFolding",   name:"Net Folding",   limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"outerElastic", name:"Outer Elastic", limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"trimmer",      name:"Trimmer",       limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"checking",     name:"Checking",      limType:"none",     extra:null,           billing:true,  group:"manual", hasRework:true },
  { id:"panelIroning", name:"Panel Ironing", limType:"checking", extra:null,           billing:true,  group:"checking" },
  { id:"ironing",      name:"Ironing",       limType:"order",    extra:null,           billing:true,  group:"order"   },
  { id:"packing",      name:"Packing",       limType:"order",    extra:null,           billing:true,  group:"order"   },
];

const ROLES = { admin:"Admin", manager:"Production Manager", entry:"Data Entry", billing:"Billing Staff" };

const USERS = [
  { email:"admin@garment.com",   pass:"sakl@1two345", role:"admin",   name:"Admin User"   },
  { email:"manager@garment.com", pass:"Admin@1234",   role:"manager", name:"Prod Manager" },
  { email:"entry@garment.com",   pass:"Admin@1234",   role:"entry",   name:"Entry Staff"  },
  { email:"billing@garment.com", pass:"Admin@1234",   role:"billing", name:"Billing Staff"},
];

const INIT_ORDERS = [
  { id:"O1", orderNumber:"ORD-001", buyerName:"H&M Global",   styleNumber:"ST-4421", itemName:"Men Trousers", color:"Navy",  size:"M", orderQty:2000, deliveryDate:"2026-06-20", status:"In Progress",
    ops:{ cutting:{on:true,rate:1.5,cont:"Rajan Cutting",mult:1}, fusing:{on:true,rate:0.8,cont:"Kumar Fusing",mult:1}, checkingInput:{on:true,rate:0,cont:"",mult:1}, powerTable:{on:true,rate:0.7,cont:"Power Works",mult:1}, snls:{on:true,rate:0.9,cont:"SNLS Masters",mult:1}, button:{on:true,rate:0.5,cont:"Button Works",mult:8}, checking:{on:true,rate:0.6,cont:"QC Team",mult:1}, ironing:{on:true,rate:1.2,cont:"Selvam Press",mult:1}, packing:{on:true,rate:2.0,cont:"Packing Co",mult:1} }
  },
  { id:"O2", orderNumber:"ORD-002", buyerName:"Zara Exports", styleNumber:"ST-8832", itemName:"Ladies Tops",  color:"White", size:"S", orderQty:1500, deliveryDate:"2026-06-15", status:"Urgent",
    ops:{ cutting:{on:true,rate:1.2,cont:"Rajan Cutting",mult:1}, fusing:{on:true,rate:0.7,cont:"Kumar Fusing",mult:1}, checkingInput:{on:true,rate:0,cont:"",mult:1}, kaja:{on:true,rate:0.3,cont:"Kaja Works",mult:6}, checking:{on:true,rate:0.5,cont:"QC Team",mult:1}, ironing:{on:true,rate:1.0,cont:"Selvam Press",mult:1}, packing:{on:true,rate:1.8,cont:"Packing Co",mult:1} }
  },
];

const INIT_ENTRIES = [
  {id:"E1",oid:"O1",opid:"cutting",      date:"2026-05-10",qty:2050,cont:"Rajan Cutting",reworkQty:0,reworkRate:0},
  {id:"E2",oid:"O1",opid:"fusing",       date:"2026-05-11",qty:900, cont:"Kumar Fusing", reworkQty:0,reworkRate:0},
  {id:"E3",oid:"O1",opid:"checkingInput",date:"2026-05-11",qty:2000,cont:"",             reworkQty:0,reworkRate:0},
  {id:"E4",oid:"O1",opid:"snls",         date:"2026-05-12",qty:600, cont:"SNLS Masters", reworkQty:0,reworkRate:0},
  {id:"E5",oid:"O1",opid:"checking",     date:"2026-05-12",qty:500, cont:"QC Team",      reworkQty:20,reworkRate:2.0},
  {id:"E6",oid:"O2",opid:"cutting",      date:"2026-05-10",qty:1530,cont:"Rajan Cutting",reworkQty:0,reworkRate:0},
  {id:"E7",oid:"O2",opid:"fusing",       date:"2026-05-11",qty:700, cont:"Kumar Fusing", reworkQty:0,reworkRate:0},
  {id:"E8",oid:"O2",opid:"checkingInput",date:"2026-05-11",qty:1400,cont:"",             reworkQty:0,reworkRate:0},
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#0f1117;--ink2:#3a3d4a;--ink3:#7a7f94;--ink4:#b0b5c8;
  --paper:#f7f8fc;--white:#fff;--border:#e4e6f0;--border2:#d0d3e3;
  --accent:#2563eb;--accent-light:#eff4ff;
  --green:#16a34a;--green-light:#f0fdf4;
  --orange:#ea580c;--orange-light:#fff7ed;
  --red:#dc2626;--red-light:#fef2f2;
  --yellow:#ca8a04;--yellow-light:#fefce8;
  --radius:10px;--shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05);--shadow-lg:0 4px 24px rgba(0,0,0,.10);
}
html,body,#root{height:100%;font-family:'DM Sans',sans-serif;background:var(--paper);color:var(--ink)}
.shell{display:flex;height:100vh;overflow:hidden}
.sb{width:220px;flex-shrink:0;background:var(--ink);display:flex;flex-direction:column;overflow:hidden}
.sb-brand{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.sb-logo{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#fff}
.sb-icon{width:32px;height:32px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:16px}
.sb-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:3px}
.nav-lbl{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.3);padding:8px 20px 4px}
.nav-it{display:flex;align-items:center;gap:10px;padding:9px 20px;font-size:13px;color:rgba(255,255,255,.6);cursor:pointer;border-left:2px solid transparent;transition:all .15s;user-select:none}
.nav-it:hover{background:rgba(255,255,255,.06);color:#fff}
.nav-it.on{background:rgba(37,99,235,.2);color:#fff;border-left-color:var(--accent);font-weight:500}
.sb-foot{margin-top:auto;padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px}
.av{width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:56px;background:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px;flex-shrink:0}
.tb-title{font-size:16px;font-weight:600;flex:1}
.content{flex:1;overflow-y:auto;padding:20px 24px}
.card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow)}
.cp{padding:20px 24px}
.ct{font-size:12px;font-weight:600;color:var(--ink2);margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kpi{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;box-shadow:var(--shadow)}
.kl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--ink3);margin-bottom:6px}
.kv{font-size:26px;font-weight:600;color:var(--ink);line-height:1;font-family:'DM Mono',monospace}
.ks{font-size:12px;color:var(--ink3);margin-top:4px}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500}
.bb{background:var(--accent-light);color:var(--accent)}
.bg{background:var(--green-light);color:var(--green)}
.bo{background:var(--orange-light);color:var(--orange)}
.br{background:var(--red-light);color:var(--red)}
.by{background:var(--yellow-light);color:var(--yellow)}
.bgr{background:var(--paper);color:var(--ink3)}
.bpu{background:#f3e8ff;color:#7c3aed}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--paper);padding:9px 13px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--ink3);border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:9px 13px;border-bottom:1px solid var(--border);color:var(--ink);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafbff}
.mn{font-family:'DM Mono',monospace;font-size:12px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.bp{background:var(--accent);color:#fff;border-color:var(--accent)}.bp:hover{background:#1d4ed8}
.bo2{background:#fff;color:var(--ink2);border-color:var(--border2)}.bo2:hover{background:var(--paper)}
.bgh{background:transparent;color:var(--ink3);border-color:transparent;padding:6px 10px}.bgh:hover{background:var(--paper);color:var(--ink)}
.bd{background:var(--red-light);color:var(--red);border-color:#fca5a5}
.bsm{padding:5px 10px;font-size:12px;border-radius:6px}
.fg{display:flex;flex-direction:column;gap:5px}
.fg label{font-size:12px;font-weight:500;color:var(--ink2)}
input,select,textarea{padding:9px 12px;border:1px solid var(--border2);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--white);outline:none;width:100%}
input:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
input[type=number]{-moz-appearance:textfield}
input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
.ferr{font-size:12px;color:var(--red);margin-top:3px}
.fe{border-color:var(--red)!important}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fgrid3{grid-template-columns:1fr 1fr 1fr}
.full{grid-column:1/-1}
.prog{height:6px;border-radius:3px;background:var(--border);overflow:hidden}
.pf{height:100%;border-radius:3px;transition:width .5s}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.sh h2{font-size:18px;font-weight:600}
.tab-bar{display:flex;border-bottom:1px solid var(--border);margin-bottom:20px}
.tab{padding:9px 16px;font-size:13px;font-weight:500;color:var(--ink3);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s}
.tab.on{color:var(--accent);border-bottom-color:var(--accent)}
.al{padding:10px 14px;border-radius:8px;font-size:12px;display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;line-height:1.5}
.alr{background:var(--red-light);color:var(--red);border:1px solid #fca5a5}
.aly{background:var(--yellow-light);color:var(--yellow);border:1px solid #fde68a}
.alg{background:var(--green-light);color:var(--green);border:1px solid #86efac}
.alb{background:var(--accent-light);color:var(--accent);border:1px solid #bfcfff}
.mbg{position:fixed;inset:0;background:rgba(15,17,23,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.mod{background:var(--white);border-radius:14px;box-shadow:var(--shadow-lg);width:100%;max-width:640px;max-height:90vh;overflow-y:auto}
.mhdr{padding:18px 22px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.mbody{padding:18px 22px}
.mft{padding:14px 22px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end}
.or{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.or:last-child{border-bottom:none}
.on2{font-size:13px;font-weight:500;width:130px;flex-shrink:0}
.on2.dis{color:var(--ink4)}
.tw{position:fixed;bottom:20px;right:20px;z-index:2000;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--ink);color:#fff;padding:11px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;box-shadow:var(--shadow-lg);min-width:240px;animation:tin .2s ease}
.tok{background:var(--green)}.terr{background:var(--red)}
@keyframes tin{from{transform:translateX(20px);opacity:0}to{transform:none;opacity:1}}
.lw{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f1117,#1a2035)}
.lc{background:var(--white);border-radius:16px;padding:40px;width:380px;box-shadow:var(--shadow-lg)}
.bar-chart{display:flex;flex-direction:column;gap:10px}
.bar-row{display:flex;align-items:center;gap:10px}
.bar-lbl{font-size:12px;color:var(--ink2);width:110px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar-track{flex:1;height:13px;background:var(--border);border-radius:7px;overflow:hidden}
.bar-fill{height:100%;border-radius:7px;transition:width .6s ease}
.bar-val{font-size:12px;color:var(--ink3);width:40px;font-family:'DM Mono',monospace}
.ig{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px;background:var(--paper);border-radius:8px;margin-bottom:14px}
.il{font-size:10px;color:var(--ink3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
.iv{font-size:18px;font-weight:600;font-family:'DM Mono',monospace}
.bh{background:var(--ink);color:#fff;padding:16px 20px;border-radius:10px 10px 0 0}
.brow{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-bottom:1px solid var(--border);font-size:13px}
.bft{display:flex;justify-content:space-between;align-items:center;padding:13px 18px;background:var(--ink);color:#fff;border-radius:0 0 10px 10px}
/* validation group color coding */
.grp-manual{background:#f0fdf4;border-left:3px solid #16a34a}
.grp-checking{background:#eff4ff;border-left:3px solid #2563eb}
.grp-order{background:#fff7ed;border-left:3px solid #ea580c}
.grp-tracking{background:#f3e8ff;border-left:3px solid #7c3aed}
@media(max-width:768px){.kpi-grid{grid-template-columns:1fr 1fr}.fgrid,.fgrid3{grid-template-columns:1fr}.sb{width:60px}.nav-it span,.sb-sub,.nav-lbl,.sb-logo span,.av-inf{display:none}.sb-logo,.sb-foot{justify-content:center}.content{padding:14px}}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n, d = 2) => (parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fq = n => (parseInt(n) || 0).toLocaleString('en-IN');
const toStr = () => new Date().toISOString().split('T')[0];
const sbd = s => ({ "In Progress":"bb","Completed":"bg","Urgent":"br","On Hold":"by","Cancelled":"bgr" }[s] || "bgr");

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "ok") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return { toasts, show };
}
function Toast({ toasts }) {
  return <div className="tw">{toasts.map(t => <div key={t.id} className={`toast ${t.type==='ok'?'tok':'terr'}`}><span>{t.type==='ok'?'✓':'✕'}</span>{t.msg}</div>)}</div>;
}

// Stable input — individual state per field, no focus loss on typing
function SI({ value, onChange, type="text", placeholder="", cls="", disabled=false, style={}, onKeyDown }) {
  return <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={cls} disabled={disabled} style={style} onKeyDown={onKeyDown} autoComplete="off" />;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@garment.com");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    const u = USERS.find(u => u.email===email && u.pass===pass);
    if (!u) { setErr("Invalid credentials"); return; }
    onLogin(u);
  };
  return (
    <div className="lw">
      <div className="lc">
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:52,height:52,background:'var(--accent)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 12px'}}>✂</div>
          <div style={{fontSize:22,fontWeight:700}}>GarmentERP</div>
          <div style={{fontSize:13,color:'var(--ink3)',marginTop:4}}>Production &amp; Billing System</div>
        </div>
        {err && <div className="al alr">⚠ {err}</div>}
        <div className="fg" style={{marginBottom:12}}><label>Email address</label><SI value={email} onChange={setEmail} placeholder="email@garment.com"/></div>
        <div className="fg" style={{marginBottom:20}}><label>Password</label><SI type="password" value={pass} onChange={setPass} onKeyDown={e=>e.key==='Enter'&&handle()}/></div>
        <button className="btn bp" style={{width:'100%',justifyContent:'center'}} onClick={handle}>Sign in →</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ orders, entries }) {
  const today = toStr();
  const gp = (oid, opid) => entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const todayProd = entries.filter(e=>e.date===today).reduce((s,e)=>s+e.qty,0);
  const pending = orders.filter(o=>!['Completed','Cancelled'].includes(o.status)).length;
  const delayed = orders.filter(o=>o.deliveryDate<today&&!['Completed','Cancelled'].includes(o.status)).length;
  const weekBill = orders.reduce((sum,o)=>sum+OPS.filter(op=>op.billing&&o.ops[op.id]?.on).reduce((s,op)=>{
    const cfg=o.ops[op.id], prod=gp(o.id,op.id);
    const rework=entries.filter(e=>e.oid===o.id&&e.opid===op.id).reduce((s,e)=>s+(e.reworkQty||0)*(e.reworkRate||0),0);
    return s+prod*(cfg.rate||0)*(cfg.mult||1)+rework;
  },0),0);
  const orderProg = orders.map(o=>{
    const en=OPS.filter(op=>o.ops[op.id]?.on&&op.billing);
    const tot=en.length*o.orderQty, done=en.reduce((s,op)=>s+gp(o.id,op.id),0);
    return {...o,pct:tot>0?Math.min(100,Math.round(done/tot*100)):0};
  });
  const opT = OPS.map(op=>({name:op.name,qty:entries.filter(e=>e.date===today&&e.opid===op.id).reduce((s,e)=>s+e.qty,0)})).filter(o=>o.qty>0);
  const maxT = Math.max(...opT.map(o=>o.qty),1);

  return (
    <div>
      <div className="sh"><div><h2>Dashboard</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div></div>
      <div className="kpi-grid">
        <div className="kpi" style={{borderLeft:'3px solid var(--accent)'}}><div className="kl">Today's Production</div><div className="kv">{fq(todayProd)}</div><div className="ks">pieces</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--green)'}}><div className="kl">Week Bill (Est.)</div><div className="kv" style={{fontSize:20}}>₹{fmt(weekBill,0)}</div><div className="ks">auto Saturday</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--orange)'}}><div className="kl">Active Orders</div><div className="kv">{pending}</div><div className="ks">{orders.length} total</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--red)'}}><div className="kl">Delayed Orders</div><div className="kv">{delayed}</div><div className="ks">past delivery</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card cp"><div className="ct">Order Progress</div>
          <div className="bar-chart">{orderProg.map(o=>(
            <div key={o.id} className="bar-row">
              <div className="bar-lbl">{o.orderNumber}</div>
              <div className="bar-track"><div className="bar-fill" style={{width:o.pct+'%',background:o.pct>=80?'#16a34a':o.pct>=40?'#2563eb':'#ea580c'}}/></div>
              <div className="bar-val">{o.pct}%</div>
              <span className={`badge ${sbd(o.status)}`}>{o.status}</span>
            </div>
          ))}</div>
        </div>
        <div className="card cp"><div className="ct">Today's Operations</div>
          {opT.length===0?<div style={{color:'var(--ink3)',fontSize:13,textAlign:'center',padding:20}}>No entries today</div>
          :<div className="bar-chart">{opT.map(o=>(
            <div key={o.name} className="bar-row">
              <div className="bar-lbl">{o.name}</div>
              <div className="bar-track"><div className="bar-fill" style={{width:(o.qty/maxT*100)+'%',background:'var(--accent)'}}/></div>
              <div className="bar-val">{fq(o.qty)}</div>
            </div>
          ))}</div>}
        </div>
      </div>
      <div className="card cp"><div className="ct">Delayed / Urgent Orders</div>
        {delayed===0?<div style={{color:'var(--green)',fontSize:13}}>✓ All orders on track</div>
        :<table><thead><tr><th>Order</th><th>Buyer</th><th>Item</th><th>Delivery</th><th>Status</th></tr></thead>
          <tbody>{orders.filter(o=>o.deliveryDate<today&&!['Completed','Cancelled'].includes(o.status)).map(o=>(
            <tr key={o.id}><td className="mn">{o.orderNumber}</td><td>{o.buyerName}</td><td>{o.itemName}</td>
              <td><span className="badge br">⚠ {o.deliveryDate}</span></td>
              <td><span className={`badge ${sbd(o.status)}`}>{o.status}</span></td></tr>
          ))}</tbody></table>}
      </div>
    </div>
  );
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
function Orders({ orders, setOrders, toast, onGoOps, entries }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [fONo,setFONo]=useState(""); const [fBuyer,setFBuyer]=useState(""); const [fStyle,setFStyle]=useState("");
  const [fItem,setFItem]=useState(""); const [fColor,setFColor]=useState(""); const [fSize,setFSize]=useState("");
  const [fOQty,setFOQty]=useState(""); const [fDel,setFDel]=useState(""); const [fRem,setFRem]=useState("");
  const [fStat,setFStat]=useState("In Progress"); const [errs,setErrs]=useState({});

  const openNew = () => { setFONo("");setFBuyer("");setFStyle("");setFItem("");setFColor("");setFSize("");setFOQty("");setFDel("");setFRem("");setFStat("In Progress");setEditing(null);setErrs({});setModal(true); };
  const openEdit = o => { setFONo(o.orderNumber);setFBuyer(o.buyerName);setFStyle(o.styleNumber||"");setFItem(o.itemName);setFColor(o.color||"");setFSize(o.size||"");setFOQty(String(o.orderQty));setFDel(o.deliveryDate);setFRem(o.remarks||"");setFStat(o.status);setEditing(o.id);setErrs({});setModal(true); };
  const validate = () => { const e={}; if(!fONo.trim())e.oNo='Required'; if(!fBuyer.trim())e.buyer='Required'; if(!fItem.trim())e.item='Required'; if(!fOQty||isNaN(+fOQty)||+fOQty<=0)e.oQty='Must be > 0'; if(!fDel)e.del='Required'; if(orders.some(o=>o.orderNumber===fONo.trim()&&o.id!==editing))e.oNo='Already exists'; return e; };
  const save = () => {
    const e=validate(); if(Object.keys(e).length){setErrs(e);return;}
    if(editing){setOrders(prev=>prev.map(o=>o.id!==editing?o:{...o,orderNumber:fONo,buyerName:fBuyer,styleNumber:fStyle,itemName:fItem,color:fColor,size:fSize,orderQty:+fOQty,deliveryDate:fDel,remarks:fRem,status:fStat}));toast("Order updated");}
    else{setOrders(prev=>[...prev,{id:uid(),orderNumber:fONo,buyerName:fBuyer,styleNumber:fStyle,itemName:fItem,color:fColor,size:fSize,orderQty:+fOQty,deliveryDate:fDel,remarks:fRem,status:fStat,ops:{}}]);toast("Order created");}
    setModal(false);
  };
  const del = id => { if(!confirm("Delete order?"))return; setOrders(prev=>prev.filter(o=>o.id!==id)); toast("Deleted","err"); };
  const fil = orders.filter(o=>!search||[o.orderNumber,o.buyerName,o.itemName].some(v=>v.toLowerCase().includes(search.toLowerCase())));
  const gCut = oid => entries.filter(e=>e.oid===oid&&e.opid==='cutting').reduce((s,e)=>s+e.qty,0);

  return (
    <div>
      <div className="sh">
        <div><h2>Order Management</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{orders.length} orders</div></div>
        <div style={{display:'flex',gap:10}}><SI value={search} onChange={setSearch} placeholder="🔍 Search..." style={{width:200}}/><button className="btn bp" onClick={openNew}>＋ New Order</button></div>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table>
          <thead><tr><th>Order No</th><th>Buyer</th><th>Item</th><th>Order Qty</th><th>Cutting Qty</th><th>Delivery</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {fil.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--ink3)'}}>No orders found</td></tr>}
            {fil.map(o=>{
              const cq=gCut(o.id);
              return(<tr key={o.id}>
                <td><span className="mn" style={{fontWeight:600}}>{o.orderNumber}</span></td>
                <td>{o.buyerName}</td><td>{o.itemName} • {o.color} • {o.size}</td>
                <td className="mn">{fq(o.orderQty)}</td>
                <td className="mn">{cq>0?fq(cq):<span style={{color:'var(--ink4)'}}>—</span>}</td>
                <td><span className={`badge ${o.deliveryDate<toStr()&&o.status!=='Completed'?'br':'bgr'}`}>{o.deliveryDate}</span></td>
                <td><span className={`badge ${sbd(o.status)}`}>{o.status}</span></td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn bo2 bsm" onClick={()=>onGoOps(o.id)}>⚙ Ops</button>
                  <button className="btn bgh bsm" onClick={()=>openEdit(o)}>✎</button>
                  <button className="btn bd bsm" onClick={()=>del(o.id)}>✕</button>
                </div></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      {modal&&(
        <div className="mbg" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="mod">
            <div className="mhdr"><span style={{fontSize:15,fontWeight:500}}>{editing?"Edit Order":"New Order"}</span><button className="btn bgh" onClick={()=>setModal(false)}>✕</button></div>
            <div className="mbody">
              <div className="fgrid">
                <div className="fg"><label>Order Number *</label><SI value={fONo} onChange={setFONo} placeholder="ORD-2026-001" cls={errs.oNo?'fe':''}/>{errs.oNo&&<div className="ferr">⚠ {errs.oNo}</div>}</div>
                <div className="fg"><label>Buyer Name *</label><SI value={fBuyer} onChange={setFBuyer} placeholder="H&M Global" cls={errs.buyer?'fe':''}/>{errs.buyer&&<div className="ferr">⚠ {errs.buyer}</div>}</div>
                <div className="fg"><label>Style Number</label><SI value={fStyle} onChange={setFStyle} placeholder="ST-4421"/></div>
                <div className="fg"><label>Item Name *</label><SI value={fItem} onChange={setFItem} placeholder="Men Trousers" cls={errs.item?'fe':''}/>{errs.item&&<div className="ferr">⚠ {errs.item}</div>}</div>
                <div className="fg"><label>Color</label><SI value={fColor} onChange={setFColor} placeholder="Navy"/></div>
                <div className="fg"><label>Size</label><SI value={fSize} onChange={setFSize} placeholder="M"/></div>
                <div className="fg"><label>Order Quantity *</label><SI type="number" value={fOQty} onChange={setFOQty} placeholder="2000" cls={errs.oQty?'fe':''}/>{errs.oQty&&<div className="ferr">⚠ {errs.oQty}</div>}</div>
                <div className="fg"><label>Delivery Date *</label><SI type="date" value={fDel} onChange={setFDel} cls={errs.del?'fe':''}/>{errs.del&&<div className="ferr">⚠ {errs.del}</div>}</div>
                <div className="fg"><label>Status</label><select value={fStat} onChange={e=>setFStat(e.target.value)}>{['In Progress','Urgent','Completed','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="fg full"><label>Remarks</label><SI value={fRem} onChange={setFRem} placeholder="Optional"/></div>
              </div>
              <div style={{marginTop:10,padding:'10px 14px',background:'var(--accent-light)',borderRadius:8,fontSize:12,color:'var(--accent)'}}>
                ℹ️ Cutting Qty is entered in Daily Entry → Cutting operation
              </div>
            </div>
            <div className="mft"><button className="btn bo2" onClick={()=>setModal(false)}>Cancel</button><button className="btn bp" onClick={save}>{editing?"Update":"Create"} Order</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OPERATIONS ──────────────────────────────────────────────────────────────
function Operations({ orders, setOrders, entries, toast, userRole }) {
  const [oid, setOid] = useState(orders[0]?.id||"");
  const order = orders.find(o=>o.id===oid);
  const isAdmin = userRole==='admin';
  const gp = opid => entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const cuttingQty=gp('cutting'), checkingQty=gp('checkingInput');
  const upd = (opid,field,value) => { if(!isAdmin)return; setOrders(prev=>prev.map(o=>o.id!==oid?o:{...o,ops:{...o.ops,[opid]:{...(o.ops[opid]||{}),[field]:value}}})); };
  if(!order) return <div style={{textAlign:'center',padding:40,color:'var(--ink3)'}}>No orders</div>;

  const getLim = op => {
    if(op.limType==='order') return order.orderQty;
    if(op.limType==='cutting') return cuttingQty;
    if(op.limType==='checking') return checkingQty;
    return null; // none = manual
  };

  return (
    <div>
      <div className="sh">
        <div><h2>Operations Setup</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{isAdmin?"Admin — full edit access":"View only — Admin required"}</div></div>
        <span style={{padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:600,background:isAdmin?'#dcfce7':'#f3e8ff',color:isAdmin?'#16a34a':'#7c3aed'}}>{isAdmin?"🛡 Admin":"👁 View Only"}</span>
      </div>
      {!isAdmin&&<div className="al aly">⚠ Only Admin can modify operations, rates and contractors.</div>}
      <div className="card cp" style={{marginBottom:14}}>
        <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <div className="fg" style={{margin:0,flex:'0 0 260px'}}><label>Select Order</label>
            <select value={oid} onChange={e=>setOid(e.target.value)}>{orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber} — {o.buyerName}</option>)}</select>
          </div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>ORDER QTY</div><span className="badge bb">{fq(order.orderQty)}</span></div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>CUTTING QTY</div><span className="badge by">{fq(cuttingQty)}</span></div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>CHECKING INPUT</div><span className="badge bg">{fq(checkingQty)}</span></div>
        </div>
      </div>
      <div className="card cp">
        {OPS.map(op=>{
          const cfg=order.ops[op.id]||{on:false,rate:0,cont:'',mult:1};
          const prod=gp(op.id);
          const lim=getLim(op);
          const pct=lim&&lim>0?Math.min(100,Math.round(prod/lim*100)):0;
          const rework=entries.filter(e=>e.oid===oid&&e.opid===op.id).reduce((s,e)=>s+(e.reworkQty||0)*(e.reworkRate||0),0);
          const billed=prod*(cfg.rate||0)*(cfg.mult||1)+rework;
          const limLabel = op.limType==='order'?'🔒 order':op.limType==='cutting'?'✂ cutting':op.limType==='checking'?'✅ checking input':'✏️ manual';
          return (
            <div key={op.id} className="or">
              <input type="checkbox" checked={!!cfg.on} disabled={!isAdmin} onChange={e=>upd(op.id,'on',e.target.checked)} style={{width:16,height:16,cursor:isAdmin?'pointer':'not-allowed',accentColor:'var(--accent)',flexShrink:0}}/>
              <div className={`on2 ${!cfg.on?'dis':''}`}>{op.name}{!op.billing&&<span className="badge bgr" style={{fontSize:10,marginLeft:4}}>no bill</span>}</div>
              <div style={{flex:1,minWidth:130}}><SI disabled={!isAdmin||!cfg.on} placeholder="Contractor" value={cfg.cont||''} onChange={v=>upd(op.id,'cont',v)} style={{opacity:cfg.on&&isAdmin?1:.5}}/></div>
              {op.billing&&<SI type="number" disabled={!isAdmin||!cfg.on} placeholder="Rate" value={String(cfg.rate||'')} onChange={v=>upd(op.id,'rate',parseFloat(v)||0)} style={{width:80,opacity:cfg.on&&isAdmin?1:.5}}/>}
              {op.extra&&<SI type="number" disabled={!isAdmin||!cfg.on} placeholder={op.extra} value={String(cfg.mult||1)} onChange={v=>upd(op.id,'mult',parseInt(v)||1)} style={{width:80,opacity:cfg.on&&isAdmin?1:.5}}/>}
              <div style={{minWidth:120,fontSize:11}}>
                {cfg.on&&prod>0&&<>
                  {op.billing&&<span className="badge bg">₹{fmt(billed,2)}</span>}
                  {lim&&lim>0&&<><div className="prog" style={{width:110,marginTop:4}}><div className="pf" style={{width:pct+'%',background:pct>80?'#16a34a':'var(--accent)'}}/></div>
                  <span style={{fontSize:10,color:'var(--ink3)'}}>{fq(prod)}/{fq(lim)}</span></>}
                </>}
              </div>
              <div style={{fontSize:10,color:'var(--ink4)',minWidth:90}}>{limLabel}</div>
            </div>
          );
        })}
        {isAdmin&&<div style={{marginTop:14}}><button className="btn bp" onClick={()=>toast("Operations saved")}>💾 Save</button></div>}
      </div>
    </div>
  );
}

// ─── DAILY ENTRY ──────────────────────────────────────────────────────────────
function Production({ orders, entries, setEntries, toast }) {
  const [oid, setOid] = useState(orders[0]?.id||"");
  const [opid, setOpid] = useState("cutting");
  const [date, setDate] = useState(toStr());
  const [qty, setQty] = useState("");
  const [cont, setCont] = useState("");
  const [rem, setRem] = useState("");
  const [rQty, setRQty] = useState("");
  const [rRate, setRRate] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("entry");

  const order = orders.find(o=>o.id===oid);
  const enOps = order ? OPS.filter(op=>order.ops[op.id]?.on) : [];
  const selOp = OPS.find(op=>op.id===opid);

  const gp = (o,op) => entries.filter(e=>e.oid===o&&e.opid===op).reduce((s,e)=>s+e.qty,0);
  const cuttingQty   = gp(oid,'cutting');
  const checkingQty  = gp(oid,'checkingInput');

  // ─── CORE VALIDATION LOGIC ───────────────────────────────────────────────
  // limType="none"     → Cutting, Fusing, Checking — manual entry, NO upper limit
  // limType="cutting"  → Checking Input only, limited by Cutting Qty
  // limType="checking" → Power Table, SNLS, Kaja, Button, Bartag, Rope, Buckles,
  //                      Piccoding, Net Folding, Outer Elastic, Trimmer, Panel Ironing
  //                      → limited by Checking Input Qty
  // limType="order"    → Ironing, Packing → limited by Order Qty

  const getLimit = () => {
    if(!selOp||!order) return null;
    if(selOp.limType==='none')     return null;           // no limit
    if(selOp.limType==='cutting')  return cuttingQty;     // checking input ≤ cutting
    if(selOp.limType==='checking') return checkingQty;    // ops ≤ checking input
    if(selOp.limType==='order')    return order.orderQty; // ironing/packing ≤ order
    return null;
  };

  const limit    = getLimit();
  const produced = gp(oid, opid);
  const balance  = limit!=null ? limit - produced : null;

  const getLimLabel = () => {
    if(!selOp) return '';
    if(selOp.limType==='none')     return 'Manual entry (no limit)';
    if(selOp.limType==='cutting')  return `Cutting Qty limit (${fq(cuttingQty)} pcs)`;
    if(selOp.limType==='checking') return `Checking Input limit (${fq(checkingQty)} pcs)`;
    if(selOp.limType==='order')    return `Order Qty limit (${fq(order?.orderQty)} pcs)`;
    return '';
  };

  const getLimColor = () => {
    if(selOp?.limType==='none')     return '#16a34a';
    if(selOp?.limType==='cutting')  return '#7c3aed';
    if(selOp?.limType==='checking') return '#2563eb';
    if(selOp?.limType==='order')    return '#ea580c';
    return 'var(--ink3)';
  };

  const submit = () => {
    setErr("");
    const q = parseInt(qty);
    if(!q||q<=0) { setErr("Enter valid quantity"); return; }
    if(opid!=='checkingInput'&&!cont.trim()) { setErr("Enter contractor name"); return; }

    // Prerequisite checks
    if(selOp?.limType==='checking' && checkingQty===0) {
      setErr("Enter Checking Input qty first before this operation."); return;
    }
    if(selOp?.limType==='cutting' && cuttingQty===0) {
      setErr("Enter Cutting qty first before Checking Input."); return;
    }

    // Balance check
    if(balance!=null && q > balance) {
      setErr(`Exceeds limit! ${getLimLabel()}. Balance: ${fq(Math.max(0,balance))} pcs`); return;
    }

    setEntries(prev=>[...prev,{id:uid(),oid,opid,date,qty:q,cont,rem,reworkQty:parseInt(rQty)||0,reworkRate:parseFloat(rRate)||0}]);
    setQty(""); setRem(""); setRQty(""); setRRate(""); setErr("");
    toast(`✓ ${fq(q)} pcs — ${selOp?.name}`);
  };

  const delE = id => { if(!confirm("Delete?"))return; setEntries(prev=>prev.filter(e=>e.id!==id)); toast("Deleted","err"); };
  const allE  = [...entries].sort((a,b)=>b.date.localeCompare(a.date));
  const todayE = entries.filter(e=>e.date===toStr());

  // Group badge for selected op
  const grpBadge = () => {
    if(!selOp) return null;
    const g = selOp.limType;
    if(g==='none')     return <span className="badge bg">✏️ Manual entry — no limit</span>;
    if(g==='cutting')  return <span className="badge bpu">✂ Limited by Cutting Qty ({fq(cuttingQty)} pcs)</span>;
    if(g==='checking') return <span className="badge bb">✅ Limited by Checking Input ({fq(checkingQty)} pcs)</span>;
    if(g==='order')    return <span className="badge bo">🔒 Limited by Order Qty ({fq(order?.orderQty)} pcs)</span>;
  };

  return (
    <div>
      <div className="sh"><h2>Daily Production Entry</h2></div>

      {/* ── VALIDATION REFERENCE CARD ── */}
      <div className="card cp" style={{marginBottom:14}}>
        <div className="ct">Validation rules reference</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#f0fdf4',borderLeft:'3px solid #16a34a',fontSize:12}}>
            <strong style={{color:'#16a34a'}}>✏️ Manual entry (no limit)</strong><br/>
            <span style={{color:'var(--ink3)'}}>Cutting • Fusing • Checking</span>
          </div>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#f3e8ff',borderLeft:'3px solid #7c3aed',fontSize:12}}>
            <strong style={{color:'#7c3aed'}}>✂ Limited by Cutting Qty</strong><br/>
            <span style={{color:'var(--ink3)'}}>Checking Input only</span>
          </div>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#eff4ff',borderLeft:'3px solid #2563eb',fontSize:12}}>
            <strong style={{color:'#2563eb'}}>✅ Limited by Checking Input</strong><br/>
            <span style={{color:'var(--ink3)'}}>Power Table • SNLS • Kaja • Button • Bartag • Rope • Buckles • Piccoding • Net Folding • Outer Elastic • Trimmer • Panel Ironing</span>
          </div>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#fff7ed',borderLeft:'3px solid #ea580c',fontSize:12}}>
            <strong style={{color:'#ea580c'}}>🔒 Limited by Order Qty</strong><br/>
            <span style={{color:'var(--ink3)'}}>Ironing • Packing</span>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <div className={`tab ${tab==='entry'?'on':''}`} onClick={()=>setTab('entry')}>📝 New Entry</div>
        <div className={`tab ${tab==='today'?'on':''}`} onClick={()=>setTab('today')}>📋 Today ({todayE.length})</div>
        <div className={`tab ${tab==='all'?'on':''}`} onClick={()=>setTab('all')}>📁 All ({entries.length})</div>
      </div>

      {tab==='entry'&&(
        <div className="card cp">
          <div className="fgrid fgrid3" style={{marginBottom:14}}>
            <div className="fg"><label>Order *</label>
              <select value={oid} onChange={e=>setOid(e.target.value)}>
                {orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber} — {o.buyerName}</option>)}
              </select>
            </div>
            <div className="fg"><label>Operation *</label>
              <select value={opid} onChange={e=>{setOpid(e.target.value);setErr("");}}>
                {enOps.map(op=><option key={op.id} value={op.id}>{op.name}{!op.billing?' (tracking)':''}</option>)}
              </select>
            </div>
            <div className="fg"><label>Date *</label><SI type="date" value={date} onChange={setDate}/></div>
            {opid!=='checkingInput'&&<div className="fg"><label>Contractor *</label><SI value={cont} onChange={setCont} placeholder="Contractor name"/></div>}
            <div className="fg">
              <label>Quantity * {balance!=null?`(max: ${fq(Math.max(0,balance))})`:''}</label>
              <SI type="number" value={qty} onChange={setQty} placeholder={balance!=null&&balance>0?String(balance):"Enter qty"} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div className="fg"><label>Remarks</label><SI value={rem} onChange={setRem} placeholder="Optional"/></div>
            {opid==='checking'&&<>
              <div className="fg"><label>Rework Qty</label><SI type="number" value={rQty} onChange={setRQty} placeholder="0"/></div>
              <div className="fg"><label>Rework Rate (₹)</label><SI type="number" value={rRate} onChange={setRRate} placeholder="0.00"/></div>
              {rQty&&rRate&&<div className="fg"><label>Rework Amount</label>
                <div style={{padding:'9px 12px',background:'var(--green-light)',borderRadius:8,color:'var(--green)',fontWeight:500}}>
                  ₹{fmt((parseInt(rQty)||0)*(parseFloat(rRate)||0),2)}
                </div>
              </div>}
            </>}
          </div>

          {/* Limit type indicator */}
          <div style={{marginBottom:12}}>{grpBadge()}</div>

          {/* Balance info panel */}
          {order&&opid&&(
            <div className="ig">
              <div>
                <div className="il">{selOp?.limType==='none'?'No limit':'Limit'}</div>
                <div className="iv" style={{color:getLimColor()}}>{limit!=null?fq(limit):'∞'}</div>
              </div>
              <div><div className="il">Prev Produced</div><div className="iv">{fq(produced)}</div></div>
              <div>
                <div className="il">Balance</div>
                <div className="iv" style={{color:balance==null?'var(--green)':balance<100?'var(--red)':balance<500?'var(--orange)':'var(--green)'}}>
                  {balance!=null?fq(Math.max(0,balance)):'∞'}
                </div>
              </div>
              <div>
                <div className="il">Progress</div>
                {limit!=null&&limit>0?<>
                  <div className="prog" style={{marginTop:8}}><div className="pf" style={{width:Math.min(100,produced/limit*100)+'%',background:'var(--accent)'}}/></div>
                  <div style={{fontSize:10,color:'var(--ink3)',marginTop:3}}>{Math.min(100,Math.round(produced/limit*100))}%</div>
                </>:<div style={{fontSize:13,color:'var(--green)',marginTop:6}}>Manual</div>}
              </div>
            </div>
          )}

          {/* Prerequisite warnings */}
          {selOp?.limType==='checking'&&checkingQty===0&&(
            <div className="al aly">⚠ Enter <strong>Checking Input</strong> qty first. Currently: 0 pcs.</div>
          )}
          {selOp?.limType==='cutting'&&cuttingQty===0&&(
            <div className="al aly">⚠ Enter <strong>Cutting</strong> qty first. Currently: 0 pcs.</div>
          )}

          {err&&<div className="al alr">⚠ {err}</div>}
          {balance!=null&&balance<=0&&<div className="al aly">⚠ Quantity limit reached for {selOp?.name}.</div>}

          <button className="btn bp" onClick={submit} disabled={balance!=null&&balance<=0}>✓ Save Entry</button>
        </div>
      )}

      {(tab==='today'||tab==='all')&&(
        <div className="card" style={{overflow:'hidden'}}>
          <table>
            <thead><tr><th>Date</th><th>Order</th><th>Operation</th><th>Type</th><th>Contractor</th><th>Qty</th><th>Rework</th><th></th></tr></thead>
            <tbody>
              {(tab==='today'?todayE:allE).length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'var(--ink3)'}}>No entries</td></tr>}
              {(tab==='today'?todayE:allE).map(e=>{
                const o=orders.find(x=>x.id===e.oid);
                const op=OPS.find(x=>x.id===e.opid);
                const rAmt=(e.reworkQty||0)*(e.reworkRate||0);
                const typeBadge = op?.limType==='none'?<span className="badge bg" style={{fontSize:10}}>Manual</span>:op?.limType==='checking'?<span className="badge bb" style={{fontSize:10}}>Chk Input</span>:op?.limType==='cutting'?<span className="badge bpu" style={{fontSize:10}}>Cutting</span>:<span className="badge bo" style={{fontSize:10}}>Order</span>;
                return(<tr key={e.id}>
                  <td className="mn">{e.date}</td>
                  <td><strong>{o?.orderNumber}</strong></td>
                  <td><span className={`badge ${op?.billing?'bb':'bgr'}`}>{op?.name}</span></td>
                  <td>{typeBadge}</td>
                  <td>{e.cont||'—'}</td>
                  <td><strong>{fq(e.qty)}</strong></td>
                  <td style={{fontSize:12,color:'var(--ink3)'}}>{rAmt>0?`₹${fmt(rAmt,2)}`:'—'}</td>
                  <td><button className="btn bd bsm" onClick={()=>delE(e.id)}>✕</button></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── BILLING ─────────────────────────────────────────────────────────────────
function Billing({ orders, entries, toast }) {
  const [bills,setBills]=useState([]); const [generated,setGenerated]=useState(false); const [weekOff,setWeekOff]=useState(0);
  const getWeek = off=>{const now=new Date();now.setDate(now.getDate()+off*7);const day=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-(day===0?6:day-1));const sat=new Date(mon);sat.setDate(mon.getDate()+5);return{s:mon.toISOString().split('T')[0],e:sat.toISOString().split('T')[0]};};
  const {s:ws,e:we}=getWeek(weekOff);
  const generate = () => {
    const lines=[];
    orders.forEach(o=>{
      OPS.filter(op=>op.billing&&o.ops[op.id]?.on).forEach(op=>{
        const cfg=o.ops[op.id];
        const wE=entries.filter(e=>e.oid===o.id&&e.opid===op.id&&e.date>=ws&&e.date<=we);
        const qty=wE.reduce((s,e)=>s+e.qty,0);
        const rework=wE.reduce((s,e)=>s+(e.reworkQty||0)*(e.reworkRate||0),0);
        if(!qty&&!rework)return;
        const total=qty*(cfg.rate||0)*(cfg.mult||1)+rework;
        lines.push({oNo:o.orderNumber,buyer:o.buyerName,opName:op.name,cont:cfg.cont,qty,rate:cfg.rate||0,mult:cfg.mult||1,rework,total,hasExtra:!!op.extra});
      });
    });
    const groups={};
    lines.forEach(l=>{if(!groups[l.cont])groups[l.cont]={items:[],total:0};groups[l.cont].items.push(l);groups[l.cont].total+=l.total;});
    const nb=Object.entries(groups).map(([cont,d])=>({id:uid(),billNumber:`BILL-${we.slice(0,7)}-${cont.replace(/[^a-z0-9]/gi,'').slice(0,5).toUpperCase()}`,ws,we,cont,items:d.items,total:d.total}));
    setBills(nb);setGenerated(true);toast(`${nb.length} bill(s) generated`);
  };
  const gt=bills.reduce((s,b)=>s+b.total,0);
  return (
    <div>
      <div className="sh">
        <div><h2>Weekly Bills</h2><div style={{fontSize:13,color:'var(--ink3)'}}>Auto Saturday midnight</div></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn bo2 bsm" onClick={()=>setWeekOff(w=>w-1)}>← Prev</button>
          <span className="badge bb">{ws} → {we}</span>
          <button className="btn bo2 bsm" onClick={()=>setWeekOff(w=>w+1)}>Next →</button>
          <button className="btn bp" onClick={generate}>⚡ Generate</button>
        </div>
      </div>
      {generated&&<div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:16}}>
        <div className="kpi" style={{borderLeft:'3px solid var(--accent)'}}><div className="kl">Grand Total</div><div className="kv" style={{fontSize:20}}>₹{fmt(gt,2)}</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--green)'}}><div className="kl">Bills</div><div className="kv">{bills.length}</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--orange)'}}><div className="kl">Line Items</div><div className="kv">{bills.reduce((s,b)=>s+b.items.length,0)}</div></div>
      </div>}
      {!generated&&<div className="card cp" style={{textAlign:'center',padding:50}}><div style={{fontSize:40,marginBottom:14}}>🧾</div><div style={{fontWeight:500,marginBottom:16}}>No bills yet</div><button className="btn bp" onClick={generate}>⚡ Generate Bills</button></div>}
      {bills.map(bill=>(
        <div key={bill.id} className="card" style={{marginBottom:14,overflow:'hidden'}}>
          <div className="bh">
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:11,opacity:.5,marginBottom:3}}>BILL NO</div><div style={{fontSize:16,fontWeight:700,fontFamily:'DM Mono,monospace'}}>{bill.billNumber}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:11,opacity:.5,marginBottom:3}}>TOTAL</div><div style={{fontSize:20,fontWeight:700,fontFamily:'DM Mono,monospace'}}>₹{fmt(bill.total,2)}</div></div>
            </div>
            <div style={{fontSize:12,opacity:.6,marginTop:8}}>{bill.cont} • {bill.ws} to {bill.we}</div>
          </div>
          {bill.items.map((item,i)=>(
            <div key={i} className="brow">
              <div><div style={{fontWeight:500}}>{item.opName}</div><div style={{fontSize:11,color:'var(--ink3)'}}>{item.oNo} • {item.buyer}</div></div>
              <div style={{fontSize:11,color:'var(--ink3)',textAlign:'right'}}>{fq(item.qty)} × ₹{item.rate}{item.hasExtra&&item.mult>1?` × ${item.mult}`:''}{item.rework>0&&<div>+ Rework ₹{fmt(item.rework,2)}</div>}</div>
              <div style={{fontWeight:600,fontFamily:'DM Mono,monospace',minWidth:80,textAlign:'right'}}>₹{fmt(item.total,2)}</div>
            </div>
          ))}
          <div className="bft"><span>{bill.cont}</span><span style={{fontSize:18,fontWeight:700,fontFamily:'DM Mono,monospace'}}>₹{fmt(bill.total,2)}</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ orders, entries }) {
  const [tab,setTab]=useState("pending");
  const gp = (oid,opid) => entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const pendingRows=[];
  orders.forEach(o=>{
    const cq=gp(o.id,'cutting'), ckq=gp(o.id,'checkingInput');
    OPS.filter(op=>o.ops[op.id]?.on).forEach(op=>{
      const lim=op.limType==='order'?o.orderQty:op.limType==='cutting'?cq:op.limType==='checking'?ckq:null;
      if(lim==null)return; // manual ops have no limit, skip
      const prod=gp(o.id,op.id), bal=lim-prod;
      if(bal>0) pendingRows.push({oNo:o.orderNumber,buyer:o.buyerName,opName:op.name,cont:o.ops[op.id].cont,lim,prod,bal,pct:lim>0?Math.round(prod/lim*100):0});
    });
  });
  const orderStatus=orders.map(o=>{
    const cq=gp(o.id,'cutting');
    const en=OPS.filter(op=>o.ops[op.id]?.on&&op.billing);
    const tot=en.length*o.orderQty,done=en.reduce((s,op)=>s+gp(o.id,op.id),0);
    return{...o,pct:tot>0?Math.min(100,Math.round(done/tot*100)):0,cuttingQty:cq,done};
  });

  return (
    <div>
      <div className="sh"><h2>Reports</h2></div>
      <div className="tab-bar">
        <div className={`tab ${tab==='pending'?'on':''}`} onClick={()=>setTab('pending')}>⏳ Pending Qty</div>
        <div className={`tab ${tab==='status'?'on':''}`} onClick={()=>setTab('status')}>📦 Order Status</div>
      </div>
      {tab==='pending'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span className="badge bo">{pendingRows.length} ops pending</span></div>
          <div className="card" style={{overflow:'hidden'}}>
            <table>
              <thead><tr><th>Order</th><th>Operation</th><th>Contractor</th><th>Limit</th><th>Produced</th><th>Balance</th><th>%</th></tr></thead>
              <tbody>
                {pendingRows.map((r,i)=>(
                  <tr key={i}>
                    <td className="mn" style={{fontWeight:600}}>{r.oNo}</td>
                    <td><span className="badge bb">{r.opName}</span></td>
                    <td style={{fontSize:12}}>{r.cont}</td>
                    <td className="mn">{fq(r.lim)}</td><td className="mn">{fq(r.prod)}</td>
                    <td><span className={`badge ${r.bal<200?'br':r.bal<500?'bo':'bg'}`}>{fq(r.bal)}</span></td>
                    <td style={{width:100}}><div className="prog"><div className="pf" style={{width:r.pct+'%',background:r.pct>80?'#16a34a':'var(--accent)'}}/></div><div style={{fontSize:10,color:'var(--ink3)',marginTop:2}}>{r.pct}%</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='status'&&(
        <div className="card" style={{overflow:'hidden'}}>
          <table>
            <thead><tr><th>Order</th><th>Buyer</th><th>Order Qty</th><th>Cutting Qty</th><th>Delivery</th><th>Status</th><th>Progress</th></tr></thead>
            <tbody>{orderStatus.map(o=>(
              <tr key={o.id}>
                <td className="mn" style={{fontWeight:600}}>{o.orderNumber}</td>
                <td>{o.buyerName}</td><td className="mn">{fq(o.orderQty)}</td><td className="mn">{fq(o.cuttingQty)}</td>
                <td><span className={`badge ${o.deliveryDate<toStr()&&o.status!=='Completed'?'br':'bgr'}`}>{o.deliveryDate}</span></td>
                <td><span className={`badge ${sbd(o.status)}`}>{o.status}</span></td>
                <td style={{width:140}}><div className="prog"><div className="pf" style={{width:o.pct+'%',background:o.pct>80?'#16a34a':'var(--accent)'}}/></div><div style={{fontSize:10,color:'var(--ink3)',marginTop:2}}>{o.pct}% • {fq(o.done)} pcs</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function Users() {
  return (
    <div>
      <div className="sh"><h2>User Management</h2></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        {Object.entries(ROLES).map(([k,v])=>(
          <div key={k} className="card cp" style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:42,height:42,borderRadius:10,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
              {k==='admin'?'🛡':k==='manager'?'📊':k==='entry'?'✏️':'🧾'}
            </div>
            <div>
              <div style={{fontWeight:600}}>{v}</div>
              <div style={{fontSize:12,color:'var(--ink3)',marginTop:2}}>
                {k==='admin'?'Full access + operations edit':k==='manager'?'Orders + production + reports':k==='entry'?'Daily entry only':'Billing + reports only'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Operations Access</th></tr></thead>
          <tbody>{USERS.map((u,i)=>(
            <tr key={i}>
              <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="av" style={{width:26,height:26,fontSize:11}}>{u.name[0]}</div>{u.name}</div></td>
              <td style={{fontSize:12,color:'var(--ink3)'}}>{u.email}</td>
              <td><span className="badge bb">{ROLES[u.role]}</span></td>
              <td>{u.role==='admin'?<span className="badge bg">✓ Edit</span>:<span className="badge bgr">View Only</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const NAV=[
  {id:'dashboard',label:'Dashboard',  icon:'📊'},
  {id:'orders',   label:'Orders',     icon:'📋'},
  {id:'operations',label:'Operations',icon:'⚙️'},
  {id:'production',label:'Daily Entry',icon:'✏️'},
  {id:'billing',  label:'Weekly Bills',icon:'🧾'},
  {id:'reports',  label:'Reports',    icon:'📈'},
  {id:'users',    label:'Users',      icon:'👥'},
];

export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState('dashboard');
  const [orders,setOrders]=useState(INIT_ORDERS);
  const [entries,setEntries]=useState(INIT_ENTRIES);
  const [opsOid,setOpsOid]=useState(null);
  const {toasts,show:toast}=useToast();
  const goOps=oid=>{setOpsOid(oid);setPage('operations');};
  if(!user) return <><style>{G}</style><Login onLogin={setUser}/><Toast toasts={toasts}/></>;
  return (
    <>
      <style>{G}</style>
      <div className="shell">
        <aside className="sb">
          <div className="sb-brand"><div className="sb-logo"><div className="sb-icon">✂</div><span>GarmentERP</span></div><div className="sb-sub">Production &amp; Billing</div></div>
          <div className="nav-lbl">Main Menu</div>
          {NAV.map(n=><div key={n.id} className={`nav-it ${page===n.id?'on':''}`} onClick={()=>setPage(n.id)}><span>{n.icon}</span><span>{n.label}</span></div>)}
          <div className="sb-foot"><div className="av">{user.name[0]}</div><div className="av-inf"><div style={{fontSize:12,fontWeight:500,color:'#fff'}}>{user.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{ROLES[user.role]}</div></div></div>
        </aside>
        <div className="main">
          <div className="topbar"><div className="tb-title">{NAV.find(n=>n.id===page)?.label}</div><span className="badge bg">🟢 Live</span><button className="btn bgh bsm" onClick={()=>setUser(null)}>Sign out</button></div>
          <div className="content">
            {page==='dashboard'  &&<Dashboard orders={orders} entries={entries}/>}
            {page==='orders'     &&<Orders orders={orders} setOrders={setOrders} toast={toast} onGoOps={goOps} entries={entries}/>}
            {page==='operations' &&<Operations orders={orders} setOrders={setOrders} entries={entries} toast={toast} userRole={user.role}/>}
            {page==='production' &&<Production orders={orders} entries={entries} setEntries={setEntries} toast={toast}/>}
            {page==='billing'    &&<Billing orders={orders} entries={entries} toast={toast}/>}
            {page==='reports'    &&<Reports orders={orders} entries={entries}/>}
            {page==='users'      &&<Users/>}
          </div>
        </div>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}
