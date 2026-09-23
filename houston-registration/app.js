const cfg=window.LEXGLOBAL_CONFIG||{};
const configured=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes("PASTE_")&&!cfg.SUPABASE_ANON_KEY.includes("PASTE_");
const sb=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
let selectedMethod="bKash",participantData={};

function show(n){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("screen-"+n)?.classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function makeRegistrationId(){const d=new Date(),y=String(d.getFullYear()).slice(-2),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0"),r=Math.floor(10000+Math.random()*90000);return `LGUH-${y}${m}${day}-${r}`;}
function localPaymentDateTime(){const n=new Date();return{payment_date:`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,payment_time:`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`};}
const payMap={
"bKash":{title:"bKash Send Money",rows:[["Number","01885603359"],["Amount","৳299"]],mobile:true,amount:"299"},
"Nagad":{title:"Nagad Send Money",rows:[["Number","01303498506"],["Amount","৳299"]],mobile:true,amount:"299"},
"Bank Transfer":{title:"BRAC Bank PLC",rows:[["Account Name","MD. NAHID ALOM"],["Account Number","1073658180001"],["Branch","RAJSHAHI BRANCH"],["Routing","060811934"],["SWIFT","BRAKBDDH"],["Amount","৳299"]],mobile:false,amount:"299"},
"Redot Pay":{title:"Redot Pay",rows:[["Pay ID","1164960686"],["Amount","USD 2.50"]],mobile:false,amount:"2.50"}
};
function renderPayment(){document.querySelectorAll(".pay").forEach(x=>x.classList.toggle("active",x.dataset.method===selectedMethod));const p=payMap[selectedMethod],box=document.getElementById("pay-detail");if(box)box.innerHTML=`<h3 style="margin-top:0">${p.title}</h3>${p.rows.map(([k,v])=>`<div class="row"><small>${k}</small><b>${v}</b></div>`).join("")}<div style="margin-top:10px;color:#afc4cf;font-size:12px">Send the exact amount, then submit your transaction ID in the next step.</div>`;const mf=document.getElementById("method-field"),mw=document.getElementById("payment-mobile-wrap"),mi=document.getElementById("payment-mobile"),a=document.getElementById("amount-paid");if(mf)mf.value=selectedMethod;if(mw)mw.style.display=p.mobile?"block":"none";if(mi){mi.required=p.mobile;if(!p.mobile)mi.value=""}if(a)a.value=p.amount;}
document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g){e.preventDefault();show(g.dataset.go);return}const p=e.target.closest("[data-method]");if(p){selectedMethod=p.dataset.method;renderPayment();}});
document.getElementById("participant-form")?.addEventListener("submit",e=>{e.preventDefault();if(!e.target.reportValidity())return;participantData=Object.fromEntries(new FormData(e.target).entries());show(4);});
const upload=document.querySelector(".upload"),receiptInput=document.getElementById("receipt");upload?.addEventListener("click",()=>receiptInput?.click());
document.getElementById("payment-form")?.addEventListener("submit",async e=>{
e.preventDefault();if(!e.target.reportValidity())return;if(!configured){alert("Database is not connected. Please check config.js.");return}
show(7);
try{
 const paymentData=Object.fromEntries(new FormData(e.target).entries()),registrationId=makeRegistrationId(),receipt=receiptInput?.files?.[0]||null;let receiptPath=null;
 if(receipt){if(receipt.size>5*1024*1024)throw new Error("Payment screenshot must be 5MB or smaller.");const ext=(receipt.name.split(".").pop()||"bin").toLowerCase();receiptPath=`${registrationId}/${crypto.randomUUID()}.${ext}`;const{error}=await sb.storage.from("payment-receipts").upload(receiptPath,receipt,{upsert:false});if(error)throw error;}
 const t=localPaymentDateTime();
 const row={registration_id:registrationId,full_name:participantData.full_name,age:Number(participantData.age),email:participantData.email,mobile:participantData.mobile,whatsapp:participantData.whatsapp,profession:participantData.profession,institution:participantData.institution||null,present_address:participantData.present_address,district:participantData.district,division:participantData.division,country:participantData.country||"Bangladesh",facebook_url:participantData.facebook_url||null,preferred_contact:participantData.preferred_contact||"WhatsApp",interested_topic:participantData.interested_topic,join_reason:participantData.join_reason||null,referral_source:participantData.referral_source||null,payment_method:selectedMethod,transaction_id:paymentData.transaction_id,payment_mobile:paymentData.payment_mobile||null,amount_paid:Number(paymentData.amount_paid||0),currency:selectedMethod==="Redot Pay"?"USD":"BDT",payment_date:t.payment_date,payment_time:t.payment_time,receipt_path:receiptPath,promo_code:"lexbdhouston",payment_status:"Pending Verification",registration_status:"Pending Verification"};
 const{error}=await sb.from("houston_registrations").insert(row);if(error)throw error;setTimeout(()=>show(8),800);
}catch(err){console.error(err);alert("Submission failed: "+(err?.message||"Please try again."));show(6);}
});
renderPayment();