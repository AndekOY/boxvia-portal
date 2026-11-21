import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {verifyBcdeAccess} from "../cloudflare/bcde-access.mjs";
globalThis.crypto??=webcrypto;
const env={BCDE_ACCESS_TEAM_DOMAIN:"example.cloudflareaccess.com",BCDE_ACCESS_AUD:"bcde-app",BCDE_OWNER_EMAIL:"owner@example.com"};
const b64=x=>Buffer.from(typeof x==="string"?x:JSON.stringify(x)).toString("base64url");
async function fixture(){
 const pair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const jwk={...await crypto.subtle.exportKey("jwk",pair.publicKey),kid:"kid-1",alg:"RS256",use:"sig"};
 const fetchKeys=async()=>({ok:true,json:async()=>({keys:[jwk]})});
 async function request(overrides={}){
  const now=Math.floor(Date.now()/1000);
  const head=b64({alg:"RS256",typ:"JWT",kid:"kid-1"});
  const body=b64({iss:"https://example.cloudflareaccess.com",aud:["bcde-app"],email:"owner@example.com",iat:now-10,exp:now+600,...overrides});
  const payload=head+"."+body;
  const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",pair.privateKey,new TextEncoder().encode(payload));
  return new Request("https://sandbox.example/bcde-owner",{headers:{"Cf-Access-Jwt-Assertion":payload+"."+Buffer.from(sig).toString("base64url")}});
 }
 return {request,fetchKeys};
}
test("accepts valid signed owner JWT",async()=>{const f=await fixture();assert.equal(await verifyBcdeAccess(await f.request(),env,{fetchKeys:f.fetchKeys}),true);});
test("rejects wrong audience, email, issuer and expiry",async()=>{const f=await fixture();for(const payload of [{aud:["other"]},{email:"other@example.com"},{iss:"https://evil.example"},{exp:1}])assert.equal(await verifyBcdeAccess(await f.request(payload),env,{fetchKeys:f.fetchKeys}),false);});
test("rejects unsigned header and missing configuration",async()=>{const f=await fixture();const req=await f.request();assert.equal(await verifyBcdeAccess(req,{}, {fetchKeys:f.fetchKeys}),false);assert.equal(await verifyBcdeAccess(new Request(req.url),env,{fetchKeys:f.fetchKeys}),false);});
