const cfg = window.LEXGLOBAL_CONFIG || {};
const configured =
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.includes("PASTE_") &&
  !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

const sb = configured
  ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;

let selectedMethod = "bKash";
let participantData = {};

function show(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById('screen-'+name);
  if(target) target.classList.add('active');
  window.scrollTo({top:0,behavior:'instant'});
}

document.addEventListener('click',e=>{
  const n=e.target.closest('[data-next]');
  if(n){
    e.preventDefault();
    show(n.dataset.next);
  }
});

document.getElementById('detailsForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!e.target.reportValidity()) return;
  participantData = Object.fromEntries(new FormData(e.target).entries());
  show('support');
});

function renderPay(){
  const d=document.getElementById('payDetail');
  const mf=document.getElementById('methodField');
  const pm=document.getElementById('payMobile');
  const pmi=document.getElementById('paymentMobileInput');
  const af=document.getElementById('amountField');

  mf.value=selectedMethod;
  document.querySelectorAll('.pay-card').forEach(b=>b.classList.toggle('active',b.dataset.method===selectedMethod));

  if(selectedMethod==='bKash'){
    d.innerHTML='<b>bKash Payment Details</b><div class="kv"><span>Payment Method</span><b>Send Money</b><span>Number</span><b>01885603359</b><span>Amount</span><b>৳299</b></div>';
    pm.style.display='block'; pmi.required=true; af.value='299';
  }
  if(selectedMethod==='Nagad'){
    d.innerHTML='<b>Nagad Payment Details</b><div class="kv"><span>Payment Method</span><b>Send Money</b><span>Number</span><b>01303498506</b><span>Amount</span><b>৳299</b></div>';
    pm.style.display='block'; pmi.required=true; af.value='299';
  }
  if(selectedMethod==='Bank Transfer'){
    d.innerHTML='<b>Bank Transfer Details</b><div class="kv"><span>Bank Name</span><b>BRAC Bank PLC</b><span>Account Name</span><b>MD. NAHID ALOM</b><span>Account Number</span><b>1073658180001</b><span>Branch</span><b>RAJSHAHI BRANCH</b><span>Routing Number</span><b>060811934</b><span>SWIFT Code</span><b>BRAKBDDH</b><span>Amount</span><b>৳299</b></div>';
    pm.style.display='none'; pmi.required=false; pmi.value=''; af.value='299';
  }
  if(selectedMethod==='Redot Pay'){
    d.innerHTML='<b>Redot Pay Details</b><div class="kv"><span>Pay ID</span><b>1164960686</b><span>Amount</span><b>USD 2.50</b></div>';
    pm.style.display='none'; pmi.required=false; pmi.value=''; af.value='2.50';
  }
}

document.querySelectorAll('.pay-card').forEach(b=>b.addEventListener('click',()=>{
  selectedMethod=b.dataset.method;
  renderPay();
}));
renderPay();

function makeRegistrationId(){
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const rand = Math.floor(10000 + Math.random()*90000);
  return `LGUH-${y}${m}${d}-${rand}`;
}

document.getElementById('verifyForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!e.target.reportValidity()) return;

  if(!configured){
    alert("Database is not connected yet. Add your Supabase URL and anon key in config.js before going live.");
    return;
  }

  show('processing');

  try{
    const paymentData = Object.fromEntries(new FormData(e.target).entries());
    const registrationId = makeRegistrationId();
    const receipt = document.getElementById('receiptFile').files[0];
    let receiptPath = null;

    if(receipt){
      const ext = (receipt.name.split('.').pop() || 'bin').toLowerCase();
      receiptPath = `${registrationId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('payment-receipts')
        .upload(receiptPath, receipt, { upsert:false });

      if(uploadError) throw uploadError;
    }

    const row = {
      registration_id: registrationId,
      full_name: participantData.full_name,
      email: participantData.email,
      mobile: participantData.mobile,
      whatsapp: participantData.whatsapp,
      profession: participantData.profession,
      institution: participantData.institution || null,
      district: participantData.district,
      country: participantData.country || 'Bangladesh',
      facebook_url: participantData.facebook_url || null,
      preferred_contact: participantData.preferred_contact || 'WhatsApp',
      payment_method: selectedMethod,
      transaction_id: paymentData.transaction_id,
      payment_mobile: paymentData.payment_mobile || null,
      amount_paid: Number(paymentData.amount_paid || 0),
      currency: selectedMethod === 'Redot Pay' ? 'USD' : 'BDT',
      payment_date: paymentData.payment_date,
      payment_time: paymentData.payment_time,
      receipt_path: receiptPath,
      promo_code: 'lexbdhouston',
      payment_status: 'Pending Verification',
      registration_status: 'Pending Verification'
    };

    const { error: insertError } = await sb
      .from('houston_registrations')
      .insert(row);

    if(insertError) throw insertError;

    document.getElementById('registrationId').textContent = registrationId;
    show('complete');
  } catch(err){
    console.error(err);
    alert("Submission failed: " + (err.message || "Please try again."));
    show('verify');
  }
});
