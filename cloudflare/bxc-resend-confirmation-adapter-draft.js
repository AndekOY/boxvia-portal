// BXC DRAFT ONLY — isolated Resend adapter for durable-medium contract confirmation.
// Not imported by production worker or sandbox entrypoint. Never send without explicit opt-in.
// Resend provider acceptance is not proof of mailbox delivery.
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCUMENT_IDS=["terms","schedule","withdrawal","privacy"];
function base64Utf8(text){
 const bytes=new TextEncoder().encode(text);
 let binary="";
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
}
export function createResendConfirmationSenderDraft(env,{fetchImpl=fetch}={}){
 return async function sendReviewedEmail(prepared){
  if(env?.BXC_SANDBOX_ONLY!=="true" || env?.BXC_CONFIRMATION_EMAIL_ENABLED!=="true" ||
     env?.BXC_CONFIRMATION_PROVIDER!=="resend" || env?.PAYPAL_ENV!=="sandbox")
   throw Error("BXC sandbox confirmation dispatch disabled");
  if(typeof env.RESEND_API_KEY!=="string" || !env.RESEND_API_KEY ||
     typeof env.BXC_CONFIRMATION_FROM!=="string" || !EMAIL.test(env.BXC_CONFIRMATION_FROM))
   throw Error("Resend credentials or verified sender not configured");
  if(typeof env.BXC_CONFIRMATION_TEST_RECIPIENT!=="string" ||
     !EMAIL.test(env.BXC_CONFIRMATION_TEST_RECIPIENT))
   throw Error("Dedicated sandbox recipient allowlist missing");
  if(!prepared || prepared.customerEmail!==env.BXC_CONFIRMATION_TEST_RECIPIENT ||
     !EMAIL.test(prepared.customerEmail) || !prepared.orderId ||
     typeof prepared.body!=="string" || !prepared.body.trim() ||
     !Array.isArray(prepared.attachments) ||
     prepared.attachments.length!==DOCUMENT_IDS.length ||
     DOCUMENT_IDS.some(id=>prepared.attachments.filter(a=>a.id===id).length!==1))
   throw Error("Sandbox recipient or complete confirmation package invalid");
  if(env.BXC_CONFIRMATION_REPLY_TO!=="andrzej.ekhmenin@gmail.com")
   throw Error("Owner-approved BoxVia reply-to address not configured");
  if(/@gmail\.com$/i.test(env.BXC_CONFIRMATION_FROM))
   throw Error("Unverified consumer Gmail domain cannot be used as Resend From");
  const attachments=prepared.attachments.map(a=>{
   if(typeof a.body!=="string" || !a.body.trim() || typeof a.filename!=="string" ||
      !/^BoxVia-(terms|schedule|withdrawal|privacy)\.txt$/.test(a.filename))
    throw Error("Invalid immutable confirmation attachment");
   return {filename:a.filename,content:base64Utf8(a.body)};
  });
  const res=await fetchImpl("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json",
    "Idempotency-Key":"bxc-confirm-"+prepared.orderId+"-"+prepared.snapshotSha256},
   body:JSON.stringify({
    from:env.BXC_CONFIRMATION_FROM,
    reply_to:env.BXC_CONFIRMATION_REPLY_TO,
    to:[prepared.customerEmail],
    subject:prepared.subject,
    text:prepared.body,
    attachments
   })
  });
  if(res.status!==200 && res.status!==201)throw Error("Resend confirmation request not accepted: HTTP "+res.status);
  const data=await res.json();
  if(typeof data?.id!=="string" || !data.id.trim())throw Error("Resend did not return message ID");
  return {accepted:true,providerMessageId:data.id};
 };
}
