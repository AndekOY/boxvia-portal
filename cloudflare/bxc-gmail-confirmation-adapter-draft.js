// BXC Gmail API draft. No OAuth authorization, tokens or production wiring included.
// Explicitly isolated: never import into production; sandbox-only and allowlisted recipient.
// Gmail users.messages.send requires gmail.send OAuth scope and owner consent.
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCS=["terms","schedule","withdrawal","privacy"];
const CRLF="\r\n";
const b64=bytes=>{let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary)};
const utf8=s=>new TextEncoder().encode(s);
const url64=s=>b64(utf8(s)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const cleanHeader=s=>typeof s==="string"&&s.length>0&&!/[\r\n\x00-\x1f\x7f]/.test(s);
function mime(prepared,from){
 const boundary="bxc_"+crypto.randomUUID().replace(/-/g,"");
 const lines=[
  "From: "+from,"To: "+prepared.customerEmail,
  "Subject: =?UTF-8?B?"+b64(utf8(prepared.subject))+"?=",
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="'+boundary+'"',"",
  "--"+boundary,"Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: base64","",b64(utf8(prepared.body))
 ];
 for(const a of prepared.attachments){
  lines.push("--"+boundary,
   'Content-Type: text/plain; charset=UTF-8; name="'+a.filename+'"',
   'Content-Disposition: attachment; filename="'+a.filename+'"',
   "Content-Transfer-Encoding: base64","",b64(utf8(a.body)));
 }
 lines.push("--"+boundary+"--","");
 return url64(lines.join(CRLF));
}
export function createGmailConfirmationSenderDraft(env,{fetchImpl=fetch}={}){
 return async function sendReviewedEmail(prepared){
  if(env?.BXC_SANDBOX_ONLY!=="true"||env?.PAYPAL_ENV!=="sandbox"||
     env?.BXC_CONFIRMATION_PROVIDER!=="gmail"||env?.BXC_CONFIRMATION_EMAIL_ENABLED!=="true")
   throw Error("BXC Gmail sandbox dispatch disabled");
  const from=env.BXC_GMAIL_FROM,recipient=env.BXC_CONFIRMATION_TEST_RECIPIENT;
  if(from!=="andrzej.ekhmenin@gmail.com"||!EMAIL.test(from)||
     typeof recipient!=="string"||!EMAIL.test(recipient)||
     prepared?.customerEmail!==recipient||!EMAIL.test(prepared.customerEmail))
   throw Error("Gmail sender or sandbox recipient not authorized");
  if(typeof env.BXC_GMAIL_ACCESS_TOKEN!=="string"||!env.BXC_GMAIL_ACCESS_TOKEN.trim())
   throw Error("Owner-authorized Gmail OAuth access token missing");
  if(!cleanHeader(prepared.subject)||typeof prepared.body!=="string"||!prepared.body.trim()||
     !Array.isArray(prepared.attachments)||prepared.attachments.length!==DOCS.length||
     DOCS.some(id=>prepared.attachments.filter(a=>a.id===id).length!==1)||
     !/^[a-f0-9]{64}$/.test(prepared.snapshotSha256||""))
   throw Error("Complete verified contract confirmation required");
  for(const a of prepared.attachments){
   if(a.filename!=="BoxVia-"+a.id+".txt"||typeof a.body!=="string"||!a.body.trim()||
      !/^[a-f0-9]{64}$/.test(a.sha256||""))throw Error("Invalid contract attachment");
  }
  // Access token must be obtained via explicit Google OAuth consent outside this module.
  // No automatic refresh, no hidden credential capture, no retry on uncertain result.
  const response=await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{
   method:"POST",headers:{"Authorization":"Bearer "+env.BXC_GMAIL_ACCESS_TOKEN,
    "Content-Type":"application/json"},
   body:JSON.stringify({raw:mime(prepared,from)})
  });
  if(!response.ok)throw Error("Gmail API did not accept contract confirmation: HTTP "+response.status);
  const data=await response.json();
  if(typeof data?.id!=="string"||!data.id.trim())throw Error("Gmail message ID missing");
  return {accepted:true,providerMessageId:data.id};
 };
}
