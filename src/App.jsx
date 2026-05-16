import { useState, useEffect, useCallback, useRef } from "react";

// ─── DATA LAYER ──────────────────────────────────────────────────────────────

const OPERATIONS_MASTER = [
  { id: "cutting",      name: "Cutting",       limitType: "cutting", extra: null },
  { id: "fusing",       name: "Fusing",        limitType: "cutting", extra: null },
  { id: "powerTable",   name: "Power Table",   limitType: "cutting", extra: null },
  { id: "snls",         name: "SNLS",          limitType: "cutting", extra: null },
  { id: "kaja",         name: "Kaja",          limitType: "cutting", extra: "No of Kaja" },
  { id: "button",       name: "Button",        limitType: "cutting", extra: "No of Button" },
  { id: "bartag",       name: "Bartag",        limitType: "cutting", extra: "No of Bartag" },
  { id: "rope",         name: "Rope",          limitType: "cutting", extra: null },
  { id: "buckles",      name: "Buckles",       limitType: "cutting", extra: null },
  { id: "piccoding",    name: "Piccoding",     limitType: "cutting", extra: null },
  { id: "netFolding",   name: "Net Folding",   limitType: "cutting", extra: null },
  { id: "outerElastic", name: "Outer Elastic", limitType: "cutting", extra: null },
  { id: "trimmer",      name: "Trimmer",       limitType: "cutting", extra: null },
  { id: "checking",     name: "Checking",      limitType: "cutting", extra: null },
  { id: "ironing",      name: "Ironing",       limitType: "order",   extra: null },
  { id: "panelIroning", name: "Panel Ironing", limitType: "cutting", extra: null },
  { id: "packing",      name: "Packing",       limitType: "order",   extra: null },
];

const ROLES = { admin: "Admin", manager: "Production Manager", entry: "Data Entry", billing: "Billing Staff" };

const INITIAL_ORDERS = [
  {
    id: "O001", orderNumber: "ORD-2026-001", buyerName: "H&M Global",
    styleNumber: "ST-4421", itemName: "Men Trousers", color: "Navy", size: "M",
    orderQty: 2000, cuttingQty: 2050, deliveryDate: "2026-05-20",
    remarks: "Urgent delivery", status: "In Progress",
    ops: {
      cutting:      { enabled: true, rate: 1.50, contractor: "Rajan Cutting Works",   multiplier: 1 },
      fusing:       { enabled: true, rate: 0.80, contractor: "Kumar Fusing Co",       multiplier: 1 },
      snls:         { enabled: true, rate: 0.90, contractor: "SNLS Masters",          multiplier: 1 },
      button:       { enabled: true, rate: 0.50, contractor: "Button & Bartag Co",    multiplier: 8 },
      bartag:       { enabled: true, rate: 0.30, contractor: "Button & Bartag Co",    multiplier: 3 },
      checking:     { enabled: true, rate: 0.60, contractor: "Quality Checkers",      multiplier: 1 },
      ironing:      { enabled: true, rate: 1.20, contractor: "Selvam Ironing Press",  multiplier: 1 },
      packing:      { enabled: true, rate: 2.00, contractor: "Packing Experts",       multiplier: 1 },
    }
  },
  {
    id: "O002", orderNumber: "ORD-2026-002", buyerName: "Zara Exports",
    styleNumber: "ST-8832", itemName: "Ladies Tops", color: "White", size: "S",
    orderQty: 1500, cuttingQty: 1530, deliveryDate: "2026-05-15",
    remarks: "", status: "Urgent",
    ops: {
      cutting:  { enabled: true, rate: 1.20, contractor: "Rajan Cutting Works",  multiplier: 1 },
      snls:     { enabled: true, rate: 0.90, contractor: "SNLS Masters",         multiplier: 1 },
      kaja:     { enabled: true, rate: 0.30, contractor: "Kaja Works",           multiplier: 6 },
      trimmer:  { enabled: true, rate: 0.40, contractor: "Trim Solutions",       multiplier: 1 },
      ironing:  { enabled: true, rate: 1.00, contractor: "Selvam Ironing Press", multiplier: 1 },
      packing:  { enabled: true, rate: 1.80, contractor: "Packing Experts",      multiplier: 1 },
    }
  },
  {
    id: "O003", orderNumber: "ORD-2026-003", buyerName: "Marks & Spencer",
    styleNumber: "ST-2210", itemName: "Kids Shorts", color: "Khaki", size: "L",
    orderQty: 3000, cuttingQty: 3050, deliveryDate: "2026-06-10",
    remarks: "New buyer", status: "In Progress",
    ops: {
      cutting:      { enabled: true, rate: 1.10, contractor: "Rajan Cutting Works",  multiplier: 1 },
      fusing:       { enabled: true, rate: 0.70, contractor: "Kumar Fusing Co",      multiplier: 1 },
      outerElastic: { enabled: true, rate: 0.60, contractor: "Elastic Works",        multiplier: 1 },
      checking:     { enabled: true, rate: 0.50, contractor: "Quality Checkers",     multiplier: 1 },
      ironing:      { enabled: true, rate: 1.00, contractor: "Selvam Ironing Press", multiplier: 1 },
      packing:      { enabled: true, rate: 1.90, contractor: "Packing Experts",      multiplier: 1 },
    }
  }
];

const INITIAL_ENTRIES = [
  { id: "P001", orderId: "O001", opId: "cutting",  date: "2026-05-05", qty: 1000, contractor: "Rajan Cutting Works" },
  { id: "P002", orderId: "O001", opId: "cutting",  date: "2026-05-06", qty:  800, contractor: "Rajan Cutting Works" },
  { id: "P003", orderId: "O001", opId: "fusing",   date: "2026-05-07", qty:  700, contractor: "Kumar Fusing Co" },
  { id: "P004", orderId: "O001", opId: "snls",     date: "2026-05-08", qty:  600, contractor: "SNLS Masters" },
  { id: "P005", orderId: "O001", opId: "button",   date: "2026-05-09", qty:  500, contractor: "Button & Bartag Co" },
  { id: "P006", orderId: "O001", opId: "checking", date: "2026-05-10", qty:  450, contractor: "Quality Checkers" },
  { id: "P007", orderId: "O001", opId: "ironing",  date: "2026-05-10", qty:  400, contractor: "Selvam Ironing Press" },
  { id: "P008", orderId: "O002", opId: "cutting",  date: "2026-05-05", qty:  800, contractor: "Rajan Cutting Works" },
  { id: "P009", orderId: "O002", opId: "cutting",  date: "2026-05-06", qty:  600, contractor: "Rajan Cutting Works" },
  { id: "P010", orderId: "O002", opId: "kaja",     date: "2026-05-07", qty:  700, contractor: "Kaja Works" },
  { id: "P011", orderId: "O002", opId: "snls",     date: "2026-05-08", qty:  800, contractor: "SNLS Masters" },
  { id: "P012", orderId: "O002", opId: "ironing",  date: "2026-05-09", qty:  400, contractor: "Selvam Ironing Press" },
  { id: "P013", orderId: "O003", opId: "cutting",  date: "2026-05-10", qty: 1500, contractor: "Rajan Cutting Works" },
  { id: "P014", orderId: "O003", opId: "fusing",   date: "2026-05-11", qty:  800, contractor: "Kumar Fusing Co" },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────

const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0f1117;
    --ink2: #3a3d4a;
    --ink3: #7a7f94;
    --ink4: #b0b5c8;
    --paper: #f7f8fc;
    --white: #ffffff;
    --border: #e4e6f0;
    --border2: #d0d3e3;
    --accent: #2563eb;
    --accent-light: #eff4ff;
    --accent-mid: #bfcfff;
    --green: #16a34a;
    --green-light: #f0fdf4;
    --orange: #ea580c;
    --orange-light: #fff7ed;
    --red: #dc2626;
    --red-light: #fef2f2;
    --yellow: #ca8a04;
    --yellow-light: #fefce8;
    --sidebar-w: 220px;
    --radius: 10px;
    --shadow: 0 1px 3px rgba(0,0,0,.07), 0 4px 16px rgba(0,0,0,.05);
    --shadow-lg: 0 4px 24px rgba(0,0,0,.10);
  }

  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); }

  /* ── LAYOUT ── */
  .erp-shell { display: flex; height: 100vh; overflow: hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w); flex-shrink: 0;
    background: var(--ink); display: flex; flex-direction: column;
    padding: 0; overflow: hidden;
  }
  .sidebar-brand {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .brand-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -.3px;
  }
  .brand-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--accent); display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .brand-sub { font-size: 11px; color: rgba(255,255,255,.4); margin-top: 3px; }

  .nav-section { padding: 10px 0; }
  .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    color: rgba(255,255,255,.3); padding: 8px 20px 4px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 20px;
    font-size: 13px; color: rgba(255,255,255,.6); cursor: pointer;
    border-left: 2px solid transparent; transition: all .15s; user-select: none;
  }
  .nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
  .nav-item.active { background: rgba(37,99,235,.2); color: #fff; border-left-color: var(--accent); font-weight: 500; }
  .nav-icon { font-size: 15px; width: 18px; text-align: center; }

  .sidebar-footer {
    margin-top: auto; padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,.08);
    display: flex; align-items: center; gap: 10px;
  }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%; background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: #fff; flex-shrink: 0;
  }
  .avatar-name { font-size: 12px; font-weight: 500; color: #fff; }
  .avatar-role { font-size: 10px; color: rgba(255,255,255,.4); margin-top: 1px; }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .topbar {
    height: 56px; background: var(--white); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0;
  }
  .topbar-title { font-size: 16px; font-weight: 600; flex: 1; }
  .topbar-pills { display: flex; gap: 8px; align-items: center; }

  .content { flex: 1; overflow-y: auto; padding: 24px; }

  /* ── CARDS ── */
  .card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .card-pad { padding: 20px 24px; }
  .card-title { font-size: 13px; font-weight: 600; color: var(--ink2); margin-bottom: 14px; letter-spacing: .1px; }

  /* ── KPI GRID ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
  .kpi-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px; box-shadow: var(--shadow);
    display: flex; flex-direction: column; gap: 6px;
  }
  .kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; color: var(--ink3); }
  .kpi-value { font-size: 28px; font-weight: 600; color: var(--ink); line-height: 1; font-family: 'DM Mono', monospace; }
  .kpi-sub { font-size: 12px; color: var(--ink3); }
  .kpi-accent { border-left: 3px solid var(--accent); }
  .kpi-green  { border-left: 3px solid var(--green); }
  .kpi-orange { border-left: 3px solid var(--orange); }
  .kpi-red    { border-left: 3px solid var(--red); }

  /* ── BADGES ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500;
  }
  .badge-blue   { background: var(--accent-light); color: var(--accent); }
  .badge-green  { background: var(--green-light);  color: var(--green); }
  .badge-orange { background: var(--orange-light); color: var(--orange); }
  .badge-red    { background: var(--red-light);    color: var(--red); }
  .badge-yellow { background: var(--yellow-light); color: var(--yellow); }
  .badge-gray   { background: var(--paper);        color: var(--ink3); }

  /* ── TABLE ── */
  .tbl-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: var(--paper); padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .6px; color: var(--ink3);
    border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: 11px 14px; border-bottom: 1px solid var(--border); color: var(--ink); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbff; }
  .td-mono { font-family: 'DM Mono', monospace; font-size: 12px; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
    border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
    border: 1px solid transparent; transition: all .15s; font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-outline { background: #fff; color: var(--ink2); border-color: var(--border2); }
  .btn-outline:hover { background: var(--paper); border-color: var(--accent); color: var(--accent); }
  .btn-ghost { background: transparent; color: var(--ink3); border-color: transparent; padding: 6px 10px; }
  .btn-ghost:hover { background: var(--paper); color: var(--ink); }
  .btn-danger { background: var(--red-light); color: var(--red); border-color: #fca5a5; }
  .btn-danger:hover { background: #fee2e2; }
  .btn-sm { padding: 5px 11px; font-size: 12px; border-radius: 6px; }
  .btn-icon { padding: 7px; border-radius: 7px; }

  /* ── FORM ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1/-1; }
  label { font-size: 12px; font-weight: 500; color: var(--ink2); }
  input, select, textarea {
    padding: 9px 12px; border: 1px solid var(--border2); border-radius: 8px;
    font-size: 13px; font-family: 'DM Sans', sans-serif; color: var(--ink);
    background: var(--white); transition: border .15s; outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
  input::placeholder { color: var(--ink4); }
  select { cursor: pointer; }
  textarea { resize: vertical; min-height: 70px; }
  .form-error { font-size: 12px; color: var(--red); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .field-error { border-color: var(--red) !important; }

  /* ── PROGRESS ── */
  .prog-track { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 3px; transition: width .6s ease; }

  /* ── SECTION HEADER ── */
  .sec-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .sec-hdr h2 { font-size: 18px; font-weight: 600; }
  .sec-hdr-sub { font-size: 13px; color: var(--ink3); margin-top: 2px; }

  /* ── TABS ── */
  .tab-bar { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  .tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: var(--ink3);
    cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab:hover:not(.active) { color: var(--ink); }

  /* ── OP ROWS ── */
  .op-row {
    display: flex; align-items: center; gap: 12px; padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .op-row:last-child { border-bottom: none; }
  .op-check { width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent); flex-shrink: 0; }
  .op-name { font-size: 13px; font-weight: 500; width: 130px; flex-shrink: 0; }
  .op-name.disabled { color: var(--ink4); }
  .op-fields { display: flex; gap: 8px; flex: 1; flex-wrap: wrap; align-items: center; }
  .op-fields input { font-size: 12px; padding: 7px 10px; }
  .op-bill-badge { font-family: 'DM Mono', monospace; font-size: 11px; }

  /* ── MODAL OVERLAY ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,17,23,.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
    padding: 20px;
  }
  .modal {
    background: var(--white); border-radius: 14px; box-shadow: var(--shadow-lg);
    width: 100%; max-width: 660px; max-height: 90vh; overflow-y: auto;
    animation: modalIn .2s ease;
  }
  @keyframes modalIn { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
  .modal-header {
    padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-size: 16px; font-weight: 600; }
  .modal-body { padding: 20px 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }

  /* ── ALERT ── */
  .alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 14px; }
  .alert-red    { background: var(--red-light);    color: var(--red);    border: 1px solid #fca5a5; }
  .alert-green  { background: var(--green-light);  color: var(--green);  border: 1px solid #86efac; }
  .alert-yellow { background: var(--yellow-light); color: var(--yellow); border: 1px solid #fde68a; }

  /* ── EMPTY STATE ── */
  .empty { text-align: center; padding: 60px 20px; color: var(--ink3); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-title { font-size: 15px; font-weight: 500; color: var(--ink2); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; }

  /* ── CHART ── */
  .bar-chart { display: flex; flex-direction: column; gap: 10px; }
  .bar-row { display: flex; align-items: center; gap: 12px; }
  .bar-label { font-size: 12px; color: var(--ink2); width: 120px; text-align: right; flex-shrink: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 14px; background: var(--border); border-radius: 7px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 7px; transition: width .7s cubic-bezier(.4,0,.2,1); }
  .bar-val { font-size: 12px; color: var(--ink3); width: 50px; font-family: 'DM Mono',monospace; }

  /* ── BILL PREVIEW ── */
  .bill-header { background: var(--ink); color: #fff; padding: 20px 24px; border-radius: 10px 10px 0 0; }
  .bill-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 12px; }
  .bill-field { font-size: 11px; color: rgba(255,255,255,.5); }
  .bill-val { font-size: 13px; color: #fff; font-weight: 500; }
  .bill-total-row { display: flex; justify-content: space-between; padding: 10px 14px;
    font-size: 13px; border-bottom: 1px solid var(--border); }
  .bill-grand { background: var(--ink); color: #fff; padding: 14px 20px;
    display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 10px 10px; }

  /* ── REPORT CARDS ── */
  .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .report-card {
    background: var(--white); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px; box-shadow: var(--shadow); transition: box-shadow .15s;
  }
  .report-card:hover { box-shadow: var(--shadow-lg); }
  .report-icon { font-size: 28px; margin-bottom: 10px; }
  .report-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .report-desc { font-size: 12px; color: var(--ink3); margin-bottom: 14px; }
  .report-actions { display: flex; gap: 8px; }

  /* ── TOAST ── */
  .toast-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    background: var(--ink); color: #fff; padding: 12px 18px; border-radius: 10px;
    font-size: 13px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg);
    animation: toastIn .25s ease; min-width: 260px;
  }
  .toast.success { background: var(--green); }
  .toast.error   { background: var(--red); }
  @keyframes toastIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }

  /* ── LOGIN ── */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f1117 0%, #1a2035 100%); }
  .login-card { background: var(--white); border-radius: 16px; padding: 40px; width: 380px; box-shadow: var(--shadow-lg); }
  .login-brand { text-align: center; margin-bottom: 28px; }
  .login-logo { width: 52px; height: 52px; background: var(--accent); border-radius: 14px;
    display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 12px; }
  .login-title { font-size: 22px; font-weight: 700; }
  .login-sub { font-size: 13px; color: var(--ink3); margin-top: 4px; }

  /* ── RESPONSIVE ── */
  @media(max-width:768px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .form-grid-3 { grid-template-columns: 1fr; }
    .report-grid { grid-template-columns: 1fr; }
    .sidebar { width: 60px; }
    .nav-item span, .brand-sub, .nav-label, .avatar-name, .avatar-role, .brand-logo span { display: none; }
    .brand-logo { justify-content: center; }
    .sidebar-footer { justify-content: center; }
    .content { padding: 14px; }
  }
`;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2,10); }
function fmt(n, d=2) { return (parseFloat(n)||0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtQty(n) { return (parseInt(n)||0).toLocaleString('en-IN'); }
function today() { return new Date().toISOString().split('T')[0]; }
function statusBadge(s) {
  const m = { "In Progress":"badge-blue","Completed":"badge-green","Urgent":"badge-red","On Hold":"badge-yellow","Cancelled":"badge-gray" };
  return m[s] || "badge-gray";
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type="success") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, show };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@garment.com");
  const [pass, setPass]   = useState("Admin@1234");
  const [err, setErr]     = useState("");

  const USERS = [
    { email: "admin@garment.com",   pass: "Admin@1234",  role: "admin",   name: "Admin User" },
    { email: "manager@garment.com", pass: "Admin@1234",  role: "manager", name: "Prod Manager" },
    { email: "entry@garment.com",   pass: "Admin@1234",  role: "entry",   name: "Entry Staff" },
    { email: "billing@garment.com", pass: "Admin@1234",  role: "billing", name: "Billing Staff" },
  ];

  const handle = () => {
    const u = USERS.find(u => u.email === email && u.pass === pass);
    if (!u) { setErr("Invalid credentials"); return; }
    onLogin(u);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">✂</div>
          <div className="login-title">GarmentERP</div>
          <div className="login-sub">Production & Billing System</div>
        </div>
        {err && <div className="alert alert-red">⚠ {err}</div>}
        <div className="form-group" style={{marginBottom:12}}>
          <label>Email address</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@garment.com" />
        </div>
        <div className="form-group" style={{marginBottom:20}}>
          <label>Password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handle()} />
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={handle}>
          Sign in →
        </button>
        <div style={{marginTop:20,padding:14,background:'var(--paper)',borderRadius:8,fontSize:12,color:'var(--ink3)'}}>
          <strong style={{color:'var(--ink2)'}}>Demo accounts</strong><br/>
          admin@garment.com • manager@garment.com<br/>
          entry@garment.com • billing@garment.com<br/>
          Password: <span style={{fontFamily:'monospace'}}>Admin@1234</span>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard({ orders, entries }) {
  const todayStr = today();
  const todayProd = entries.filter(e => e.date === todayStr).reduce((s,e) => s+e.qty, 0);
  const pending = orders.filter(o => !['Completed','Cancelled'].includes(o.status)).length;
  const delayed = orders.filter(o => o.deliveryDate < todayStr && !['Completed','Cancelled'].includes(o.status)).length;

  const getProduced = (orderId, opId) =>
    entries.filter(e => e.orderId === orderId && e.opId === opId).reduce((s,e) => s+e.qty, 0);

  // Week bill estimate
  const weekBill = orders.reduce((sum, o) => {
    return sum + OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled).reduce((s, op) => {
      const cfg = o.ops[op.id];
      return s + getProduced(o.id, op.id) * (cfg.rate||0) * (cfg.multiplier||1);
    }, 0);
  }, 0);

  // Operation-wise today
  const opToday = OPERATIONS_MASTER.map(op => ({
    name: op.name,
    qty: entries.filter(e => e.date === todayStr && e.opId === op.id).reduce((s,e) => s+e.qty, 0)
  })).filter(o => o.qty > 0);
  const maxOp = Math.max(...opToday.map(o => o.qty), 1);

  // Order progress
  const orderProgress = orders.map(o => {
    const enabledOps = OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled);
    const totalPossible = enabledOps.length * o.orderQty;
    const totalProduced = enabledOps.reduce((s, op) => s + getProduced(o.id, op.id), 0);
    return { ...o, pct: totalPossible > 0 ? Math.min(100, Math.round(totalProduced/totalPossible*100)) : 0 };
  });

  return (
    <div>
      <div className="sec-hdr">
        <div>
          <h2>Dashboard</h2>
          <div className="sec-hdr-sub">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <span className="badge badge-blue">Week 19 • May 2026</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-accent">
          <div className="kpi-label">Today's Production</div>
          <div className="kpi-value">{fmtQty(todayProd)}</div>
          <div className="kpi-sub">pieces across all ops</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-label">Week Bill (Est.)</div>
          <div className="kpi-value" style={{fontSize:22}}>₹{fmt(weekBill,0)}</div>
          <div className="kpi-sub">auto-generates Saturday</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-label">Active Orders</div>
          <div className="kpi-value">{pending}</div>
          <div className="kpi-sub">{orders.length} total orders</div>
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-label">Delayed Orders</div>
          <div className="kpi-value">{delayed}</div>
          <div className="kpi-sub">past delivery date</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card card-pad">
          <div className="card-title">Order Progress</div>
          <div className="bar-chart">
            {orderProgress.map(o => (
              <div key={o.id} className="bar-row">
                <div className="bar-label" title={o.orderNumber}>{o.orderNumber}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width: o.pct+'%',
                    background: o.pct >= 80 ? '#16a34a' : o.pct >= 40 ? '#2563eb' : '#ea580c'
                  }}/>
                </div>
                <div className="bar-val">{o.pct}%</div>
                <span className={`badge ${statusBadge(o.status)}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-title">Today's Operation Wise</div>
          {opToday.length === 0
            ? <div className="empty"><div className="empty-icon">📊</div><div className="empty-sub">No production entries today</div></div>
            : <div className="bar-chart">
                {opToday.map(o => (
                  <div key={o.name} className="bar-row">
                    <div className="bar-label">{o.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width:(o.qty/maxOp*100)+'%',background:'var(--accent)'}}/>
                    </div>
                    <div className="bar-val">{fmtQty(o.qty)}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title">Delayed / Urgent Orders</div>
        {delayed === 0
          ? <div style={{color:'var(--green)',fontSize:13}}>✓ All orders are on track</div>
          : <div className="tbl-wrap" style={{border:'none'}}>
              <table>
                <thead><tr><th>Order No</th><th>Buyer</th><th>Item</th><th>Delivery</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.filter(o => o.deliveryDate < todayStr && !['Completed','Cancelled'].includes(o.status)).map(o => (
                    <tr key={o.id}>
                      <td className="td-mono">{o.orderNumber}</td>
                      <td>{o.buyerName}</td>
                      <td>{o.itemName}</td>
                      <td><span className="badge badge-red">⚠ {o.deliveryDate}</span></td>
                      <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

function Orders({ orders, setOrders, toast, onGoOps }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const blank = { orderNumber:'', buyerName:'', styleNumber:'', itemName:'', color:'', size:'',
    orderQty:'', cuttingQty:'', deliveryDate:'', remarks:'', status:'In Progress' };

  const openNew  = () => { setForm(blank); setEditing(null); setErrors({}); setModal(true); };
  const openEdit = o => { setForm({...o, orderQty: o.orderQty+'', cuttingQty: o.cuttingQty+''}); setEditing(o.id); setErrors({}); setModal(true); };

  const validate = () => {
    const e = {};
    if (!form.orderNumber.trim()) e.orderNumber = 'Required';
    if (!form.buyerName.trim()) e.buyerName = 'Required';
    if (!form.itemName.trim()) e.itemName = 'Required';
    if (!form.orderQty || isNaN(+form.orderQty) || +form.orderQty <= 0) e.orderQty = 'Must be > 0';
    if (!form.cuttingQty || isNaN(+form.cuttingQty) || +form.cuttingQty <= 0) e.cuttingQty = 'Must be > 0';
    if (+form.cuttingQty < +form.orderQty) e.cuttingQty = 'Must be ≥ order qty';
    if (!form.deliveryDate) e.deliveryDate = 'Required';
    if (orders.some(o => o.orderNumber === form.orderNumber.trim() && o.id !== editing)) e.orderNumber = 'Already exists';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editing) {
      setOrders(prev => prev.map(o => o.id === editing
        ? { ...o, ...form, orderQty: +form.orderQty, cuttingQty: +form.cuttingQty } : o));
      toast("Order updated successfully");
    } else {
      setOrders(prev => [...prev, { ...form, id: uid(), orderQty: +form.orderQty, cuttingQty: +form.cuttingQty, ops: {} }]);
      toast("Order created successfully");
    }
    setModal(false);
  };

  const del = id => {
    if (!confirm("Delete this order?")) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    toast("Order deleted", "error");
  };

  const fil = orders.filter(o =>
    !search || [o.orderNumber, o.buyerName, o.itemName].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const F = ({ k, label, ...props }) => (
    <div className="form-group">
      <label>{label}</label>
      <input className={errors[k] ? 'field-error' : ''}
        value={form[k]||''} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} {...props}/>
      {errors[k] && <div className="form-error">⚠ {errors[k]}</div>}
    </div>
  );

  return (
    <div>
      <div className="sec-hdr">
        <div><h2>Order Management</h2><div className="sec-hdr-sub">{orders.length} orders total</div></div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input placeholder="🔍  Search orders…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:220,fontSize:13,padding:'8px 12px'}}/>
          <button className="btn btn-primary" onClick={openNew}>＋ New Order</button>
        </div>
      </div>

      <div className="tbl-wrap card">
        <table>
          <thead>
            <tr>
              <th>Order No</th><th>Buyer</th><th>Item</th><th>Color/Size</th>
              <th>Order Qty</th><th>Cutting Qty</th><th>Delivery</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fil.length === 0 && (
              <tr><td colSpan={9}><div className="empty"><div className="empty-icon">📋</div>
                <div className="empty-title">No orders found</div>
                <button className="btn btn-primary btn-sm" onClick={openNew} style={{marginTop:10}}>Create first order</button>
              </div></td></tr>
            )}
            {fil.map(o => (
              <tr key={o.id}>
                <td><span className="td-mono" style={{fontWeight:600}}>{o.orderNumber}</span></td>
                <td>{o.buyerName}</td>
                <td>{o.itemName}</td>
                <td><span className="badge badge-gray">{o.color} • {o.size}</span></td>
                <td className="td-mono">{fmtQty(o.orderQty)}</td>
                <td className="td-mono">{fmtQty(o.cuttingQty)}</td>
                <td>
                  <span className={`badge ${o.deliveryDate < today() && o.status !== 'Completed' ? 'badge-red' : 'badge-gray'}`}>
                    {o.deliveryDate}
                  </span>
                </td>
                <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn btn-outline btn-sm" onClick={() => onGoOps(o.id)}>⚙ Operations</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>✎</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(o.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Order" : "New Order"}
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{editing ? "Update" : "Create"} Order</button>
          </>}>
          <div className="form-grid">
            <F k="orderNumber"  label="Order Number *" placeholder="ORD-2026-001"/>
            <F k="buyerName"    label="Buyer Name *"   placeholder="H&M Global"/>
            <F k="styleNumber"  label="Style Number"   placeholder="ST-4421"/>
            <F k="itemName"     label="Item Name *"    placeholder="Men Trousers"/>
            <F k="color"        label="Color"          placeholder="Navy"/>
            <F k="size"         label="Size"           placeholder="M"/>
            <F k="orderQty"    label="Order Quantity *"   type="number" placeholder="2000"/>
            <F k="cuttingQty"  label="Cutting Quantity *" type="number" placeholder="2050"/>
            <F k="deliveryDate" label="Delivery Date *" type="date"/>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status||''} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {['In Progress','Completed','Urgent','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Remarks</label>
              <textarea value={form.remarks||''} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} rows={2}/>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── OPERATIONS ──────────────────────────────────────────────────────────────

function Operations({ orders, setOrders, entries, toast }) {
  const [orderId, setOrderId] = useState(orders[0]?.id || "");
  const order = orders.find(o => o.id === orderId);

  const getProduced = (opId) =>
    entries.filter(e => e.orderId === orderId && e.opId === opId).reduce((s,e) => s+e.qty, 0);

  const updateOp = (opId, field, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, ops: { ...o.ops, [opId]: { ...(o.ops[opId]||{}), [field]: value } } };
    }));
  };

  const save = () => toast("Operations saved successfully");

  if (!order) return <div className="empty"><div className="empty-icon">📦</div><div className="empty-title">No orders available</div></div>;

  return (
    <div>
      <div className="sec-hdr">
        <div>
          <h2>Operation Setup</h2>
          <div className="sec-hdr-sub">Enable operations and set rates per order</div>
        </div>
        <button className="btn btn-primary" onClick={save}>💾 Save Operations</button>
      </div>

      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <div className="form-group" style={{margin:0,flex:'0 0 280px'}}>
            <label>Select Order</label>
            <select value={orderId} onChange={e=>setOrderId(e.target.value)}>
              {orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber} — {o.buyerName}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <div><div style={{fontSize:11,color:'var(--ink3)',marginBottom:2}}>ORDER QTY</div>
              <span className="badge badge-blue" style={{fontSize:13}}>{fmtQty(order.orderQty)}</span></div>
            <div><div style={{fontSize:11,color:'var(--ink3)',marginBottom:2}}>CUTTING QTY</div>
              <span className="badge badge-yellow" style={{fontSize:13}}>{fmtQty(order.cuttingQty)}</span></div>
            <div><div style={{fontSize:11,color:'var(--ink3)',marginBottom:2}}>DELIVERY</div>
              <span className="badge badge-gray" style={{fontSize:13}}>{order.deliveryDate}</span></div>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div style={{display:'grid',gridTemplateColumns:'130px 1fr 110px 80px 100px 1fr',gap:8,marginBottom:8,padding:'0 0 8px',borderBottom:'1px solid var(--border)'}}>
          {['Operation','Contractor','Rate (₹)','','','Billed'].map((h,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px',color:'var(--ink3)'}}>{h}</div>
          ))}
        </div>

        {OPERATIONS_MASTER.map(op => {
          const cfg = order.ops[op.id] || { enabled: false, rate: 0, contractor: '', multiplier: 1 };
          const produced = getProduced(op.id);
          const limit = op.limitType === 'order' ? order.orderQty : order.cuttingQty;
          const billed = produced * (cfg.rate||0) * (cfg.multiplier||1);
          const pct = limit > 0 ? Math.min(100, Math.round(produced/limit*100)) : 0;

          return (
            <div key={op.id} className="op-row">
              <input type="checkbox" className="op-check"
                checked={!!cfg.enabled}
                onChange={e => updateOp(op.id, 'enabled', e.target.checked)}/>
              <div className={`op-name ${!cfg.enabled ? 'disabled' : ''}`}>{op.name}</div>

              <div style={{flex:1,minWidth:140}}>
                <input disabled={!cfg.enabled} placeholder="Contractor name" value={cfg.contractor||''}
                  onChange={e=>updateOp(op.id,'contractor',e.target.value)}
                  style={{width:'100%',opacity:cfg.enabled?1:.5}}/>
              </div>

              <input type="number" disabled={!cfg.enabled} placeholder="0.00" value={cfg.rate||''}
                onChange={e=>updateOp(op.id,'rate',parseFloat(e.target.value)||0)}
                style={{width:80,opacity:cfg.enabled?1:.5}}/>

              {op.extra
                ? <input type="number" disabled={!cfg.enabled} placeholder={op.extra}
                    title={op.extra} value={cfg.multiplier||1}
                    onChange={e=>updateOp(op.id,'multiplier',parseInt(e.target.value)||1)}
                    style={{width:90,opacity:cfg.enabled?1:.5}}/>
                : <div/>}

              <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:120}}>
                {cfg.enabled && produced > 0 ? <>
                  <span className="badge badge-green op-bill-badge">₹{fmt(billed,2)}</span>
                  <div className="prog-track" style={{width:110}}>
                    <div className="prog-fill" style={{width:pct+'%',background:pct>80?'#16a34a':'var(--accent)'}}/>
                  </div>
                  <span style={{fontSize:10,color:'var(--ink3)'}}>{produced}/{limit} pcs</span>
                </> : cfg.enabled ? <span style={{fontSize:11,color:'var(--ink4)'}}>No entries yet</span> : null}
              </div>

              <div style={{fontSize:10,color:'var(--ink4)',textAlign:'right'}}>
                {op.limitType === 'order' ? '🔒 order qty' : '📐 cutting qty'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRODUCTION ENTRY ─────────────────────────────────────────────────────────

function Production({ orders, entries, setEntries, toast }) {
  const [orderId, setOrderId] = useState(orders[0]?.id || "");
  const [opId, setOpId] = useState("");
  const [date, setDate] = useState(today());
  const [qty, setQty] = useState("");
  const [contractor, setContractor] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("entry");

  const order = orders.find(o => o.id === orderId);
  const enabledOps = order ? OPERATIONS_MASTER.filter(op => order.ops[op.id]?.enabled) : [];
  const selOp = OPERATIONS_MASTER.find(op => op.id === opId);

  useEffect(() => {
    if (enabledOps.length > 0 && !enabledOps.find(o=>o.id===opId)) {
      setOpId(enabledOps[0].id);
    }
  }, [orderId, enabledOps.length]);

  useEffect(() => {
    if (order && opId) {
      const cfg = order.ops[opId];
      if (cfg?.contractor) setContractor(cfg.contractor);
    }
  }, [opId, orderId]);

  const getProduced = (oId, op) =>
    entries.filter(e => e.orderId === oId && e.opId === op).reduce((s,e) => s+e.qty, 0);

  const limit = order && selOp
    ? (selOp.limitType === 'order' ? order.orderQty : order.cuttingQty) : 0;
  const produced = order && opId ? getProduced(orderId, opId) : 0;
  const balance = limit - produced;

  const submit = () => {
    setError("");
    const q = parseInt(qty);
    if (!orderId) { setError("Select an order"); return; }
    if (!opId)    { setError("Select an operation"); return; }
    if (!q || q <= 0) { setError("Enter a valid quantity"); return; }
    if (!contractor.trim()) { setError("Enter contractor name"); return; }
    if (q > balance) {
      setError(`Exceeds ${selOp?.limitType === 'order' ? 'order' : 'cutting'} qty limit! Balance: ${balance} pcs`);
      return;
    }
    setEntries(prev => [...prev, { id: uid(), orderId, opId, date, qty: q, contractor, remarks }]);
    setQty(""); setRemarks(""); setError("");
    toast(`✓ ${q} pcs recorded for ${selOp?.name}`);
  };

  const delEntry = id => {
    if (!confirm("Delete this entry?")) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    toast("Entry deleted", "error");
  };

  const todayEntries = entries.filter(e => e.date === today()).sort((a,b) => b.id.localeCompare(a.id));
  const allEntries = entries.slice().sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div>
      <div className="sec-hdr">
        <div><h2>Daily Production Entry</h2>
          <div className="sec-hdr-sub">{today()} — Enter quantity produced per operation</div>
        </div>
      </div>

      <div className="tab-bar">
        <div className={`tab ${tab==='entry'?'active':''}`} onClick={()=>setTab('entry')}>📝 New Entry</div>
        <div className={`tab ${tab==='log'?'active':''}`} onClick={()=>setTab('log')}>📋 Today's Log ({todayEntries.length})</div>
        <div className={`tab ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>📁 All Entries ({entries.length})</div>
      </div>

      {tab === 'entry' && (
        <>
          <div className="card card-pad" style={{marginBottom:16}}>
            <div className="card-title">Production Details</div>
            <div className="form-grid form-grid-3" style={{marginBottom:14}}>
              <div className="form-group">
                <label>Order *</label>
                <select value={orderId} onChange={e=>setOrderId(e.target.value)}>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.orderNumber} — {o.buyerName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Operation *</label>
                <select value={opId} onChange={e=>setOpId(e.target.value)}>
                  {enabledOps.map(op=><option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
              </div>
              <div className="form-group">
                <label>Contractor *</label>
                <input value={contractor} onChange={e=>setContractor(e.target.value)} placeholder="Contractor name"/>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" value={qty} onChange={e=>setQty(e.target.value)}
                  placeholder={`Max: ${balance}`} min={1} max={balance}
                  onKeyDown={e=>e.key==='Enter'&&submit()}/>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional"/>
              </div>
            </div>

            {/* Balance info */}
            {order && opId && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,
                padding:'14px',background:'var(--paper)',borderRadius:8,marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:'var(--ink3)',marginBottom:3}}>
                    {selOp?.limitType==='order'?'ORDER QTY':'CUTTING QTY'} LIMIT
                  </div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:'DM Mono,monospace'}}>{fmtQty(limit)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:'var(--ink3)',marginBottom:3}}>PREV PRODUCED</div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:'DM Mono,monospace'}}>{fmtQty(produced)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:'var(--ink3)',marginBottom:3}}>BALANCE QTY</div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:'DM Mono,monospace',
                    color:balance<100?'var(--red)':balance<500?'var(--orange)':'var(--green)'}}>{fmtQty(balance)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:'var(--ink3)',marginBottom:6}}>PROGRESS</div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{
                      width:Math.min(100,limit>0?produced/limit*100:0)+'%',
                      background:produced/limit>.9?'var(--red)':'var(--accent)'
                    }}/>
                  </div>
                  <div style={{fontSize:10,color:'var(--ink3)',marginTop:3}}>
                    {limit>0?Math.min(100,Math.round(produced/limit*100)):0}% complete
                  </div>
                </div>
              </div>
            )}

            {error && <div className="alert alert-red">⚠ {error}</div>}
            {balance === 0 && opId && <div className="alert alert-yellow">⚠ This operation has reached its quantity limit.</div>}

            <button className="btn btn-primary" onClick={submit} disabled={balance===0}>
              ✓ Save Production Entry
            </button>
          </div>
        </>
      )}

      {(tab === 'log' || tab === 'all') && (
        <div className="tbl-wrap card">
          <table>
            <thead>
              <tr><th>Date</th><th>Order</th><th>Operation</th><th>Contractor</th><th>Qty</th><th>Remarks</th><th></th></tr>
            </thead>
            <tbody>
              {(tab === 'log' ? todayEntries : allEntries).length === 0 && (
                <tr><td colSpan={7}><div className="empty">
                  <div className="empty-icon">📝</div>
                  <div className="empty-title">No entries {tab === 'log' ? 'today' : 'yet'}</div>
                </div></td></tr>
              )}
              {(tab === 'log' ? todayEntries : allEntries).map(e => {
                const o = orders.find(x => x.id === e.orderId);
                const op = OPERATIONS_MASTER.find(x => x.id === e.opId);
                const cfg = o?.ops[e.opId];
                const bill = e.qty * (cfg?.rate||0) * (cfg?.multiplier||1);
                return (
                  <tr key={e.id}>
                    <td className="td-mono">{e.date}</td>
                    <td><span className="td-mono" style={{fontWeight:600}}>{o?.orderNumber}</span>
                      <div style={{fontSize:11,color:'var(--ink3)'}}>{o?.buyerName}</div></td>
                    <td><span className="badge badge-blue">{op?.name}</span></td>
                    <td>{e.contractor}</td>
                    <td><span className="td-mono" style={{fontWeight:600}}>{fmtQty(e.qty)}</span></td>
                    <td style={{fontSize:12,color:'var(--ink3)'}}>{e.remarks}</td>
                    <td><button className="btn btn-danger btn-sm btn-icon" onClick={()=>delEntry(e.id)}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── WEEKLY BILLS ─────────────────────────────────────────────────────────────

function Billing({ orders, entries, toast }) {
  const [bills, setBills] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeek = (offset = 0) => {
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (day===0?6:day-1));
    const sat = new Date(mon); sat.setDate(mon.getDate() + 5);
    return {
      start: mon.toISOString().split('T')[0],
      end:   sat.toISOString().split('T')[0],
    };
  };

  const { start: weekStart, end: weekEnd } = getWeek(weekOffset);

  const generateBills = () => {
    const lineItems = [];
    orders.forEach(o => {
      OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled).forEach(op => {
        const cfg = o.ops[op.id];
        const qty = entries
          .filter(e => e.orderId===o.id && e.opId===op.id && e.date>=weekStart && e.date<=weekEnd)
          .reduce((s,e) => s+e.qty, 0);
        if (!qty) return;
        const mult = cfg.multiplier || 1;
        const total = qty * (cfg.rate||0) * mult;
        lineItems.push({
          id: uid(), orderId: o.id, orderNumber: o.orderNumber, buyerName: o.buyerName,
          opId: op.id, opName: op.name, contractor: cfg.contractor,
          qty, rate: cfg.rate||0, multiplier: mult, total
        });
      });
    });

    // Group by contractor
    const groups = {};
    lineItems.forEach(li => {
      if (!groups[li.contractor]) groups[li.contractor] = { items:[], total:0 };
      groups[li.contractor].items.push(li);
      groups[li.contractor].total += li.total;
    });

    const newBills = Object.entries(groups).map(([contractor, data], i) => ({
      id: uid(),
      billNumber: `BILL-2026-W${weekEnd.slice(5,7)}-${contractor.replace(/[^a-z0-9]/gi,'').slice(0,5).toUpperCase()}`,
      weekStart, weekEnd, contractor,
      items: data.items,
      total: data.total,
      status: 'Generated',
      generatedAt: new Date().toISOString()
    }));

    setBills(newBills);
    setGenerated(true);
    toast(`${newBills.length} bill(s) generated for week ${weekStart} → ${weekEnd}`);
  };

  const grandTotal = bills.reduce((s,b) => s+b.total, 0);

  return (
    <div>
      <div className="sec-hdr">
        <div>
          <h2>Weekly Bill Generation</h2>
          <div className="sec-hdr-sub">Auto-generates every Saturday at midnight</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setWeekOffset(w=>w-1)}>← Prev Week</button>
          <span className="badge badge-blue">Week: {weekStart} → {weekEnd}</span>
          <button className="btn btn-outline btn-sm" onClick={()=>setWeekOffset(w=>w+1)}>Next Week →</button>
          <button className="btn btn-primary" onClick={generateBills}>⚡ Generate Bills</button>
        </div>
      </div>

      {generated && bills.length > 0 && (
        <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:16}}>
          <div className="kpi-card kpi-accent">
            <div className="kpi-label">Grand Total</div>
            <div className="kpi-value" style={{fontSize:22}}>₹{fmt(grandTotal,2)}</div>
            <div className="kpi-sub">all contractors</div>
          </div>
          <div className="kpi-card kpi-green">
            <div className="kpi-label">Bills Generated</div>
            <div className="kpi-value">{bills.length}</div>
            <div className="kpi-sub">contractor-wise</div>
          </div>
          <div className="kpi-card kpi-orange">
            <div className="kpi-label">Line Items</div>
            <div className="kpi-value">{bills.reduce((s,b)=>s+b.items.length,0)}</div>
            <div className="kpi-sub">operation entries</div>
          </div>
        </div>
      )}

      {!generated && (
        <div className="card card-pad">
          <div className="empty">
            <div className="empty-icon">🧾</div>
            <div className="empty-title">No bills generated yet</div>
            <div className="empty-sub" style={{marginBottom:16}}>Click "Generate Bills" to create bills for the selected week</div>
            <button className="btn btn-primary" onClick={generateBills}>⚡ Generate Bills Now</button>
          </div>
        </div>
      )}

      {bills.map(bill => (
        <div key={bill.id} className="card" style={{marginBottom:16,overflow:'hidden'}}>
          <div className="bill-header">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginBottom:4,letterSpacing:'.5px'}}>BILL NUMBER</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:'DM Mono,monospace'}}>{bill.billNumber}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginBottom:4}}>TOTAL AMOUNT</div>
                <div style={{fontSize:24,fontWeight:700,fontFamily:'DM Mono,monospace'}}>₹{fmt(bill.total,2)}</div>
              </div>
            </div>
            <div className="bill-grid" style={{marginTop:14}}>
              <div><div className="bill-field">Contractor</div><div className="bill-val">{bill.contractor}</div></div>
              <div><div className="bill-field">Week Start</div><div className="bill-val">{bill.weekStart}</div></div>
              <div><div className="bill-field">Week End</div><div className="bill-val">{bill.weekEnd}</div></div>
            </div>
          </div>

          <div style={{padding:'0 0 0'}}>
            {bill.items.map((item,i) => (
              <div key={i} className="bill-total-row">
                <div>
                  <div style={{fontWeight:500}}>{item.opName}</div>
                  <div style={{fontSize:11,color:'var(--ink3)'}}>{item.orderNumber} • {item.buyerName}</div>
                </div>
                <div style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--ink3)'}}>
                  {fmtQty(item.qty)} × ₹{item.rate}{item.multiplier>1?` × ${item.multiplier}`:''}
                </div>
                <div style={{fontWeight:600,fontFamily:'DM Mono,monospace',minWidth:90,textAlign:'right'}}>
                  ₹{fmt(item.total,2)}
                </div>
              </div>
            ))}
          </div>

          <div className="bill-grand">
            <div style={{fontSize:14,fontWeight:500}}>Grand Total — {bill.contractor}</div>
            <div style={{fontSize:22,fontWeight:700,fontFamily:'DM Mono,monospace'}}>₹{fmt(bill.total,2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

function Reports({ orders, entries }) {
  const [tab, setTab] = useState("pending");

  const getProduced = (orderId, opId) =>
    entries.filter(e => e.orderId===orderId && e.opId===opId).reduce((s,e) => s+e.qty, 0);

  // Pending qty report
  const pendingRows = [];
  orders.forEach(o => {
    OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled).forEach(op => {
      const cfg = o.ops[op.id];
      const limit = op.limitType==='order' ? o.orderQty : o.cuttingQty;
      const produced = getProduced(o.id, op.id);
      const balance = limit - produced;
      if (balance > 0) pendingRows.push({
        orderNumber: o.orderNumber, buyer: o.buyerName, opName: op.name,
        contractor: cfg.contractor, limit, produced, balance,
        pct: Math.round(produced/limit*100)
      });
    });
  });

  // Operation-wise summary
  const opSummary = OPERATIONS_MASTER.map(op => {
    const total = entries.filter(e => e.opId===op.id).reduce((s,e)=>s+e.qty, 0);
    const amount = orders.reduce((s,o) => {
      const cfg = o.ops[op.id];
      if (!cfg?.enabled) return s;
      const prod = getProduced(o.id, op.id);
      return s + prod * (cfg.rate||0) * (cfg.multiplier||1);
    }, 0);
    return { name: op.name, total, amount };
  }).filter(o => o.total > 0);

  // Contractor-wise
  const contractorMap = {};
  orders.forEach(o => {
    OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled).forEach(op => {
      const cfg = o.ops[op.id];
      const k = cfg.contractor || 'Unknown';
      const prod = getProduced(o.id, op.id);
      const amt = prod * (cfg.rate||0) * (cfg.multiplier||1);
      if (!contractorMap[k]) contractorMap[k] = { qty:0, amount:0, ops: new Set() };
      contractorMap[k].qty += prod;
      contractorMap[k].amount += amt;
      if (prod > 0) contractorMap[k].ops.add(op.name);
    });
  });

  // Order status
  const orderStatus = orders.map(o => {
    const enabledOps = OPERATIONS_MASTER.filter(op => o.ops[op.id]?.enabled);
    const totalProd = enabledOps.reduce((s,op)=>s+getProduced(o.id,op.id),0);
    const maxPoss = enabledOps.length * o.orderQty;
    const pct = maxPoss>0 ? Math.min(100,Math.round(totalProd/maxPoss*100)) : 0;
    const delayed = o.deliveryDate < today() && !['Completed','Cancelled'].includes(o.status);
    return { ...o, totalProd, pct, delayed };
  });

  const exportCSV = (rows, cols, filename) => {
    const hdr = cols.map(c=>c.label).join(',');
    const body = rows.map(r=>cols.map(c=>JSON.stringify(r[c.key]??'')).join(',')).join('\n');
    const blob = new Blob([hdr+'\n'+body], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="sec-hdr"><div><h2>Reports</h2><div className="sec-hdr-sub">Export data as CSV</div></div></div>

      <div className="tab-bar">
        <div className={`tab ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>⏳ Pending Qty</div>
        <div className={`tab ${tab==='opwise'?'active':''}`} onClick={()=>setTab('opwise')}>🔧 Operation Wise</div>
        <div className={`tab ${tab==='contractor'?'active':''}`} onClick={()=>setTab('contractor')}>👷 Contractor Wise</div>
        <div className={`tab ${tab==='status'?'active':''}`} onClick={()=>setTab('status')}>📦 Order Status</div>
      </div>

      {tab === 'pending' && (
        <div>
          <div className="sec-hdr" style={{marginBottom:12}}>
            <div><span className="badge badge-orange">{pendingRows.length} operations pending</span></div>
            <button className="btn btn-outline btn-sm"
              onClick={()=>exportCSV(pendingRows,[
                {label:'Order',key:'orderNumber'},{label:'Buyer',key:'buyer'},
                {label:'Operation',key:'opName'},{label:'Contractor',key:'contractor'},
                {label:'Limit',key:'limit'},{label:'Produced',key:'produced'},{label:'Balance',key:'balance'}
              ],'pending-qty.csv')}>⬇ Export CSV</button>
          </div>
          <div className="tbl-wrap card">
            <table>
              <thead><tr><th>Order</th><th>Buyer</th><th>Operation</th><th>Contractor</th><th>Limit</th><th>Produced</th><th>Balance</th><th>Progress</th></tr></thead>
              <tbody>
                {pendingRows.length===0&&<tr><td colSpan={8}><div className="empty"><div className="empty-icon">✅</div><div className="empty-title">All operations are complete!</div></div></td></tr>}
                {pendingRows.map((r,i)=>(
                  <tr key={i}>
                    <td className="td-mono" style={{fontWeight:600}}>{r.orderNumber}</td>
                    <td>{r.buyer}</td>
                    <td><span className="badge badge-blue">{r.opName}</span></td>
                    <td style={{fontSize:12}}>{r.contractor}</td>
                    <td className="td-mono">{fmtQty(r.limit)}</td>
                    <td className="td-mono">{fmtQty(r.produced)}</td>
                    <td><span className={`badge td-mono ${r.balance<200?'badge-red':r.balance<500?'badge-orange':'badge-green'}`}>{fmtQty(r.balance)}</span></td>
                    <td style={{width:120}}>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:r.pct+'%',background:r.pct>80?'#16a34a':'var(--accent)'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--ink3)',marginTop:2}}>{r.pct}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'opwise' && (
        <div>
          <div className="sec-hdr" style={{marginBottom:12}}>
            <div/>
            <button className="btn btn-outline btn-sm"
              onClick={()=>exportCSV(opSummary,[
                {label:'Operation',key:'name'},{label:'Total Qty',key:'total'},{label:'Amount',key:'amount'}
              ],'operation-wise.csv')}>⬇ Export CSV</button>
          </div>
          <div className="tbl-wrap card">
            <table>
              <thead><tr><th>Operation</th><th>Total Qty Produced</th><th>Total Amount (₹)</th></tr></thead>
              <tbody>
                {opSummary.map(r=>(
                  <tr key={r.name}>
                    <td><span className="badge badge-blue">{r.name}</span></td>
                    <td className="td-mono">{fmtQty(r.total)}</td>
                    <td className="td-mono" style={{fontWeight:600}}>₹{fmt(r.amount,2)}</td>
                  </tr>
                ))}
                <tr style={{background:'var(--paper)'}}>
                  <td style={{fontWeight:600}}>TOTAL</td>
                  <td className="td-mono" style={{fontWeight:600}}>{fmtQty(opSummary.reduce((s,r)=>s+r.total,0))}</td>
                  <td className="td-mono" style={{fontWeight:600,color:'var(--accent)'}}>₹{fmt(opSummary.reduce((s,r)=>s+r.amount,0),2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contractor' && (
        <div>
          <div className="sec-hdr" style={{marginBottom:12}}>
            <div/>
            <button className="btn btn-outline btn-sm"
              onClick={()=>exportCSV(Object.entries(contractorMap).map(([k,v])=>({contractor:k,qty:v.qty,amount:v.amount,ops:[...v.ops].join(';')})),[
                {label:'Contractor',key:'contractor'},{label:'Total Qty',key:'qty'},{label:'Amount',key:'amount'},{label:'Operations',key:'ops'}
              ],'contractor-wise.csv')}>⬇ Export CSV</button>
          </div>
          <div className="tbl-wrap card">
            <table>
              <thead><tr><th>Contractor</th><th>Total Qty</th><th>Total Amount</th><th>Operations</th></tr></thead>
              <tbody>
                {Object.entries(contractorMap).map(([name,data])=>(
                  <tr key={name}>
                    <td style={{fontWeight:500}}>{name}</td>
                    <td className="td-mono">{fmtQty(data.qty)}</td>
                    <td className="td-mono" style={{fontWeight:600}}>₹{fmt(data.amount,2)}</td>
                    <td style={{fontSize:12,color:'var(--ink3)'}}>{[...data.ops].join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'status' && (
        <div>
          <div className="tbl-wrap card">
            <table>
              <thead><tr><th>Order No</th><th>Buyer</th><th>Item</th><th>Order Qty</th><th>Delivery</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                {orderStatus.map(o=>(
                  <tr key={o.id}>
                    <td className="td-mono" style={{fontWeight:600}}>{o.orderNumber}</td>
                    <td>{o.buyerName}</td>
                    <td>{o.itemName} • {o.color} • {o.size}</td>
                    <td className="td-mono">{fmtQty(o.orderQty)}</td>
                    <td><span className={`badge ${o.delayed?'badge-red':'badge-gray'}`}>{o.deliveryDate}</span></td>
                    <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                    <td style={{width:160}}>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:o.pct+'%',background:o.pct>80?'#16a34a':'var(--accent)'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--ink3)',marginTop:2}}>{o.pct}% • {fmtQty(o.totalProd)} pcs</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────

function Users({ toast }) {
  const [users] = useState([
    { id:1, name:'Admin User',       email:'admin@garment.com',   role:'admin',   active:true },
    { id:2, name:'Prod Manager',     email:'manager@garment.com', role:'manager', active:true },
    { id:3, name:'Entry Staff',      email:'entry@garment.com',   role:'entry',   active:true },
    { id:4, name:'Billing Staff',    email:'billing@garment.com', role:'billing', active:true },
  ]);

  return (
    <div>
      <div className="sec-hdr">
        <div><h2>User Management</h2><div className="sec-hdr-sub">Role-based access control</div></div>
        <button className="btn btn-primary" onClick={()=>toast("User management requires backend integration","error")}>＋ Add User</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        {Object.entries(ROLES).map(([k,v])=>(
          <div key={k} className="card card-pad" style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:44,height:44,borderRadius:12,background:'var(--accent-light)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
              {k==='admin'?'🛡':k==='manager'?'📊':k==='entry'?'✏️':'🧾'}
            </div>
            <div>
              <div style={{fontWeight:600,fontSize:14}}>{v}</div>
              <div style={{fontSize:12,color:'var(--ink3)',marginTop:2}}>
                {k==='admin'?'Full system access':k==='manager'?'Orders + production':k==='entry'?'Production entry only':'Billing + reports'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="tbl-wrap card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}>
                <td><div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="avatar" style={{width:28,height:28,fontSize:11}}>{u.name[0]}</div>
                  {u.name}
                </div></td>
                <td style={{fontSize:12,color:'var(--ink3)'}}>{u.email}</td>
                <td><span className="badge badge-blue">{ROLES[u.role]}</span></td>
                <td><span className="badge badge-green">● Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'📊' },
  { id:'orders',    label:'Orders',          icon:'📋' },
  { id:'operations',label:'Operations',      icon:'⚙️' },
  { id:'production',label:'Daily Entry',     icon:'✏️' },
  { id:'billing',   label:'Weekly Bills',    icon:'🧾' },
  { id:'reports',   label:'Reports',         icon:'📈' },
  { id:'users',     label:'Users',           icon:'👥' },
];

export default function App() {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState('dashboard');
  const [orders, setOrders]     = useState(INITIAL_ORDERS);
  const [entries, setEntries]   = useState(INITIAL_ENTRIES);
  const [opsOrderId, setOpsOrderId] = useState(null);
  const { toasts, show: toast } = useToast();

  const goOps = (orderId) => { setOpsOrderId(orderId); setPage('operations'); };

  if (!user) return (
    <>
      <style>{G}</style>
      <Login onLogin={setUser}/>
      <Toast toasts={toasts}/>
    </>
  );

  const pageTitle = NAV.find(n=>n.id===page)?.label || 'Dashboard';

  return (
    <>
      <style>{G}</style>
      <div className="erp-shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">
              <div className="brand-icon">✂</div>
              <span>GarmentERP</span>
            </div>
            <div className="brand-sub">Production & Billing</div>
          </div>

          <div className="nav-section">
            <div className="nav-label">Main Menu</div>
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${page===n.id?'active':''}`}
                onClick={()=>setPage(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="avatar">{user.name[0]}</div>
            <div>
              <div className="avatar-name">{user.name}</div>
              <div className="avatar-role">{ROLES[user.role]}</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{pageTitle}</div>
            <div className="topbar-pills">
              <span className="badge badge-green">🟢 Live</span>
              <span className="badge badge-blue">17 May 2026</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setUser(null)}>Sign out</button>
            </div>
          </div>

          <div className="content">
            {page==='dashboard'  && <Dashboard orders={orders} entries={entries}/>}
            {page==='orders'     && <Orders orders={orders} setOrders={setOrders} toast={toast} onGoOps={goOps}/>}
            {page==='operations' && <Operations orders={orders} setOrders={setOrders} entries={entries} toast={toast} initialOrderId={opsOrderId}/>}
            {page==='production' && <Production orders={orders} entries={entries} setEntries={setEntries} toast={toast}/>}
            {page==='billing'    && <Billing orders={orders} entries={entries} toast={toast}/>}
            {page==='reports'    && <Reports orders={orders} entries={entries}/>}
            {page==='users'      && <Users toast={toast}/>}
          </div>
        </div>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}

