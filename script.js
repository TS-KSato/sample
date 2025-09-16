/* 法と設計のメモ
 - 個人情報保護法: クライアント側のみで処理（GitHub Pages）。サーバ保存なしデモ。
 - 消費者契約法: 入力6〜7項目、2分以内完了想定。
 - 刑法246条: 抑止文言を表示。
 - 資金決済法: 「対象ドメイン」「キャリア」「対象の決済番号」を必須化。
*/

const $ = (s) => document.querySelector(s);

/** タブ切替（メール/電話） */
(function setupTabs(){
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab=>{
    tab.addEventListener("click",()=>{
      tabs.forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      const targetSel = tab.getAttribute("data-target");
      document.querySelectorAll(".tabpane").forEach(p=>{
        if("#"+p.id===targetSel){ p.hidden=false; p.classList.add("active"); }
        else { p.hidden=true; p.classList.remove("active"); }
      });
    });
  });
})();

/** 同意ゲート */
(function consentGate(){
  const consent=$("#consent"), btn=$("#submitBtn");
  if(!consent||!btn) return;
  const update=()=>btn.disabled=!consent.checked;
  consent.addEventListener("change",update); update();
})();

/** キャリア選択に応じてラベルを動的変更（拡張済み） */
(function carrierDynamicLabel(){
  const carrier=$("#carrier"), label=$("#paymentIdLabel");
  const update=()=>{
    const v=carrier.value;
    // docomo/ahamo → 決済番号
    // au/povo/UQmobile → 継続課金ID
    // SoftBank/LINEMO → 注文番号
    if(v==="docomo"||v==="ahamo"){
      label.innerHTML='対象の決済番号（<b>docomo/ahamo: 決済番号</b>） <span class="req">必須</span>';
    }else if(v==="au"||v==="povo"||v==="UQmobile"){
      label.innerHTML='対象の決済番号（<b>au/povo/UQmobile: 継続課金ID</b>） <span class="req">必須</span>';
    }else if(v==="softbank"||v==="LINEMO"){
      label.innerHTML='対象の決済番号（<b>SoftBank/LINEMO: 注文番号</b>） <span class="req">必須</span>';
    }else{
      label.innerHTML='対象の決済番号 <span class="req">必須</span>';
    }
  };
  if(carrier){ carrier.addEventListener("change",update); update(); }
})();

/** 入力検証 */
function validateForm(){
  [
    "#err-targetDomain","#err-serviceName","#err-carrier","#err-paymentId",
    "#err-reason","#err-dob","#err-guardianName","#err-guardianRelation",
    "#err-guardianEmail","#err-guardianPhone","#err-consent"
  ].forEach(sel=>{ const el=$(sel); if(el) el.textContent=""; });

  const targetDomain=$("#targetDomain").value.trim();
  const serviceName=$("#serviceName").value.trim();
  const carrier=$("#carrier").value.trim();
  const paymentId=$("#paymentId").value.trim();
  const reason=(document.querySelector('input[name="reason"]:checked')||{}).value;
  const dob=$("#dob").value.trim();
  const guardianName=$("#guardianName").value.trim();
  const guardianRelation=$("#guardianRelation").value.trim();
  const guardianEmail=$("#guardianEmail").value.trim();
  const guardianPhone=$("#guardianPhone").value.trim();
  const consent=$("#consent").checked;

  let ok=true;

  // 対象ドメイン
  const extracted = extractHostname(targetDomain);
  if(!extracted){ ok=false; $("#err-targetDomain").textContent="対象ドメインを正しく入力してください（例: example.com）。"; }
  else if(!isValidDomain(extracted)){ ok=false; $("#err-targetDomain").textContent="ドメイン形式が正しくありません。"; }

  // サービス名
  if(!serviceName){ ok=false; $("#err-serviceName").textContent="サービス名を入力してください。"; }
  else if(serviceName.length>100){ ok=false; $("#err-serviceName").textContent="100文字以内で入力してください。"; }

  // キャリア
  if(!carrier){ ok=false; $("#err-carrier").textContent="キャリアを選択してください。"; }

  // 決済番号（緩め）
  if(!paymentId){ ok=false; $("#err-paymentId").textContent="対象の決済番号を入力してください。"; }
  else if(!/^[A-Za-z0-9\-_]+(?:[A-Za-z0-9\-_]+|[A-Za-z0-9\-_]+(?:-[A-Za-z0-9\-_]+)*)$/.test(paymentId)){
    ok=false; $("#err-paymentId").textContent="英数字・ハイフン・アンダースコアを用いて入力してください。";
  }

  // 返金理由
  if(!reason){ ok=false; $("#err-reason").textContent="返金理由を選択してください。"; }

  // 生年月日
  const dobResult = validateDOB(dob);
  if(!dobResult.valid){ ok=false; $("#err-dob").textContent=dobResult.message; }
  else if(!dobResult.isMinor){ ok=false; $("#err-dob").textContent="未成年者に該当しません。"; }

  // 親権者氏名
  if(!guardianName){ ok=false; $("#err-guardianName").textContent="親権者/保護者の氏名を入力してください。"; }

  // 関係
  if(!guardianRelation){ ok=false; $("#err-guardianRelation").textContent="未成年との関係を選択してください。"; }

  // 連絡先（メール or 電話）
  const emailOk = guardianEmail ? validateEmail(guardianEmail) : false;
  const phoneOk = guardianPhone ? validateJPPhone(guardianPhone) : false;
  if(!guardianEmail && !guardianPhone){
    ok=false;
    $("#err-guardianEmail").textContent="メールまたは電話のいずれかを入力してください。";
    $("#err-guardianPhone").textContent="メールまたは電話のいずれかを入力してください。";
  }else{
    if(guardianEmail && !emailOk){ ok=false; $("#err-guardianEmail").textContent="メール形式が正しくありません。"; }
    if(guardianPhone && !phoneOk){ ok=false; $("#err-guardianPhone").textContent="電話番号は +81-123-456-7890 形式で入力してください。"; }
  }

  // 同意
  if(!consent){ ok=false; $("#err-consent").textContent="同意が必要です。"; }

  return ok;
}

/** ドメイン抽出・検証 */
function extractHostname(input){
  if(!input) return "";
  let s = input.trim();
  try{
    if(/^https?:\/\//i.test(s)){ const u=new URL(s); return u.hostname; }
    s = s.replace(/^[a-z]+:\/\//i,"").split("/")[0];
    return s;
  }catch{ return ""; }
}
function isValidDomain(host){
  const re=/^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])\.)+[A-Za-z]{2,}$/;
  return re.test(host);
}

/** DOB 検証 */
function validateDOB(s){
  if(!/^\d{4}\/\d{2}\/\d{2}$/.test(s)){
    return {valid:false,message:"生年月日は YYYY/MM/DD 形式で入力してください。",isMinor:false};
  }
  const [y,m,d]=s.split("/").map(Number);
  if(y<1901||m<1||m>12||d<1||d>31){
    return {valid:false,message:"生年月日を正しく入力してください。",isMinor:false};
  }
  const dt=new Date(y,m-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d){
    return {valid:false,message:"生年月日を正しく入力してください。",isMinor:false};
  }
  const today=new Date();
  if(dt>today) return {valid:false,message:"未来の日付は指定できません。",isMinor:false};
  const threshold=new Date(today.getFullYear()-18,today.getMonth(),today.getDate());
  const isMinor = dt>threshold;
  return {valid:true,message:"",isMinor};
}

/** Email / Phone */
function validateEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function validateJPPhone(s){ return /^\+81-\d{1,4}-\d{1,4}-\d{3,4}$/.test(s); }

/** 簡易不正検知（1時間に3回以上で警告） */
function checkAbuseAndRecord(){
  const KEY="refund_submissions", now=Date.now(), H=3600000;
  let arr=[]; try{ arr=JSON.parse(sessionStorage.getItem(KEY)||"[]"); }catch{ arr=[]; }
  arr=arr.filter(ts=>now-ts<H); arr.push(now);
  sessionStorage.setItem(KEY,JSON.stringify(arr));
  if(arr.length>=3){ alert("短時間に複数の申請が確認されました。不正な申請は処理の対象外となる場合があります。"); }
}

/** 送信（mailto デフォルト。Google Formsはコメント参照） */
async function submitForm(e){
  e.preventDefault();
  if(!validateForm()) return;

  $("#submitNote").textContent="送信処理中…";
  checkAbuseAndRecord();

  const data=collectFormData();

  const recipient="support@refund.example.com";
  const subject=encodeURIComponent(`【返金申請】${data.serviceName} / ${data.carrier} / ${data.paymentId}`);
  const body=encodeURIComponent([
    "以下の内容で返金申請がありました：",
    `日時: ${new Date().toLocaleString()}`,
    `対象ドメイン: ${data.targetDomain}`,
    `サービス名: ${data.serviceName}`,
    `キャリア: ${data.carrier}`,
    `対象の決済番号: ${data.paymentId}`,
    `返金理由: ${data.reason}`,
    `生年月日: ${data.dob}`,
    `親権者氏名: ${data.guardianName}`,
    `未成年との関係: ${data.guardianRelation}`,
    `親権者連絡先: ${data.guardianEmail || data.guardianPhone}`,
    "",
    `UA: ${navigator.userAgent}`,
    `ページ: ${location.href}`
  ].join("\n"));
  const mailtoURL=`mailto:${recipient}?subject=${subject}&body=${body}`;
  window.location.href=mailtoURL;

  // Google Formsに切替したい場合（例）
  // const GOOGLE_FORMS_URL="https://docs.google.com/forms/d/e/XXXXXXXXXXXX/formResponse";
  // const params=new URLSearchParams({
  //   "entry.111111": data.targetDomain,
  //   "entry.222222": data.serviceName,
  //   "entry.333333": data.carrier,
  //   "entry.444444": data.paymentId,
  //   "entry.555555": data.reason,
  //   "entry.666666": data.dob,
  //   "entry.777777": data.guardianName,
  //   "entry.888888": data.guardianRelation,
  //   "entry.999999": data.guardianEmail || data.guardianPhone
  // });
  // window.location.href = `${GOOGLE_FORMS_URL}?${params.toString()}`;

  $("#submitNote").textContent="申請を受け付けました。通常3〜5営業日以内に結果を通知します。";
  $("#refundForm").reset();
  $("#submitBtn").disabled=true;
}

/** 値の収集（対象ドメインは抽出済みのホスト名に正規化） */
function collectFormData(){
  const reasonEl = document.querySelector('input[name="reason"]:checked');
  return {
    targetDomain: extractHostname($("#targetDomain").value.trim()),
    serviceName: $("#serviceName").value.trim(),
    carrier: $("#carrier").value.trim(),
    paymentId: $("#paymentId").value.trim(),
    reason: reasonEl ? reasonEl.value : "",
    dob: $("#dob").value.trim(),
    guardianName: $("#guardianName").value.trim(),
    guardianRelation: $("#guardianRelation").value.trim(),
    guardianEmail: $("#guardianEmail").value.trim(),
    guardianPhone: $("#guardianPhone").value.trim(),
  };
}

/** 入力補助 */
$("#dob").addEventListener("blur",()=>{
  const r=validateDOB($("#dob").value.trim());
  $("#err-dob").textContent=r.valid?"":r.message;
});

/** 送信 */
$("#refundForm").addEventListener("submit",submitForm);
