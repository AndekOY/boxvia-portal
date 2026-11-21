import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/bcde-owner-worker.mjs";
import {handleBcdeOwner} from "../cloudflare/bcde-owner-api.mjs";
import {probeBcdeR2} from "../cloudflare/bcde-r2-probe.mjs";
import {webcrypto} from "node:crypto";
globalThis.crypto??=webcrypto;
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

test("synthetic R2 diagnostic writes reads verifies and deletes",async()=>{
 const objects=new Map();
 const bucket={
  async put(k,data){assert.match(k,/^diagnostics\//);objects.set(k,new Uint8Array(data));return {etag:"ok"};},
  async get(k){const bytes=objects.get(k);return bytes?{arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}:null;},
  async delete(k){objects.delete(k);}
 };
 const result=await probeBcdeR2(bucket);
 assert.deepEqual(result,{write:true,read:true,sha256Verified:true,bytes:32});
 assert.equal(objects.size,0);
});
test("synthetic R2 diagnostic cleans up on corrupted read",async()=>{
 const objects=new Map();
 const bucket={
  async put(k,data){objects.set(k,new Uint8Array(data));return {etag:"ok"};},
  async get(){return {arrayBuffer:async()=>new Uint8Array(32).buffer};},
  async delete(k){objects.delete(k);}
 };
 await assert.rejects(probeBcdeR2(bucket),/R2 digest mismatch/);
 assert.equal(objects.size,0);
});
