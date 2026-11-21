import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {buildOrderTermsPdf,buildAcceptancePdf,sha256Bytes} from "../cloudflare/bcde-pdf.mjs";
import {archiveCommercialPack,downloadOwnerDocument} from "../cloudflare/bcde-archive.mjs";
globalThis.crypto??=webcrypto;
const id="6a7bb765-5fb8-4a65-95be-8458e1bc7654",digest="a".repeat(64);
test("two minimal PDFs contain expected order and acceptance evidence",async()=>{
 const a=buildOrderTermsPdf({orderId:id,service:"One Question Review",amountMinor:5000,currency:"USD",scope:"One question",deliverable:"Written report",deadline:"24 hours",termsVersion:"v1",offerVersion:"v1",confidentialityVersion:"v1"});
 const b=buildAcceptancePdf({orderId:id,termsDigest:digest,offerVersion:"v1",offerDigest:digest,offerAcceptedAt:"2026-11-21T09:00:00Z",confidentialityVersion:"v1",confidentialityDigest:digest,confidentialityAcceptedAt:"2026-11-21T09:01:00Z"});
 for(const pdf of [a,b]){assert.match(new TextDecoder().decode(pdf),/^%PDF-1.4/);assert.match(await sha256Bytes(pdf),/^[a-f0-9]{64}$/);}
 assert.match(new TextDecoder().decode(a),/USD 50.00/);
 assert.match(new TextDecoder().decode(b),/Acceptance Evidence Record/);
 assert.throws(()=>buildOrderTermsPdf({orderId:id,service:"Тест",amountMinor:5000,currency:"USD",scope:"x",deliverable:"x",deadline:"x",termsVersion:"v1",offerVersion:"v1",confidentialityVersion:"v1"}),/Unsupported PDF characters/);
});
test("archive writes manifest and refuses repeated version",async()=>{
 const data=new Uint8Array([37,80,68,70]),stored=new Map();
 const bucket={async head(k){return stored.has(k)?{etag:"existing"}:null;},async put(k,v){if(stored.has(k))return null;stored.set(k,v);return {etag:"ok"};},async get(k){return stored.get(k)??null;}};
 const x=await archiveCommercialPack(bucket,{orderId:id,termsPdf:data,termsDigest:digest});
 assert.equal(x.manifest.files.length,1);
 assert.equal((await downloadOwnerDocument(bucket,{orderId:id,termsDigest:digest,fileName:"01_ORDER_TERMS.pdf"})).byteLength,4);
 assert.equal(await downloadOwnerDocument(bucket,{orderId:id,termsDigest:digest,fileName:"../../secret"}),null);
 await assert.rejects(archiveCommercialPack(bucket,{orderId:id,termsPdf:data,termsDigest:digest}),/already exists/);
});
