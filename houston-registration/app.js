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
  if(name==="community"&&!submitted)return;
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

const paymentMethods={
  "bKash":{logo:"bkash.png",label:"bKash",instruction:"Send Money করতে হবে — Payment নয়।",destinationLabel:"bKash Number",number:"01885603359",mobile:true},
  "Nagad":{logo:"nagad.png",label:"Nagad",instruction:"Send Money করতে হবে — Payment নয়।",destinationLabel:"Nagad Number",number:"01303498506",mobile:true},
  "Bank Transfer":{logo:"brac-bank.jpg",label:"BRAC Bank Transfer",instruction:"নিচের ব্যাংক অ্যাকাউন্টে টাকা ট্রান্সফার করুন।",destinationLabel:"Account Number",number:"1073658180001",mobile:false},
  "Redot Pay":{logo:"redot-pay.jpg",label:"Redot Pay",instruction:"Send Money — নিচের Pay ID-তে পাঠান।",destinationLabel:"Redot Pay ID",number:"1164960686",mobile:false}
};

function renderPayment(){
  const method=paymentMethods[selectedMethod];
  if(!method)return;
  const fee=currentFee();
  const redot=selectedMethod==="Redot Pay";
  const displayAmount=redot?"USD 2.50":"৳"+fee;
  document.querySelectorAll(".pay-card").forEach(b=>{
    b.classList.toggle("active",b.dataset.method===selectedMethod);
    b.setAttribute("aria-pressed",String(b.dataset.method===selectedMethod));
  });
  document.getElementById("method-field").value=selectedMethod;
  const mobile=document.getElementById("payment-mobile");
  document.getElementById("payment-mobile-wrap").style.display=method.mobile?"block":"none";
  mobile.required=method.mobile;
  if(!method.mobile)mobile.value="";
  document.getElementById("amount-paid").value=redot?"2.50":String(fee);
  const bankDetails=selectedMethod==="Bank Transfer"?'<div class="bank-metadata"><p><b>Account Name:</b> MD. NAHID ALOM</p><p><b>Bank:</b> BRAC Bank PLC</p><p><b>Branch:</b> RAJSHAHI BRANCH</p><p><b>Routing:</b> 060811934 · <b>SWIFT:</b> BRAKBDDH</p></div>':"";
  document.getElementById("pay-detail").innerHTML=
    '<div class="payment-detail-heading"><img src="./assets/'+method.logo+'" alt=""><strong>'+method.label+'</strong></div>'+
    '<p class="payment-instruction">'+method.instruction+'</p>'+
    '<div class="payment-destination"><span>'+method.destinationLabel+'</span><div class="payment-number-row"><strong>'+method.number+'</strong>'+copyButton(method.number)+'</div></div>'+
    '<div class="payment-total"><span>Amount to Send</span><strong>'+displayAmount+'</strong></div>'+bankDetails+
    '<div class="notice">টাকা পাঠানোর পরে <b>I Have Paid</b> চাপুন এবং পরের ধাপে Transaction ID দিন।</div>';
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
    if(next==="verify"){applyCampaignState();renderPayment();}
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
      payment_date:null,
      payment_time:null,
      receipt_path:receiptPath,
      promo_code:new Date()<=OFFER_END?"lexbdhouston":null,
      payment_status:"Pending Verification",
      registration_status:"Pending Verification"
    };

    const {error}=await sb.from("houston_registrations").insert(row);
    if(error)throw error;
    submitted=true;

    document.getElementById("registration-id").textContent=registrationId;

    show("community");
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

