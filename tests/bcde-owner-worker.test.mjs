import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/bcde-owner-worker.mjs";
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
