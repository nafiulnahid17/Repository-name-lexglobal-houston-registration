const cfg=window.LEXGLOBAL_CONFIG||{};
const configured=cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
const sb=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
let dataRows=[];

const login=document.getElementById("login"),dash=document.getElementById("dash"),logout=document.getElementById("logout"),dlg=document.getElementById("dlg");

async function adminOK(){
  if(!sb) return false;
  const {data:{session}}=await sb.auth.getSession();
  if(!session) return false;
  const {data,error}=await sb.from("houston_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
  return !!data && !error;
}
function showLogin(){login.classList.remove("hidden");dash.classList.add("hidden");logout.classList.add("hidden")}
function showDash(){login.classList.add("hidden");dash.classList.remove("hidden");logout.classList.remove("hidden")}

document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!configured){document.getElementById("msg").textContent="Supabase is not configured in config.js.";return;}
  const f=Object.fromEntries(new FormData(e.target).entries());
  const {error}=await sb.auth.signInWithPassword({email:f.email,password:f.password});
  if(error){document.getElementById("msg").textContent=error.message;return;}
  if(!(await adminOK())){await sb.auth.signOut();document.getElementById("msg").textContent="This account is not authorized as an admin.";return;}
  showDash();load();
});
logout.addEventListener("click",async()=>{await sb.auth.signOut();showLogin()});
document.getElementById("close").onclick=()=>dlg.close();
document.getElementById("refresh").onclick=load;
document.getElementById("search").oninput=render;
document.getElementById("status").onchange=render;

async function load(){
  const {data,error}=await sb.from("houston_registrations").select("*").order("created_at",{ascending:false});
  if(error){alert(error.message);return;}
  dataRows=data||[];stats();render();
}
function stats(){
  total.textContent=dataRows.length;
  verified.textContent=dataRows.filter(r=>["Payment Verified","Registration Confirmed"].includes(r.payment_status)).length;
  pending.textContent=dataRows.filter(r=>r.payment_status==="Pending Verification").length;
  const good=dataRows.filter(r=>["Payment Verified","Registration Confirmed"].includes(r.payment_status));
  const bdtSum=good.filter(r=>r.currency==="BDT").reduce((s,r)=>s+Number(r.amount_paid||0),0);
  const usdSum=good.filter(r=>r.currency==="USD").reduce((s,r)=>s+Number(r.amount_paid||0),0);
  bdt.textContent="৳"+bdtSum.toLocaleString();
  usd.textContent="$"+usdSum.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function statusBadge(s){
  let c="pending"; if(s==="Payment Verified")c="verified"; if(s==="Registration Confirmed")c="confirmed"; if(s==="Payment Rejected")c="rejected";
  return `<span class="badge ${c}">${s||"Pending Verification"}</span>`;
}
function filtered(){
  const q=document.getElementById("search").value.trim().toLowerCase();
  const st=document.getElementById("status").value;
  return dataRows.filter(r=>{
    const hay=[r.registration_id,r.full_name,r.email,r.mobile,r.whatsapp,r.transaction_id].join(" ").toLowerCase();
    return (!q||hay.includes(q)) && (!st||r.payment_status===st||r.registration_status===st);
  });
}
function render(){
  document.getElementById("rows").innerHTML=filtered().map(r=>`<tr>
  <td><b>${r.registration_id}</b></td>
  <td>${r.full_name}<br><small>${r.district||""}</small></td>
  <td>${r.mobile}<br><small>${r.email}</small></td>
  <td>${r.profession||""}</td>
  <td>${r.payment_method}<br><small>${r.transaction_id}</small></td>
  <td>${statusBadge(r.payment_status)}</td>
  <td>${new Date(r.created_at).toLocaleString()}</td>
  <td><button onclick="openRow('${r.id}')">View</button></td></tr>`).join("");
}
window.openRow=async id=>{
  const r=dataRows.find(x=>x.id===id); if(!r)return;
  let receipt="No receipt uploaded";
  if(r.receipt_path){
    const {data,error}=await sb.storage.from("payment-receipts").createSignedUrl(r.receipt_path,3600);
    if(!error&&data?.signedUrl) receipt=`<a target="_blank" href="${data.signedUrl}">View receipt</a>`;
  }
  const fields=[["Registration ID",r.registration_id],["Full Name",r.full_name],["Email",r.email],["Mobile",r.mobile],["WhatsApp",r.whatsapp],["Profession",r.profession],["Institution",r.institution],["District",r.district],["Country",r.country],["Facebook",r.facebook_url],["Preferred Contact",r.preferred_contact],["Payment Method",r.payment_method],["Transaction ID",r.transaction_id],["Payment Mobile",r.payment_mobile],["Amount",`${r.currency==="USD"?"$":"৳"}${r.amount_paid}`],["Payment Date",r.payment_date],["Payment Time",r.payment_time],["Receipt",receipt],["Payment Status",r.payment_status],["Registration Status",r.registration_status]];
  details.innerHTML=`<div class="grid">${fields.map(([k,v])=>`<div><small>${k}</small><b>${v??"-"}</b></div>`).join("")}</div><div class="actions">
  <button class="green" onclick="setStatus('${r.id}','Payment Verified','Payment Verified')">Verify Payment</button>
  <button class="green" onclick="setStatus('${r.id}','Registration Confirmed','Registration Confirmed')">Confirm Registration</button>
  <button class="light" onclick="setStatus('${r.id}','Payment Rejected','Payment Rejected')">Reject Payment</button></div>`;
  dlg.showModal();
}
window.setStatus=async(id,payment_status,registration_status)=>{
  const {error}=await sb.from("houston_registrations").update({payment_status,registration_status,verified_at:new Date().toISOString()}).eq("id",id);
  if(error){alert(error.message);return;} dlg.close();load();
}
document.getElementById("csv").onclick=()=>{
  const rows=filtered();
  const keys=["registration_id","full_name","email","mobile","whatsapp","profession","institution","district","country","preferred_contact","payment_method","transaction_id","payment_mobile","amount_paid","currency","payment_date","payment_time","payment_status","registration_status","created_at"];
  const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[keys.join(","),...rows.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="houston-registrations.csv";a.click();URL.revokeObjectURL(a.href);
}
(async()=>{if(await adminOK()){showDash();load()}else showLogin()})();
