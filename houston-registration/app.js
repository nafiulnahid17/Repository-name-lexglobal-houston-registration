const cfg=window.LEXGLOBAL_CONFIG||{};
const configured=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes("PASTE_")&&!cfg.SUPABASE_ANON_KEY.includes("PASTE_");
const sb=configured&&window.supabase?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;

let selectedMethod="bKash";
let participantData={};
let submitted=false;
let submitting=false;
let registrationId=null;
let uploadedReceiptPath=null;
let uploadedReceiptFile=null;
const OFFER_END=new Date("2026-09-27T23:59:59+06:00");
const REG_END=new Date("2026-10-04T23:59:59+06:00");

function currentFee(){return new Date()<=OFFER_END?299:499}
function registrationOpen(){return new Date()<=REG_END}

function show(name){
  if((name==="complete"||name==="community")&&!submitted)return;
  const target=document.getElementById("screen-"+name);
  if(!target)return;
  if(name==="payment") {applyCampaignState();renderPayment();}
  document.querySelectorAll(".screen").forEach(screen=>{
    const active=screen===target;
    screen.classList.toggle("active",active);
    screen.hidden=!active;
    screen.inert=!active;
  });
  window.scrollTo({top:0,behavior:"instant"});
  const heading=target.querySelector("h1,h2,.program-title");
  if(heading){heading.setAttribute("tabindex","-1");heading.focus({preventScroll:true});}
}

function makeRegistrationId(){
  const d=new Date();
  const y=String(d.getFullYear()).slice(-2);
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return "LGUH-"+y+m+day+"-"+crypto.randomUUID().slice(0,8).toUpperCase();
}

function setDateTimeDefaults(){
  const n=new Date();
  const date=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");
  const time=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");
  const d=document.getElementById("payment-date"),t=document.getElementById("payment-time");
  if(d&&!d.value)d.value=date;
  if(t&&!t.value)t.value=time;
}

function applyCampaignState(){
  const fee=currentFee();
  document.getElementById("offerFee").textContent="৳"+fee;
  document.getElementById("programFee").textContent="৳"+fee;
  document.getElementById("promoOffer").hidden=new Date()>OFFER_END;
  document.getElementById("offerStatus").textContent=new Date()<=OFFER_END?"Offer valid through 27 September 2026.":"Special offer ended. Regular support fee applies.";
  document.querySelector(".fee-row s").hidden=new Date()>OFFER_END;
  if(!registrationOpen()){
    ["landingStart","programStart","submitRegistration"].forEach(id=>{
      const b=document.getElementById(id);
      if(b){b.disabled=true;b.textContent="Registration Closed";}
    });
  }
}

function copyButton(value){return ' <button type="button" class="copy-btn" data-copy="'+value+'">Copy</button>'}

function renderPayment(){
  const fee=currentFee();
  document.querySelectorAll(".pay-card").forEach(b=>b.classList.toggle("active",b.dataset.method===selectedMethod));
  document.querySelectorAll(".pay-card").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.method===selectedMethod)));
  const box=document.getElementById("pay-detail");
  const mf=document.getElementById("method-field");
  const mw=document.getElementById("payment-mobile-wrap");
  const mi=document.getElementById("payment-mobile");
  const amount=document.getElementById("amount-paid");
  if(!box||!mf||!mw||!mi||!amount)return;
  mf.value=selectedMethod;

  if(selectedMethod==="bKash"){
    box.innerHTML='<b>bKash Payment Details</b><div class="kv"><span>Payment Method</span><b>Send Money</b><span>Number</span><b>01885603359 '+copyButton("01885603359")+'</b><span>Amount</span><b>৳'+fee+'</b></div><div class="notice">Please send the exact amount and provide the Transaction ID in the next step.</div>';
    mw.style.display="block";mi.required=true;amount.value=String(fee);
  }else if(selectedMethod==="Nagad"){
    box.innerHTML='<b>Nagad Payment Details</b><div class="kv"><span>Payment Method</span><b>Send Money</b><span>Number</span><b>01303498506 '+copyButton("01303498506")+'</b><span>Amount</span><b>৳'+fee+'</b></div><div class="notice">Please send the exact amount and provide the Transaction ID in the next step.</div>';
    mw.style.display="block";mi.required=true;amount.value=String(fee);
  }else if(selectedMethod==="Bank Transfer"){
    box.innerHTML='<b>Bank Transfer Details</b><div class="kv"><span>Bank</span><b>BRAC Bank PLC</b><span>Account Name</span><b>MD. NAHID ALOM</b><span>Account Number</span><b>1073658180001 '+copyButton("1073658180001")+'</b><span>Branch</span><b>RAJSHAHI BRANCH</b><span>Routing</span><b>060811934</b><span>SWIFT</span><b>BRAKBDDH</b><span>Amount</span><b>৳'+fee+'</b></div>';
    mw.style.display="none";mi.required=false;mi.value="";amount.value=String(fee);
  }else{
    box.innerHTML='<b>Redot Pay Details</b><div class="kv"><span>Pay ID</span><b>1164960686 '+copyButton("1164960686")+'</b><span>Amount</span><b>USD 2.50</b></div>';
    mw.style.display="none";mi.required=false;mi.value="";amount.value="2.50";
  }
}

document.addEventListener("click",async e=>{
  const nav=e.target.closest("[data-next]");
  if(nav){
    e.preventDefault();
    const next=nav.dataset.next;
    if((next==="details"||next==="verify")&&!registrationOpen()){
      alert("Registration deadline has ended.");
      return;
    }
    if(next==="verify"){applyCampaignState();renderPayment();setDateTimeDefaults();}
    show(next);
    return;
  }

  const pm=e.target.closest("[data-method]");
  if(pm){
    selectedMethod=pm.dataset.method;
    renderPayment();
    return;
  }

  const cp=e.target.closest("[data-copy]");
  if(cp){
    try{
      await navigator.clipboard.writeText(cp.dataset.copy);
      const old=cp.textContent;cp.textContent="Copied";
      setTimeout(()=>cp.textContent=old,1000);
    }catch{prompt("Copy this payment number:",cp.dataset.copy)}
  }
});

document.getElementById("participant-form")?.addEventListener("submit",e=>{
  e.preventDefault();
  if(!e.target.reportValidity())return;
  participantData=Object.fromEntries(new FormData(e.target).entries());
  show("support");
});

const receiptInput=document.getElementById("receipt");
document.getElementById("upload-area")?.addEventListener("click",()=>receiptInput?.click());
receiptInput?.addEventListener("change",()=>{
  const z=document.getElementById("upload-area");
  if(z&&receiptInput.files[0])z.childNodes[0].textContent="✓ "+receiptInput.files[0].name+" ";
});

document.getElementById("payment-form")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!e.target.reportValidity())return;
  if(!registrationOpen()){alert("Registration deadline has ended.");return}
  if(!sb){alert("The secure registration connection is unavailable. Please refresh and try again.");return}
  if(submitting||submitted)return;
  if(!participantData.full_name){show("details");return;}
  submitting=true;

  const btn=document.getElementById("submitRegistration");
  btn.disabled=true;
  show("processing");

  try{
    const paymentData=Object.fromEntries(new FormData(e.target).entries());
    registrationId=registrationId||makeRegistrationId();
    const receipt=receiptInput?.files?.[0]||null;
    let receiptPath=uploadedReceiptPath;

    if(receipt && receipt!==uploadedReceiptFile){
      if(!["image/png","image/jpeg","application/pdf"].includes(receipt.type))throw new Error("Please upload a PNG, JPG or PDF receipt.");
      if(receipt.size>5*1024*1024)throw new Error("Payment screenshot must be 5MB or smaller.");
      const ext=(receipt.name.split(".").pop()||"bin").toLowerCase();
      receiptPath=registrationId+"/"+crypto.randomUUID()+"."+ext;
      const {error:upErr}=await sb.storage.from("payment-receipts").upload(receiptPath,receipt,{upsert:false});
      if(upErr)throw upErr;
      uploadedReceiptPath=receiptPath;uploadedReceiptFile=receipt;
    }

    const row={
      registration_id:registrationId,
      full_name:participantData.full_name,
      age:Number(participantData.age),
      email:participantData.email,
      mobile:participantData.mobile,
      whatsapp:participantData.whatsapp,
      profession:participantData.profession,
      institution:participantData.institution||null,
      present_address:participantData.present_address,
      district:participantData.district,
      division:participantData.division,
      country:participantData.country||"Bangladesh",
      facebook_url:participantData.facebook_url||null,
      preferred_contact:participantData.preferred_contact||"WhatsApp",
      interested_topic:participantData.interested_topic,
      join_reason:participantData.join_reason||null,
      referral_source:participantData.referral_source||null,
      payment_method:selectedMethod,
      transaction_id:paymentData.transaction_id,
      payment_mobile:paymentData.payment_mobile||null,
      amount_paid:Number(paymentData.amount_paid||0),
      currency:selectedMethod==="Redot Pay"?"USD":"BDT",
      payment_date:paymentData.payment_date,
      payment_time:paymentData.payment_time,
      receipt_path:receiptPath,
      promo_code:new Date()<=OFFER_END?"lexbdhouston":null,
      payment_status:"Pending Verification",
      registration_status:"Pending Verification"
    };

    const {error}=await sb.from("houston_registrations").insert(row);
    if(error)throw error;
    submitted=true;

    document.getElementById("registration-id").textContent=registrationId;

    show("complete");
  }catch(err){
    console.error(err);
    alert("Submission failed: "+(err?.message||"Please try again."));
    show("verify");
  }finally{
    btn.disabled=false;
    submitting=false;
  }
});

show("landing");
document.getElementById("upload-area")?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();receiptInput.click();}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)applyCampaignState();});
applyCampaignState();
renderPayment();
setDateTimeDefaults();
