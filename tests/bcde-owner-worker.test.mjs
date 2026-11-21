import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/bcde-owner-worker.mjs";
import {handleBcdeOwner} from "../cloudflare/bcde-owner-api.mjs";
const origin="https://boxvia-bcde-owner.andeks.workers.dev";
test("dedicated owner Worker denies anonymous access to page and API",async()=>{
 for(const path of ["/","/bcde-owner","/api/bcde/download?orderId=6a7bb765-5fb8-4a65-95be-8458e1bc7654"]){
  const r=await worker.fetch(new Request(origin+path),{});
  assert.equal(r.status,401);
  assert.equal(r.headers.get("Cache-Control"),"no-store");
 }
});
test("dedicated owner Worker rejects unsupported HTTP methods",async()=>{
 const r=await worker.fetch(new Request(origin+"/bcde-owner",{method:"DELETE"}),{});
 assert.equal(r.status,405);
});

test("BCDE owner API requires same-origin POST and permits GET without Origin before identity validation",async()=>{
 const env={DB:{},BCDE_ARCHIVE:{}};
 const id="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
 const get=await worker.fetch(new Request(origin+"/api/bcde/download?orderId="+id),env);
 assert.equal(get.status,401);
 const cross=await handleBcdeOwner(new Request(origin+"/api/bcde/download?orderId="+id,{headers:{"Origin":"https://evil.example"}}),env);
 assert.equal(cross.status,403);
 const crossSite=await handleBcdeOwner(new Request(origin+"/api/bcde/download?orderId="+id,{headers:{"Sec-Fetch-Site":"cross-site"}}),env);
 assert.equal(crossSite.status,403);
 const post=await handleBcdeOwner(new Request(origin+"/api/bcde/generate?orderId="+id,{method:"POST"}),env);
 assert.equal(post.status,403);
});
