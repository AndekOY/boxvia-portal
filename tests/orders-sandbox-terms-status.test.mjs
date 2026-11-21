import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/orders-sandbox-worker.mjs";

const origin="https://boxvia-orders-sandbox.andeks.workers.dev";
function request(path,body,headers={}){
 return new Request(origin+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...headers},body:JSON.stringify(body)});
}
test("terms-status rejects unauthenticated order and does not mutate D1",async()=>{
 let writes=0;
 const db={prepare(sql){assert.match(sql,/^SELECT /);return {bind(){return {async first(){return null;}}}};}};
 const response=await worker.fetch(request("/api/orders/terms-status",{orderId:"00000000-0000-4000-8000-000000000000",capability:"a".repeat(64)}),{
  DB:db,UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,404);
 assert.deepEqual(await response.json(),{error:"Not found"});
 assert.equal(writes,0);
});
test("terms-status rejects cross-origin requests before database access",async()=>{
 const response=await worker.fetch(request("/api/orders/terms-status",{},{"Origin":"https://other.invalid"}),{
  DB:{prepare(){throw Error("DB must not be accessed")}},
  UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,403);
});
test("terms-status does not expose data for invalid JSON",async()=>{
 const response=await worker.fetch(new Request(origin+"/api/orders/terms-status",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:"{"}),{
  DB:{prepare(){throw Error("DB must not be accessed")}},
  UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,400);
});

test("terms-preview rejects foreign origin before database access",async()=>{
 const response=await worker.fetch(request("/api/orders/terms-preview",{},{"Origin":"https://other.invalid"}),{
  DB:{prepare(){throw Error("DB must not be accessed")}},
  UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,403);
});
test("terms-preview rejects unauthenticated order without document disclosure",async()=>{
 const db={prepare(sql){assert.match(sql,/^SELECT /);return {bind(){return {async first(){return null;}}}};}};
 const response=await worker.fetch(request("/api/orders/terms-preview",{orderId:"00000000-0000-4000-8000-000000000000",capability:"a".repeat(64)}),{
  DB:db,UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,404);
 assert.deepEqual(await response.json(),{error:"Not found"});
});

test("terms-preview rejects a changed canonical scope before showing it",async()=>{
 const capability="a".repeat(64);
 const capabilityHash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(capability)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const id="00000000-0000-4000-8000-000000000000";
 const db={prepare(sql){return {bind(){return {async first(){
  if(sql.includes("FROM service_orders"))return {id,service_code:"one-question-review",amount_minor:5000,currency:"USD",status:"pending",capability_hash:capabilityHash};
  if(sql.includes("FROM order_document_sources"))return {scope_text:"CHANGED CANONICAL SCOPE",terms_version:"v1",terms_digest:"b".repeat(64),offer_text:"offer",offer_version:"v1",confidentiality_text:"conf",confidentiality_version:"v1",deliverable:"report",deadline:"24 hours"};
  throw Error("Unexpected read");
 }}}}}};
 const response=await worker.fetch(request("/api/orders/terms-preview",{orderId:id,capability}),{
  DB:db,UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false"
 });
 assert.equal(response.status,409);
 const body=await response.json();
 assert.equal(body.available,false);
 assert.equal(body.reason,"canonical_document_integrity_mismatch");
 assert.equal(JSON.stringify(body).includes("CHANGED CANONICAL SCOPE"),false);
});
