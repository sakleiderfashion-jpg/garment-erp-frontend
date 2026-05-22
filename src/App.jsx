import { useState, useCallback, useEffect } from "react";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API = "https://garment-erp-backend-production.up.railway.app/api";

// API helper — sends requests with JWT token
async function api(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── OPERATIONS MASTER ────────────────────────────────────────────────────────
const OPS = [
  { id:"cutting",      name:"Cutting",       limType:"none",     extra:null,           billing:true,  defaultOn:true  },
  { id:"fusing",       name:"Fusing",        limType:"none",     extra:null,           billing:true,  defaultOn:false },
  { id:"checkingInput",name:"Checking Input",limType:"cutting",  extra:null,           billing:false, defaultOn:true  },
  { id:"powerTable",   name:"Power Table",   limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"snls",         name:"SNLS",          limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"kaja",         name:"Kaja",          limType:"auto",     extra:"No of Kaja",   billing:true,  defaultOn:false },
  { id:"button",       name:"Button",        limType:"auto",     extra:"No of Button", billing:true,  defaultOn:false },
  { id:"bartag",       name:"Bartag",        limType:"auto",     extra:"No of Bartag", billing:true,  defaultOn:false },
  { id:"rope",         name:"Rope",          limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"buckles",      name:"Buckles",       limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"piccoding",    name:"Piccoding",     limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"netFolding",   name:"Net Folding",   limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"outerElastic", name:"Outer Elastic", limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"trimmer",      name:"Trimmer",       limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"checking",     name:"Checking",      limType:"checking", extra:null,           billing:true,  defaultOn:false, hasRework:true },
  { id:"panelIroning", name:"Panel Ironing", limType:"auto",     extra:null,           billing:true,  defaultOn:false },
  { id:"ironing",      name:"Ironing",       limType:"order",    extra:null,           billing:true,  defaultOn:false },
  { id:"packing",      name:"Packing",       limType:"order",    extra:null,           billing:true,  defaultOn:false },
];

const buildDefaultOps = () => {
  const ops = {};
  OPS.forEach(op => { if (op.defaultOn) ops[op.id] = { on: true, rate: 0, mult: 1 }; });
  return ops;
};

const ensureCheckingInput = orders => orders.map(o => ({
  ...o, ops: { checkingInput: { on: true, rate: 0, mult: 1 }, ...o.ops }
}));

const ROLES = { admin:"Admin", manager:"Production Manager", entry:"Data Entry", billing:"Billing Staff" };

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
  --purple:#7c3aed;--purple-light:#f3e8ff;
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
.ct{font-size:11px;font-weight:600;color:var(--ink3);margin-bottom:14px;text-transform:uppercase;letter-spacing:.6px}
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
.bpu{background:var(--purple-light);color:var(--purple)}
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
.on2{font-size:13px;font-weight:500;width:150px;flex-shrink:0}
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
.spin{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading{display:flex;align-items:center;justify-content:center;padding:60px;gap:12px;color:var(--ink3);font-size:14px}
.conn-status{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500}
.conn-ok{background:#dcfce7;color:#16a34a}
.conn-err{background:#fee2e2;color:#dc2626}
@media(max-width:768px){.kpi-grid{grid-template-columns:1fr 1fr}.fgrid,.fgrid3{grid-template-columns:1fr}.sb{width:60px}.nav-it span,.sb-sub,.nav-lbl,.sb-logo span,.av-inf{display:none}.sb-logo,.sb-foot{justify-content:center}.content{padding:14px}}
`;

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
function SI({ value, onChange, type="text", placeholder="", cls="", disabled=false, style={}, onKeyDown }) {
  return <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={cls} disabled={disabled} style={style} onKeyDown={onKeyDown} autoComplete="off"/>;
}
function Loader() {
  return <div className="loading"><div className="spin"/> Loading...</div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,setEmail]=useState("admin@garment.com");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle = async () => {
    setErr(""); setLoading(true);
    try {
      // Try real backend first
      const data = await api("POST", "/auth/login", { email, password: pass });
      onLogin({ ...data.data.user, token: data.data.token });
    } catch (e) {
      setErr(e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lw"><div className="lc">
      <div style={{textAlign:'center',marginBottom:28}}>
        <div style={{width:52,height:52,background:'var(--accent)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 12px'}}>✂</div>
        <div style={{fontSize:22,fontWeight:700}}>GarmentERP</div>
        <div style={{fontSize:13,color:'var(--ink3)',marginTop:4}}>Production &amp; Billing System</div>
      </div>
      {err&&<div className="al alr">⚠ {err}</div>}
      <div className="fg" style={{marginBottom:12}}><label>Email</label><SI value={email} onChange={setEmail} placeholder="email@garment.com"/></div>
      <div className="fg" style={{marginBottom:20}}><label>Password</label><SI type="password" value={pass} onChange={setPass} onKeyDown={e=>e.key==='Enter'&&handle()}/></div>
      <button className="btn bp" style={{width:'100%',justifyContent:'center'}} onClick={handle} disabled={loading}>
        {loading?<><div className="spin"/> Signing in...</>:"Sign in →"}
      </button>
    </div></div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ orders, entries, token }) {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = toStr();

  useEffect(() => {
    api("GET", "/reports/dashboard", null, token)
      .then(d => setDash(d.data))
      .catch(() => setDash(null))
      .finally(() => setLoading(false));
  }, [token]);

  const gp=(oid,opid)=>entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const getEffQty=(o,op)=>op.limType==='auto'?(o.ops[op.id]?.on?gp(o.id,'checkingInput'):0):gp(o.id,op.id);
  const todayProd=dash?.today_production ?? entries.filter(e=>e.date===today).reduce((s,e)=>s+e.qty,0);
  const pending=dash?.pending_orders ?? orders.filter(o=>!['Completed','Cancelled'].includes(o.status)).length;
  const delayed=dash?.delayed_orders ?? orders.filter(o=>o.deliveryDate<today&&!['Completed','Cancelled'].includes(o.status)).length;
  const weekBill=orders.reduce((sum,o)=>sum+OPS.filter(op=>op.billing&&o.ops[op.id]?.on).reduce((s,op)=>{
    const cfg=o.ops[op.id]; const qty=getEffQty(o,op);
    return s+qty*(cfg.rate||0)*(cfg.mult||1);
  },0),0);

  const orderProg=orders.map(o=>{
    const en=OPS.filter(op=>o.ops[op.id]?.on&&op.billing);
    const tot=en.length*o.orderQty, done=en.reduce((s,op)=>s+getEffQty(o,op),0);
    return{...o,pct:tot>0?Math.min(100,Math.round(done/tot*100)):0};
  });
  const opT=OPS.map(op=>({name:op.name,qty:entries.filter(e=>e.date===today&&e.opid===op.id).reduce((s,e)=>s+e.qty,0)})).filter(o=>o.qty>0);
  const maxT=Math.max(...opT.map(o=>o.qty),1);

  return (
    <div>
      <div className="sh"><div><h2>Dashboard</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div></div>
      <div className="kpi-grid">
        <div className="kpi" style={{borderLeft:'3px solid var(--accent)'}}><div className="kl">Today's Production</div><div className="kv">{fq(todayProd)}</div><div className="ks">pieces</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--green)'}}><div className="kl">Week Bill (Est.)</div><div className="kv" style={{fontSize:20}}>₹{fmt(weekBill,0)}</div><div className="ks">auto Saturday</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--orange)'}}><div className="kl">Active Orders</div><div className="kv">{fq(pending)}</div><div className="ks">{orders.length} total</div></div>
        <div className="kpi" style={{borderLeft:'3px solid var(--red)'}}><div className="kl">Delayed Orders</div><div className="kv">{fq(delayed)}</div><div className="ks">past delivery</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card cp"><div className="ct">Order Progress</div>
          <div className="bar-chart">{orderProg.map(o=>(
            <div key={o.id} className="bar-row">
              <div className="bar-lbl">{o.orderNumber||o.order_number}</div>
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
    </div>
  );
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
function Orders({ orders, setOrders, toast, onGoOps, entries, token }) {
  const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null);
  const [search,setSearch]=useState(""); const [loading,setLoading]=useState(false);
  const [fONo,setFONo]=useState(""); const [fBuyer,setFBuyer]=useState(""); const [fStyle,setFStyle]=useState("");
  const [fItem,setFItem]=useState(""); const [fColor,setFColor]=useState(""); const [fSize,setFSize]=useState("");
  const [fOQty,setFOQty]=useState(""); const [fDel,setFDel]=useState(""); const [fRem,setFRem]=useState("");
  const [fStat,setFStat]=useState("In Progress"); const [errs,setErrs]=useState({});

  // Load orders from backend
  useEffect(() => {
    api("GET", "/orders", null, token)
      .then(d => setOrders(ensureCheckingInput(d.data.map(o => ({
        ...o,
        id: o.id, orderNumber: o.order_number, buyerName: o.buyer_name,
        styleNumber: o.style_number, itemName: o.item_name, orderQty: o.order_qty,
        cuttingQty: o.cutting_qty, deliveryDate: o.delivery_date,
        ops: buildDefaultOps()
      })))))
      .catch(() => {});
  }, [token]);

  const openNew=()=>{setFONo("");setFBuyer("");setFStyle("");setFItem("");setFColor("");setFSize("");setFOQty("");setFDel("");setFRem("");setFStat("In Progress");setEditing(null);setErrs({});setModal(true);};
  const openEdit=o=>{setFONo(o.orderNumber||o.order_number||"");setFBuyer(o.buyerName||o.buyer_name||"");setFStyle(o.styleNumber||o.style_number||"");setFItem(o.itemName||o.item_name||"");setFColor(o.color||"");setFSize(o.size||"");setFOQty(String(o.orderQty||o.order_qty||""));setFDel(o.deliveryDate||o.delivery_date||"");setFRem(o.remarks||"");setFStat(o.status||"In Progress");setEditing(o.id);setErrs({});setModal(true);};
  const validate=()=>{const e={};if(!fONo.trim())e.oNo='Required';if(!fBuyer.trim())e.buyer='Required';if(!fItem.trim())e.item='Required';if(!fOQty||isNaN(+fOQty)||+fOQty<=0)e.oQty='Must be > 0';if(!fDel)e.del='Required';return e;};

  const save = async () => {
    const e=validate(); if(Object.keys(e).length){setErrs(e);return;}
    setLoading(true);
    try {
      const body = { order_number:fONo, buyer_name:fBuyer, style_number:fStyle, item_name:fItem, color:fColor, size:fSize, order_qty:+fOQty, cutting_qty:+fOQty, delivery_date:fDel, remarks:fRem, status:fStat };
      if(editing) {
        const d = await api("PUT", `/orders/${editing}`, body, token);
        setOrders(prev=>prev.map(o=>o.id!==editing?o:{...o,...d.data,orderNumber:d.data.order_number,buyerName:d.data.buyer_name,itemName:d.data.item_name,orderQty:d.data.order_qty,deliveryDate:d.data.delivery_date,ops:o.ops}));
        toast("Order updated");
      } else {
        const d = await api("POST", "/orders", body, token);
        setOrders(prev=>[...prev,{...d.data,id:d.data.id,orderNumber:d.data.order_number,buyerName:d.data.buyer_name,itemName:d.data.item_name,orderQty:d.data.order_qty,deliveryDate:d.data.delivery_date,ops:buildDefaultOps()}]);
        toast("Order created");
      }
      setModal(false);
    } catch(err) { toast(err.message,"err"); }
    finally { setLoading(false); }
  };

  const del = async id => {
    if(!confirm("Delete order?")) return;
    try { await api("DELETE",`/orders/${id}`,null,token); setOrders(prev=>prev.filter(o=>o.id!==id)); toast("Deleted","err"); }
    catch(err) { toast(err.message,"err"); }
  };

  const fil=orders.filter(o=>!search||[o.orderNumber||o.order_number,o.buyerName||o.buyer_name,o.itemName||o.item_name].some(v=>v?.toLowerCase().includes(search.toLowerCase())));
  const gCut=oid=>entries.filter(e=>e.oid===oid&&e.opid==='cutting').reduce((s,e)=>s+e.qty,0);

  return (
    <div>
      <div className="sh">
        <div><h2>Order Management</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{orders.length} orders</div></div>
        <div style={{display:'flex',gap:10}}><SI value={search} onChange={setSearch} placeholder="🔍 Search..." style={{width:200}}/><button className="btn bp" onClick={openNew}>＋ New Order</button></div>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table>
          <thead><tr><th>Order No</th><th>Buyer</th><th>Item</th><th>Order Qty</th><th>Delivery</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {fil.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--ink3)'}}>No orders</td></tr>}
            {fil.map(o=>{
              const oNo=o.orderNumber||o.order_number;
              const buyer=o.buyerName||o.buyer_name;
              const item=o.itemName||o.item_name;
              const oQty=o.orderQty||o.order_qty;
              const del=o.deliveryDate||o.delivery_date;
              return(<tr key={o.id}>
                <td><span className="mn" style={{fontWeight:600}}>{oNo}</span></td>
                <td>{buyer}</td><td>{item} • {o.color} • {o.size}</td>
                <td className="mn">{fq(oQty)}</td>
                <td><span className={`badge ${del<toStr()&&o.status!=='Completed'?'br':'bgr'}`}>{del}</span></td>
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
                <div className="fg"><label>Order Number *</label><SI value={fONo} onChange={setFONo} placeholder="ORD-001" cls={errs.oNo?'fe':''}/>{errs.oNo&&<div className="ferr">⚠ {errs.oNo}</div>}</div>
                <div className="fg"><label>Buyer Name *</label><SI value={fBuyer} onChange={setFBuyer} cls={errs.buyer?'fe':''}/>{errs.buyer&&<div className="ferr">⚠ {errs.buyer}</div>}</div>
                <div className="fg"><label>Style Number</label><SI value={fStyle} onChange={setFStyle} placeholder="ST-4421"/></div>
                <div className="fg"><label>Item Name *</label><SI value={fItem} onChange={setFItem} cls={errs.item?'fe':''}/>{errs.item&&<div className="ferr">⚠ {errs.item}</div>}</div>
                <div className="fg"><label>Color</label><SI value={fColor} onChange={setFColor} placeholder="Navy"/></div>
                <div className="fg"><label>Size</label><SI value={fSize} onChange={setFSize} placeholder="M"/></div>
                <div className="fg"><label>Order Quantity *</label><SI type="number" value={fOQty} onChange={setFOQty} placeholder="2000" cls={errs.oQty?'fe':''}/>{errs.oQty&&<div className="ferr">⚠ {errs.oQty}</div>}</div>
                <div className="fg"><label>Delivery Date *</label><SI type="date" value={fDel} onChange={setFDel} cls={errs.del?'fe':''}/>{errs.del&&<div className="ferr">⚠ {errs.del}</div>}</div>
                <div className="fg"><label>Status</label><select value={fStat} onChange={e=>setFStat(e.target.value)}>{['In Progress','Urgent','Completed','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="fg full"><label>Remarks</label><SI value={fRem} onChange={setFRem} placeholder="Optional"/></div>
              </div>
            </div>
            <div className="mft"><button className="btn bo2" onClick={()=>setModal(false)}>Cancel</button><button className="btn bp" onClick={save} disabled={loading}>{loading?"Saving...":editing?"Update":"Create"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OPERATIONS ──────────────────────────────────────────────────────────────
function Operations({ orders, setOrders, entries, toast, userRole }) {
  const [oid,setOid]=useState(orders[0]?.id||"");
  const order=orders.find(o=>o.id===oid);
  const isAdmin=userRole==='admin';
  const gp=opid=>entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const cuttingQty=gp('cutting'), checkingQty=gp('checkingInput');
  const upd=(opid,field,value)=>{if(!isAdmin)return;setOrders(prev=>prev.map(o=>o.id!==oid?o:{...o,ops:{...o.ops,[opid]:{...(o.ops[opid]||{}),[field]:value}}}));};
  if(!order) return <div style={{textAlign:'center',padding:40,color:'var(--ink3)'}}>No orders</div>;
  const getEffQty=op=>op.limType==='auto'?checkingQty:gp(op.id);

  return (
    <div>
      <div className="sh">
        <div><h2>Operations Setup</h2><div style={{fontSize:13,color:'var(--ink3)'}}>{isAdmin?"Admin — edit access":"View only"}</div></div>
        <span style={{padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:600,background:isAdmin?'#dcfce7':'#f3e8ff',color:isAdmin?'#16a34a':'#7c3aed'}}>{isAdmin?"🛡 Admin":"👁 View Only"}</span>
      </div>
      {!isAdmin&&<div className="al aly">⚠ Only Admin can enable/disable operations and change rates.</div>}
      <div className="card cp" style={{marginBottom:14}}>
        <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <div className="fg" style={{margin:0,flex:'0 0 260px'}}><label>Select Order</label>
            <select value={oid} onChange={e=>setOid(e.target.value)}>{orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber||o.order_number} — {o.buyerName||o.buyer_name}</option>)}</select>
          </div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>ORDER QTY</div><span className="badge bb">{fq(order.orderQty||order.order_qty)}</span></div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>CUTTING QTY</div><span className="badge by">{fq(cuttingQty)}</span></div>
          <div><div style={{fontSize:10,color:'var(--ink3)',marginBottom:3}}>CHECKING INPUT</div><span className="badge bg">{fq(checkingQty)}</span></div>
        </div>
      </div>
      {checkingQty>0&&<div className="al alb" style={{marginBottom:14}}>⚡ Checking Input = <strong>{fq(checkingQty)} pcs</strong>. Power Table → Panel Ironing auto-billed using this quantity.</div>}
      <div className="card cp">
        <div style={{display:'grid',gridTemplateColumns:'150px 80px 80px 100px 80px',gap:8,marginBottom:8,padding:'0 0 8px',borderBottom:'1px solid var(--border)'}}>
          {['Operation','Rate (₹)','Multiplier','Billed','Type'].map((h,i)=>(
            <div key={i} style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px',color:'var(--ink3)'}}>{h}</div>
          ))}
        </div>
        {OPS.map(op=>{
          const cfg=order.ops?.[op.id]||{on:false,rate:0,mult:1};
          const effQty=getEffQty(op);
          const billed=effQty*(cfg.rate||0)*(cfg.mult||1);
          const isLocked=op.id==='checkingInput';
          const isAuto=op.limType==='auto';
          const limLabel=op.limType==='none'?'✏️ manual':op.limType==='cutting'?'✂ cutting':op.limType==='auto'?'⚡ auto':op.limType==='checking'?'✅ chk input':'🔒 order';
          return (
            <div key={op.id} className="or" style={isAuto&&cfg.on&&checkingQty>0?{background:'#f8faff'}:{}}>
              <input type="checkbox" checked={!!cfg.on} disabled={!isAdmin||isLocked} onChange={e=>upd(op.id,'on',e.target.checked)} style={{width:16,height:16,cursor:isAdmin&&!isLocked?'pointer':'not-allowed',accentColor:'var(--accent)',flexShrink:0}}/>
              <div className={`on2 ${!cfg.on?'dis':''}`} style={{width:150}}>
                {op.name}
                {isAuto&&<span className="badge bb" style={{fontSize:9,marginLeft:4}}>auto</span>}
                {isLocked&&<span className="badge bg" style={{fontSize:9,marginLeft:4}}>default</span>}
                {!op.billing&&<span className="badge bgr" style={{fontSize:9,marginLeft:4}}>no bill</span>}
              </div>
              {op.billing?<SI type="number" disabled={!isAdmin||!cfg.on} placeholder="0.00" value={String(cfg.rate||'')} onChange={v=>upd(op.id,'rate',parseFloat(v)||0)} style={{width:80,opacity:cfg.on&&isAdmin?1:.5}}/>:<div style={{width:80}}/>}
              {op.extra?<SI type="number" disabled={!isAdmin||!cfg.on} placeholder={op.extra} value={String(cfg.mult||1)} onChange={v=>upd(op.id,'mult',parseInt(v)||1)} style={{width:80,opacity:cfg.on&&isAdmin?1:.5}}/>:<div style={{width:80,fontSize:11,color:'var(--ink4)',paddingTop:8}}>—</div>}
              <div style={{width:100,fontSize:11}}>{cfg.on&&effQty>0&&op.billing&&<span className="badge bg">₹{fmt(billed,2)}</span>}</div>
              <div style={{fontSize:10,color:'var(--ink4)',width:80}}>{limLabel}</div>
            </div>
          );
        })}
        {isAdmin&&<div style={{marginTop:14}}><button className="btn bp" onClick={()=>toast("Operations saved — Note: rates saved locally. Backend integration for rates coming soon.")}>💾 Save</button></div>}
      </div>
    </div>
  );
}

// ─── DAILY ENTRY ──────────────────────────────────────────────────────────────
function Production({ orders, entries, setEntries, toast, token }) {
  const [oid,setOid]=useState(orders[0]?.id||"");
  const [opid,setOpid]=useState("cutting");
  const [date,setDate]=useState(toStr());
  const [qty,setQty]=useState("");
  const [rem,setRem]=useState("");
  const [rQty,setRQty]=useState("");
  const [rRate,setRRate]=useState("");
  const [err,setErr]=useState("");
  const [tab,setTab]=useState("entry");
  const [loading,setLoading]=useState(false);

  // Load entries from backend
  useEffect(() => {
    api("GET", "/production", null, token)
      .then(d => setEntries(d.data.map(e => ({
        id: e.id, oid: e.order_id||e.orderId, opid: e.operation_id||e.opid||e.operation_code,
        date: e.entry_date||e.date, qty: e.produced_qty||e.qty,
        rem: e.remarks||"", reworkQty: e.rework_qty||0, reworkRate: e.rework_rate||0
      }))))
      .catch(() => {});
  }, [token]);

  const order=orders.find(o=>o.id===oid);
  const enOps=order?OPS.filter(op=>order.ops?.[op.id]?.on):[];
  const selOp=OPS.find(op=>op.id===opid);
  const gp=(o,op)=>entries.filter(e=>e.oid===o&&e.opid===op).reduce((s,e)=>s+e.qty,0);
  const cuttingQty=gp(oid,'cutting');
  const checkingQty=gp(oid,'checkingInput');

  const getLimit=()=>{
    if(!selOp||!order) return null;
    if(selOp.limType==='none') return null;
    if(selOp.limType==='cutting') return cuttingQty;
    if(selOp.limType==='auto') return null;
    if(selOp.limType==='checking') return checkingQty;
    if(selOp.limType==='order') return order.orderQty||order.order_qty;
    return null;
  };

  const limit=getLimit();
  const produced=gp(oid,opid);
  const balance=limit!=null?limit-produced:null;
  const isAutoOp=selOp?.limType==='auto';

  const submit = async () => {
    setErr("");
    const q=parseInt(qty);
    if(!q||q<=0){setErr("Enter valid quantity");return;}
    if(isAutoOp){setErr("This operation is auto-calculated from Checking Input.");return;}
    if(selOp?.limType==='checking'&&checkingQty===0){setErr("Enter Checking Input qty first.");return;}
    if(selOp?.limType==='cutting'&&cuttingQty===0&&opid!=='cutting'){setErr("Enter Cutting qty first.");return;}
    if(balance!=null&&q>balance){setErr(`Exceeds limit! Balance: ${fq(Math.max(0,balance))} pcs`);return;}

    setLoading(true);
    try {
      // Try to save to backend
      const body = { order_operation_id: `${oid}_${opid}`, entry_date: date, produced_qty: q, contractor_name: "—", remarks: rem };
      const newEntry = { id: uid(), oid, opid, date, qty: q, rem, reworkQty: parseInt(rQty)||0, reworkRate: parseFloat(rRate)||0 };
      try {
        await api("POST", "/production", body, token);
      } catch(e) {
        // Save locally if backend fails
      }
      setEntries(prev=>[...prev, newEntry]);
      setQty("");setRem("");setRQty("");setRRate("");setErr("");
      toast(`✓ ${fq(q)} pcs — ${selOp?.name}`);
    } finally { setLoading(false); }
  };

  const delE = async id => {
    if(!confirm("Delete?")) return;
    try { await api("DELETE",`/production/${id}`,null,token); } catch(e) {}
    setEntries(prev=>prev.filter(e=>e.id!==id));
    toast("Deleted","err");
  };

  const allE=[...entries].sort((a,b)=>b.date.localeCompare(a.date));
  const todayE=entries.filter(e=>e.date===toStr());
  const autoOpBills=order?OPS.filter(op=>op.limType==='auto'&&order.ops?.[op.id]?.on).map(op=>{
    const cfg=order.ops[op.id];
    const total=checkingQty*(cfg.rate||0)*(cfg.mult||1);
    return{...op,cfg,qty:checkingQty,total};
  }).filter(op=>op.qty>0):[];

  return (
    <div>
      <div className="sh"><h2>Daily Production Entry</h2></div>
      {checkingQty>0&&order&&(
        <div className="card cp" style={{marginBottom:14,borderLeft:'4px solid var(--accent)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontSize:20}}>⚡</span>
            <div><div style={{fontWeight:600,fontSize:14}}>Checking Input = {fq(checkingQty)} pcs</div>
            <div style={{fontSize:12,color:'var(--ink3)'}}>Power Table → Panel Ironing auto-billed for {fq(checkingQty)} pcs each</div></div>
          </div>
          {autoOpBills.length>0&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
              {autoOpBills.map(op=>(
                <div key={op.id} style={{padding:'8px 12px',background:'var(--accent-light)',borderRadius:8,fontSize:12}}>
                  <div style={{fontWeight:600,color:'var(--accent)'}}>{op.name}</div>
                  <div style={{color:'var(--ink3)',marginTop:2}}>{fq(op.qty)} × ₹{op.cfg.rate}{op.extra&&op.cfg.mult>1?` × ${op.cfg.mult}`:''}</div>
                  <div style={{fontWeight:600,color:'var(--green)',marginTop:2}}>₹{fmt(op.total,2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
                {orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber||o.order_number} — {o.buyerName||o.buyer_name}</option>)}
              </select>
            </div>
            <div className="fg"><label>Operation *</label>
              <select value={opid} onChange={e=>{setOpid(e.target.value);setErr("");}}>
                {enOps.map(op=><option key={op.id} value={op.id}>{op.name}{op.limType==='auto'?' (auto)':!op.billing?' (tracking)':''}</option>)}
              </select>
            </div>
            <div className="fg"><label>Date *</label><SI type="date" value={date} onChange={setDate}/></div>
            {isAutoOp?(
              <div className="fg full">
                <div style={{padding:'14px 16px',background:'var(--accent-light)',borderRadius:8}}>
                  <div style={{fontWeight:600,color:'var(--accent)',fontSize:13,marginBottom:4}}>⚡ Auto-calculated</div>
                  <div style={{fontSize:12,color:'var(--ink3)'}}>{selOp?.name} is auto-billed for <strong style={{color:'var(--ink)'}}>{fq(checkingQty)} pcs</strong> from Checking Input.</div>
                  {checkingQty>0&&order?.ops?.[opid]?.on&&(
                    <div style={{marginTop:8,padding:'8px 12px',background:'var(--white)',borderRadius:6,fontSize:13}}>
                      <strong>Bill = {fq(checkingQty)} × ₹{order.ops[opid]?.rate||0}{order.ops[opid]?.mult>1?` × ${order.ops[opid]?.mult}`:''} = </strong>
                      <span style={{color:'var(--green)',fontWeight:700}}>₹{fmt(checkingQty*(order.ops[opid]?.rate||0)*(order.ops[opid]?.mult||1),2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ):(
              <>
                <div className="fg">
                  <label>Quantity * {balance!=null?`(max: ${fq(Math.max(0,balance))})`:''}</label>
                  <SI type="number" value={qty} onChange={setQty} placeholder={balance!=null&&balance>0?String(balance):"Enter qty"} onKeyDown={e=>e.key==='Enter'&&submit()}/>
                </div>
                <div className="fg"><label>Remarks</label><SI value={rem} onChange={setRem} placeholder="Optional"/></div>
                {opid==='checking'&&<>
                  <div className="fg"><label>Rework Qty</label><SI type="number" value={rQty} onChange={setRQty} placeholder="0"/></div>
                  <div className="fg"><label>Rework Rate (₹)</label><SI type="number" value={rRate} onChange={setRRate} placeholder="0.00"/></div>
                  {rQty&&rRate&&<div className="fg"><label>Rework Amount</label>
                    <div style={{padding:'9px 12px',background:'var(--green-light)',borderRadius:8,color:'var(--green)',fontWeight:500}}>₹{fmt((parseInt(rQty)||0)*(parseFloat(rRate)||0),2)}</div>
                  </div>}
                </>}
              </>
            )}
          </div>
          {!isAutoOp&&order&&opid&&(
            <div className="ig">
              <div><div className="il">Limit</div><div className="iv">{limit!=null?fq(limit):'∞'}</div></div>
              <div><div className="il">Produced</div><div className="iv">{fq(produced)}</div></div>
              <div><div className="il">Balance</div><div className="iv" style={{color:balance==null?'var(--green)':balance<100?'var(--red)':balance<500?'var(--orange)':'var(--green)'}}>{balance!=null?fq(Math.max(0,balance)):'∞'}</div></div>
              <div><div className="il">Progress</div>
                {limit!=null&&limit>0?<><div className="prog" style={{marginTop:8}}><div className="pf" style={{width:Math.min(100,produced/limit*100)+'%',background:'var(--accent)'}}/></div>
                <div style={{fontSize:10,color:'var(--ink3)',marginTop:3}}>{Math.min(100,Math.round(produced/limit*100))}%</div></>
                :<div style={{fontSize:13,color:'var(--green)',marginTop:6}}>Manual ✓</div>}
              </div>
            </div>
          )}
          {selOp?.limType==='checking'&&checkingQty===0&&<div className="al aly">⚠ Enter Checking Input qty first.</div>}
          {err&&<div className="al alr">⚠ {err}</div>}
          {!isAutoOp&&balance!=null&&balance<=0&&<div className="al aly">⚠ Limit reached for {selOp?.name}.</div>}
          {!isAutoOp&&<button className="btn bp" onClick={submit} disabled={balance!=null&&balance<=0||loading}>{loading?"Saving...":"✓ Save Entry"}</button>}
        </div>
      )}
      {(tab==='today'||tab==='all')&&(
        <div className="card" style={{overflow:'hidden'}}>
          <table>
            <thead><tr><th>Date</th><th>Order</th><th>Operation</th><th>Qty</th><th>Remarks</th><th></th></tr></thead>
            <tbody>
              {(tab==='today'?todayE:allE).length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:30,color:'var(--ink3)'}}>No entries</td></tr>}
              {(tab==='today'?todayE:allE).map(e=>{
                const o=orders.find(x=>x.id===e.oid);
                const op=OPS.find(x=>x.id===e.opid);
                return(<tr key={e.id}>
                  <td className="mn">{e.date}</td>
                  <td><strong>{o?.orderNumber||o?.order_number}</strong></td>
                  <td><span className={`badge ${op?.billing?'bb':'bgr'}`}>{op?.name}</span></td>
                  <td><strong>{fq(e.qty)}</strong></td>
                  <td style={{fontSize:12,color:'var(--ink3)'}}>{e.rem||'—'}</td>
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
function Billing({ orders, entries, toast, token }) {
  const [bills,setBills]=useState([]); const [generated,setGenerated]=useState(false); const [weekOff,setWeekOff]=useState(0);
  const [loading,setLoading]=useState(false);
  const getWeek=off=>{const now=new Date();now.setDate(now.getDate()+off*7);const day=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-(day===0?6:day-1));const sat=new Date(mon);sat.setDate(mon.getDate()+5);return{s:mon.toISOString().split('T')[0],e:sat.toISOString().split('T')[0]};};
  const {s:ws,e:we}=getWeek(weekOff);

  const generate = async () => {
    setLoading(true);
    try {
      // Try backend bill generation first
      try {
        const d = await api("POST", "/billing/generate", { target_date: we }, token);
        toast("Bills generated from server!");
      } catch(e) {}
    } finally { setLoading(false); }

    // Also generate locally for display
    const lines=[];
    orders.forEach(o=>{
      OPS.filter(op=>op.billing&&o.ops?.[op.id]?.on).forEach(op=>{
        const cfg=o.ops[op.id];
        let qty=0;
        if(op.limType==='auto'){
          qty=entries.filter(e=>e.oid===o.id&&e.opid==='checkingInput'&&e.date>=ws&&e.date<=we).reduce((s,e)=>s+e.qty,0);
          if(qty===0) qty=entries.filter(e=>e.oid===o.id&&e.opid==='checkingInput').reduce((s,e)=>s+e.qty,0);
        } else {
          qty=entries.filter(e=>e.oid===o.id&&e.opid===op.id&&e.date>=ws&&e.date<=we).reduce((s,e)=>s+e.qty,0);
        }
        if(!qty) return;
        const total=qty*(cfg.rate||0)*(cfg.mult||1);
        lines.push({oNo:o.orderNumber||o.order_number,buyer:o.buyerName||o.buyer_name,opName:op.name,qty,rate:cfg.rate||0,mult:cfg.mult||1,total,hasExtra:!!op.extra,isAuto:op.limType==='auto'});
      });
    });
    const groups={};
    lines.forEach(l=>{if(!groups[l.oNo])groups[l.oNo]={items:[],total:0,buyer:l.buyer};groups[l.oNo].items.push(l);groups[l.oNo].total+=l.total;});
    const nb=Object.entries(groups).map(([oNo,d])=>({id:uid(),billNumber:`BILL-${we.slice(0,7)}-${oNo.replace(/[^a-z0-9]/gi,'').toUpperCase()}`,ws,we,oNo,buyer:d.buyer,items:d.items,total:d.total}));
    setBills(nb);setGenerated(true);toast(`${nb.length} bill(s) generated`);
  };

  const gt=bills.reduce((s,b)=>s+b.total,0);
  return (
    <div>
      <div className="sh">
        <div><h2>Weekly Bills</h2></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn bo2 bsm" onClick={()=>setWeekOff(w=>w-1)}>← Prev</button>
          <span className="badge bb">{ws} → {we}</span>
          <button className="btn bo2 bsm" onClick={()=>setWeekOff(w=>w+1)}>Next →</button>
          <button className="btn bp" onClick={generate} disabled={loading}>{loading?"Generating...":"⚡ Generate"}</button>
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
            <div style={{fontSize:12,opacity:.6,marginTop:8}}>{bill.oNo} • {bill.buyer} • {bill.ws} to {bill.we}</div>
          </div>
          {bill.items.map((item,i)=>(
            <div key={i} className="brow" style={item.isAuto?{background:'#f8faff'}:{}}>
              <div><div style={{fontWeight:500}}>{item.opName}{item.isAuto&&<span className="badge bb" style={{fontSize:10,marginLeft:6}}>auto</span>}</div></div>
              <div style={{fontSize:11,color:'var(--ink3)',textAlign:'right'}}>{fq(item.qty)} × ₹{item.rate}{item.hasExtra&&item.mult>1?` × ${item.mult}`:''}</div>
              <div style={{fontWeight:600,fontFamily:'DM Mono,monospace',minWidth:80,textAlign:'right'}}>₹{fmt(item.total,2)}</div>
            </div>
          ))}
          <div className="bft"><span>{bill.oNo} — {bill.buyer}</span><span style={{fontSize:18,fontWeight:700,fontFamily:'DM Mono,monospace'}}>₹{fmt(bill.total,2)}</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ orders, entries, token }) {
  const [tab,setTab]=useState("pending");
  const gp=(oid,opid)=>entries.filter(e=>e.oid===oid&&e.opid===opid).reduce((s,e)=>s+e.qty,0);
  const pendingRows=[];
  orders.forEach(o=>{
    const cq=gp(o.id,'cutting'), ckq=gp(o.id,'checkingInput');
    OPS.filter(op=>o.ops?.[op.id]?.on&&op.billing).forEach(op=>{
      const lim=op.limType==='order'?(o.orderQty||o.order_qty):op.limType==='cutting'?cq:op.limType==='checking'?ckq:op.limType==='auto'?ckq:null;
      if(lim==null)return;
      const prod=op.limType==='auto'?ckq:gp(o.id,op.id);
      const bal=lim-prod;
      if(bal>0) pendingRows.push({oNo:o.orderNumber||o.order_number,buyer:o.buyerName||o.buyer_name,opName:op.name,lim,prod,bal,pct:lim>0?Math.round(prod/lim*100):0});
    });
  });
  const orderStatus=orders.map(o=>{
    const cq=gp(o.id,'cutting');
    const en=OPS.filter(op=>o.ops?.[op.id]?.on&&op.billing);
    const tot=en.length*(o.orderQty||o.order_qty||0);
    const done=en.reduce((s,op)=>op.limType==='auto'?s+gp(o.id,'checkingInput'):s+gp(o.id,op.id),0);
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
          <div style={{marginBottom:10}}><span className="badge bo">{pendingRows.length} ops pending</span></div>
          <div className="card" style={{overflow:'hidden'}}>
            <table>
              <thead><tr><th>Order</th><th>Operation</th><th>Limit</th><th>Done</th><th>Balance</th><th>%</th></tr></thead>
              <tbody>
                {pendingRows.map((r,i)=>(
                  <tr key={i}>
                    <td className="mn" style={{fontWeight:600}}>{r.oNo}</td>
                    <td><span className="badge bb">{r.opName}</span></td>
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
                <td className="mn" style={{fontWeight:600}}>{o.orderNumber||o.order_number}</td>
                <td>{o.buyerName||o.buyer_name}</td>
                <td className="mn">{fq(o.orderQty||o.order_qty)}</td>
                <td className="mn">{fq(o.cuttingQty)}</td>
                <td><span className={`badge ${(o.deliveryDate||o.delivery_date)<toStr()&&o.status!=='Completed'?'br':'bgr'}`}>{o.deliveryDate||o.delivery_date}</span></td>
                <td><span className={`badge ${sbd(o.status)}`}>{o.status}</span></td>
                <td style={{width:140}}><div className="prog"><div className="pf" style={{width:o.pct+'%',background:o.pct>80?'#16a34a':'var(--accent)'}}/></div><div style={{fontSize:10,color:'var(--ink3)',marginTop:2}}>{o.pct}%</div></td>
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
                {k==='admin'?'Full access + operations edit':k==='manager'?'Orders + production + reports':k==='entry'?'Daily entry (all ops)':'Billing + reports'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const NAV=[
  {id:'dashboard', label:'Dashboard',   icon:'📊'},
  {id:'orders',    label:'Orders',      icon:'📋'},
  {id:'operations',label:'Operations',  icon:'⚙️'},
  {id:'production',label:'Daily Entry', icon:'✏️'},
  {id:'billing',   label:'Weekly Bills',icon:'🧾'},
  {id:'reports',   label:'Reports',     icon:'📈'},
  {id:'users',     label:'Users',       icon:'👥'},
];

export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState('dashboard');
  const [orders,setOrders]=useState([]);
  const [entries,setEntries]=useState([]);
  const [connected,setConnected]=useState(null);
  const {toasts,show:toast}=useToast();
  const goOps=()=>setPage('operations');

  // Check backend connection on load
  useEffect(()=>{
    fetch(`${API.replace('/api','')}/health`)
      .then(r=>r.json())
      .then(d=>setConnected(d.success===true))
      .catch(()=>setConnected(false));
  },[]);

  if(!user) return <><style>{G}</style><Login onLogin={u=>{setUser(u);}} /><Toast toasts={toasts}/></>;

  const token = user.token;

  return (
    <>
      <style>{G}</style>
      <div className="shell">
        <aside className="sb">
          <div className="sb-brand"><div className="sb-logo"><div className="sb-icon">✂</div><span>GarmentERP</span></div><div className="sb-sub">Production &amp; Billing</div></div>
          <div className="nav-lbl">Main Menu</div>
          {NAV.map(n=><div key={n.id} className={`nav-it ${page===n.id?'on':''}`} onClick={()=>setPage(n.id)}><span>{n.icon}</span><span>{n.label}</span></div>)}
          <div className="sb-foot"><div className="av">{user.name?.[0]||'U'}</div><div className="av-inf"><div style={{fontSize:12,fontWeight:500,color:'#fff'}}>{user.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{ROLES[user.role]||user.role}</div></div></div>
        </aside>
        <div className="main">
          <div className="topbar">
            <div className="tb-title">{NAV.find(n=>n.id===page)?.label}</div>
            <span className={`conn-status ${connected===true?'conn-ok':connected===false?'conn-err':'bgr'}`}>
              {connected===true?'🟢 DB Connected':connected===false?'🔴 DB Offline':'⏳ Checking...'}
            </span>
            <button className="btn bgh bsm" onClick={()=>setUser(null)}>Sign out</button>
          </div>
          <div className="content">
            {page==='dashboard'  &&<Dashboard orders={orders} entries={entries} token={token}/>}
            {page==='orders'     &&<Orders orders={orders} setOrders={setOrders} toast={toast} onGoOps={goOps} entries={entries} token={token}/>}
            {page==='operations' &&<Operations orders={orders} setOrders={setOrders} entries={entries} toast={toast} userRole={user.role}/>}
            {page==='production' &&<Production orders={orders} entries={entries} setEntries={setEntries} toast={toast} token={token}/>}
            {page==='billing'    &&<Billing orders={orders} entries={entries} toast={toast} token={token}/>}
            {page==='reports'    &&<Reports orders={orders} entries={entries} token={token}/>}
            {page==='users'      &&<Users/>}
          </div>
        </div>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}