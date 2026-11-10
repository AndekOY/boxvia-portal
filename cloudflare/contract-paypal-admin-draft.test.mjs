import assert from "node:assert/strict";
import {handlePayPalReconciliationAdminDraft} from "./contract-paypal-admin-draft.js";
const url=new URL("https://example.test/api/admin/paypal/reconcile"),session="BXC_"+"a".repeat(64);
let writes=0,called=0,failAudit=false;
const env={PAYPAL_RECONCILIATION_ADMIN_ENABLED:"true",PAYPAL_RECONCILIATION_ADMIN_TOKEN:"secret",
 DB:{prepare(){return{bind(){return{async run(){writes++;return{success:!failAudit};}};}};}}};
const req=(token="secret")=>new Request(url,{method:"POST",headers:{"Origin":url.origin,"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({checkout_session_id:session,paypal_order_id:"PAYPAL-ORDER-123",incident_key:"incident-123"})});
const reconcile=async()=>{called++;return{closed:true,status:"linked"};};
assert.equal((await handlePayPalReconciliationAdminDraft(req("wrong"),env,url,{reconcile})).status,403);
assert.equal(called,0);
assert.equal((await handlePayPalReconciliationAdminDraft(req(),env,url,{reconcile})).status,200);
assert.equal(called,1);assert.equal(writes,2);
failAudit=true;
assert.equal((await handlePayPalReconciliationAdminDraft(req(),env,url,{reconcile})).status,503);
assert.equal(called,1);
assert.equal((await handlePayPalReconciliationAdminDraft(req(),{...env,PAYPAL_RECONCILIATION_ADMIN_ENABLED:"false"},url,{reconcile})).status,503);
console.log("PayPal admin audit and fail-closed tests passed");
