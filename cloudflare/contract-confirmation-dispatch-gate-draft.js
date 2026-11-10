// BXC sandbox draft: durable-medium delivery gate. NOT imported by production.
// No network calls, provider credentials or simulated success.
// The caller supplies a reviewed dispatch adapter only after legal/privacy review.
import { readAcceptedCheckoutDraft } from "./contract-checkout-acceptance-draft.js";
import { confirmationText } from "./contract-confirmation.js";
const REQUIRED = ["terms","schedule","withdrawal","privacy"];
const sha256 = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
export async function prepareDurableConfirmationDraft({db,orderId,documentBytesById}) {
  const accepted=await readAcceptedCheckoutDraft(db,orderId);
  if(!documentBytesById || typeof documentBytesById!=="object")throw Error("Reviewed document bytes required");
  const attachments=[];
  for(const id of REQUIRED){
    const body=documentBytesById[id];
    if(typeof body!=="string" || !body.trim())throw Error("Missing complete immutable document: "+id);
    const acceptedRef=accepted.snapshot.acceptedDocuments.find(x=>x.id===id);
    if(id!=="privacy" && (!acceptedRef || await sha256(body)!==acceptedRef.sha256))throw Error("Document bytes differ from accepted contract: "+id);
    attachments.push(Object.freeze({id,filename:"BoxVia-"+id+".txt",contentType:"text/plain; charset=utf-8",body,sha256:await sha256(body)}));
  }
  return Object.freeze({
    orderId,customerEmail:accepted.snapshot.customerEmail,
    subject:"BoxVia — Check a Claim contract confirmation",
    body:confirmationText(accepted.snapshot),
    attachments:Object.freeze(attachments),
    snapshotSha256:accepted.snapshotSha256
  });
}
export async function dispatchDurableConfirmationDraft({prepared,sendReviewedEmail}) {
  if(!prepared?.attachments || prepared.attachments.length!==REQUIRED.length ||
     typeof sendReviewedEmail!=="function")throw Error("Verified email dispatch adapter required");
  // Never mark delivery successful merely because a message was assembled.
  const result=await sendReviewedEmail(prepared);
  if(result?.accepted!==true || typeof result.providerMessageId!=="string" || !result.providerMessageId.trim())
    throw Error("Durable-medium dispatch not confirmed by provider");
  // Provider acceptance is not proof of inbox delivery. Persist receipt separately.
  return Object.freeze({orderId:prepared.orderId,providerMessageId:result.providerMessageId,
    providerAccepted:true,delivered:false,snapshotSha256:prepared.snapshotSha256});
}
