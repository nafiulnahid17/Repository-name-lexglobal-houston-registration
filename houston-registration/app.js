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

function show(n){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("screen-" + n);
  if(target) target.classList.add("active");
  window.scrollTo({top:0, behavior:"instant"});
}

function makeRegistrationId(){
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth()+1).padStart(2,"0");
  const d = String(now.getDate()).padStart(2,"0");
  const rand = Math.floor(10000 + Math.random()*90000);
  return `LGUH-${y}${m}${d}-${rand}`;
}

function localPaymentDateTime(){
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth()+1).padStart(2,"0");
  const dd = String(now.getDate()).padStart(2,"0");
  const hh = String(now.getHours()).padStart(2,"0");
  const mi = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");
  return { payment_date:`${yyyy}-${mm}-${dd}`, payment_time:`${hh}:${mi}:${ss}` };
}

function getMethodLogo(method){
  const el = document.querySelector(`.pay[data-method="${CSS.escape(method)}"] .pay-logo`);
  return el ? el.src : "";
}

function paymentDetailCard(method, title, badge, rows, note){
  const logo = getMethodLogo(method);
  const amountRow = rows.find(r => r.type === "amount");
  const primaryRow = rows.find(r => ["Number","Account Number","Pay ID"].includes(r.key)) || rows.find(r => r.copy && r !== amountRow) || rows[0];
  const remainingRows = rows.filter(r => r !== amountRow && r !== primaryRow);
  const rowsHtml = remainingRows.map(r => `
    <div class="kv-row ${r.type === "amount" ? "amount-row" : ""}">
      <div class="left">
        <span class="k">${r.key}</span>
        <span class="v">${r.value}</span>
      </div>
      ${r.copy ? `<button type="button" class="copy-btn" data-copy="${String(r.copy).replace(/"/g,'&quot;')}">Copy</button>` : ""}
    </div>`).join("");

  return `
    <div class="pd-head">
      <div class="pay-highlight">
        <div class="brandline">
          <div class="pd-brand-main">
            ${logo ? `<img src="${logo}" alt="${method} logo">` : ""}
            <div class="pd-title-wrap">
              <h3>${title}</h3>
              <span class="pd-badge">${badge}</span>
            </div>
          </div>
          <span class="tag">Copy ready</span>
        </div>
        <div class="bigline">
          <div>
            <span class="label">${primaryRow ? primaryRow.key : "Details"}</span>
            <div class="number">${primaryRow ? primaryRow.value : method}</div>
          </div>
          <div class="amountbox">
            <span class="label">Amount</span>
            <div class="amount">${amountRow ? amountRow.value : ""}</div>
          </div>
        </div>
        <div class="highlight-actions">
          ${primaryRow && primaryRow.copy ? `<button type="button" class="copy-btn" data-copy="${String(primaryRow.copy).replace(/"/g,'&quot;')}">Copy ${primaryRow.key}</button>` : ""}
          ${amountRow && amountRow.copy ? `<button type="button" class="copy-btn" data-copy="${String(amountRow.copy).replace(/"/g,'&quot;')}">Copy Amount</button>` : ""}
        </div>
      </div>
    </div>
    <div class="pd-body"><div class="kv">${rowsHtml}</div></div>
    <div class="pd-note"><span class="i">i</span>${note}</div>`;
}

function renderPayment(){
  document.querySelectorAll(".pay").forEach(x => x.classList.toggle("active", x.dataset.method === selectedMethod));
  const box = document.getElementById("pay-detail");
  const mf = document.getElementById("method-field");
  const mobileWrap = document.getElementById("payment-mobile-wrap");
  const mobileInput = document.getElementById("payment-mobile");
  const amount = document.getElementById("amount-paid");
  if(!box || !mf || !mobileWrap || !mobileInput || !amount) return;

  mf.value = selectedMethod;

  if(selectedMethod === "bKash"){
    box.innerHTML = paymentDetailCard("bKash","bKash Payment Details","Selected Method",[
      {key:"Payment Method",value:"Send Money"},
      {key:"Number",value:"01885603359",copy:"01885603359"},
      {key:"Amount",value:"৳299",copy:"299",type:"amount"}
    ],"Please send the exact amount and then provide your Transaction ID in the next step.");
    mobileWrap.style.display = "block"; mobileInput.required = true; amount.value = "299";
  } else if(selectedMethod === "Nagad"){
    box.innerHTML = paymentDetailCard("Nagad","Nagad Payment Details","Selected Method",[
      {key:"Payment Method",value:"Send Money"},
      {key:"Number",value:"01303498506",copy:"01303498506"},
      {key:"Amount",value:"৳299",copy:"299",type:"amount"}
    ],"Please send the exact amount and then provide your Transaction ID in the next step.");
    mobileWrap.style.display = "block"; mobileInput.required = true; amount.value = "299";
  } else if(selectedMethod === "Bank Transfer"){
    box.innerHTML = paymentDetailCard("Bank Transfer","Bank Transfer Details","Selected Method",[
      {key:"Bank",value:"BRAC Bank PLC",copy:"BRAC Bank PLC"},
      {key:"Account Number",value:"1073658180001",copy:"1073658180001"},
      {key:"Account Name",value:"MD. NAHID ALOM",copy:"MD. NAHID ALOM"},
      {key:"Branch",value:"RAJSHAHI BRANCH"},
      {key:"Routing Number",value:"060811934",copy:"060811934"},
      {key:"SWIFT Code",value:"BRAKBDDH",copy:"BRAKBDDH"},
      {key:"Amount",value:"৳299",copy:"299",type:"amount"}
    ],"Please transfer the exact amount and then provide your Transaction ID / reference in the next step.");
    mobileWrap.style.display = "none"; mobileInput.required = false; mobileInput.value = ""; amount.value = "299";
  } else {
    box.innerHTML = paymentDetailCard("Redot Pay","Redot Pay Details","Selected Method",[
      {key:"Pay ID",value:"1164960686",copy:"1164960686"},
      {key:"Amount",value:"USD 2.50",copy:"2.50",type:"amount"}
    ],"Please pay the exact amount and then provide your Transaction ID / payment reference in the next step.");
    mobileWrap.style.display = "none"; mobileInput.required = false; mobileInput.value = ""; amount.value = "2.50";
  }
}

document.addEventListener("click", async e => {
  const go = e.target.closest("[data-go]");
  if(go){
    e.preventDefault();
    show(go.dataset.go);
    return;
  }

  const pay = e.target.closest("[data-method]");
  if(pay){
    selectedMethod = pay.dataset.method;
    renderPayment();
    return;
  }

  const copy = e.target.closest(".copy-btn");
  if(copy){
    const text = copy.dataset.copy || "";
    try{
      await navigator.clipboard.writeText(text);
      const old = copy.textContent;
      copy.textContent = "Copied";
      copy.classList.add("copied");
      setTimeout(()=>{copy.textContent=old;copy.classList.remove("copied")},1400);
    }catch{
      const t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
      const old = copy.textContent; copy.textContent="Copied"; copy.classList.add("copied");
      setTimeout(()=>{copy.textContent=old;copy.classList.remove("copied")},1400);
    }
  }
});

const participantForm = document.getElementById("participant-form");
participantForm.addEventListener("submit", e => {
  e.preventDefault();
  if(!e.target.reportValidity()) return;
  participantData = Object.fromEntries(new FormData(e.target).entries());
  show(3);
});

const methodField = document.getElementById("method-field");
methodField.addEventListener("change", e => {
  selectedMethod = e.target.value;
  renderPayment();
});

const uploadArea = document.querySelector(".upload");
const receiptInput = document.getElementById("receipt");
if(uploadArea && receiptInput){
  uploadArea.addEventListener("click", () => receiptInput.click());
}

const paymentForm = document.getElementById("payment-form");
paymentForm.addEventListener("submit", async e => {
  e.preventDefault();
  if(!e.target.reportValidity()) return;

  if(!configured){
    alert("Database is not connected. Please check config.js.");
    return;
  }

  show(6);

  try{
    const paymentData = Object.fromEntries(new FormData(e.target).entries());
    const registrationId = makeRegistrationId();
    const receipt = receiptInput?.files?.[0] || null;
    let receiptPath = null;

    if(receipt){
      if(receipt.size > 5 * 1024 * 1024) throw new Error("Payment screenshot must be 5MB or smaller.");
      const ext = (receipt.name.split(".").pop() || "bin").toLowerCase();
      receiptPath = `${registrationId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await sb.storage
        .from("payment-receipts")
        .upload(receiptPath, receipt, {upsert:false});
      if(uploadError) throw uploadError;
    }

    const autoTime = localPaymentDateTime();
    const row = {
      registration_id: registrationId,
      full_name: participantData.full_name,
      email: participantData.email,
      mobile: participantData.mobile,
      whatsapp: participantData.whatsapp,
      profession: participantData.profession,
      institution: participantData.institution || null,
      district: participantData.district,
      country: participantData.country || "Bangladesh",
      facebook_url: participantData.facebook_url || null,
      preferred_contact: participantData.preferred_contact || "WhatsApp",
      payment_method: selectedMethod,
      transaction_id: paymentData.transaction_id,
      payment_mobile: paymentData.payment_mobile || null,
      amount_paid: Number(paymentData.amount_paid || 0),
      currency: selectedMethod === "Redot Pay" ? "USD" : "BDT",
      payment_date: autoTime.payment_date,
      payment_time: autoTime.payment_time,
      receipt_path: receiptPath,
      promo_code: "lexbdhouston",
      payment_status: "Pending Verification",
      registration_status: "Pending Verification"
    };

    const { error: insertError } = await sb.from("houston_registrations").insert(row);
    if(insertError) throw insertError;

    await new Promise(r => setTimeout(r, 900));
    show(7);
  }catch(err){
    console.error(err);
    alert("Submission failed: " + (err?.message || "Please try again."));
    show(5);
  }
});

renderPayment();
