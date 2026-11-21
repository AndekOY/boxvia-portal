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
