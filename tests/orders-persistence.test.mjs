import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createFixedPriceOrder, getAuthorizedOrder } from "../cloudflare/orders-persistence.mjs";

globalThis.crypto ??= webcrypto;
class DB {
  constructor() { this.requests = new Map([[7, "one-question-review"], [8, "ai-governance-review"], [9, "pre-decision-review"], [10, "technical-pilot"]]); this.orders = new Map(); }
  prepare(sql) {
    const db=this, args={};
    return {
      bind(...values) { args.values=values; return this; },
      async first() {
        const v=args.values;
        if (sql.includes("FROM service_requests")) return db.requests.has(v[0]) ? { id:v[0], service_code:db.requests.get(v[0]) } : null;
        if (sql.includes("WHERE service_request_id")) return db.orders.get(v[0]) || null;
        if (sql.includes("WHERE id =")) return [...db.orders.values()].find(o=>o.id===v[0]) || null;
        throw new Error("Unknown query");
      },
      async run() {
        const [id,requestId,serviceCode,amountMinor,currency,capabilityHash]=args.values;
        if (db.orders.has(requestId)) return {success:true,meta:{changes:0}};
        db.orders.set(requestId,{id,service_code:serviceCode,amount_minor:amountMinor,currency,capability_hash:capabilityHash,status:"pending"});
        return {success:true,meta:{changes:1}};
      }
    };
  }
}
test("two fixed $50 services create once, with capability only on first response", async () => {
  const db=new DB();
  const a=await createFixedPriceOrder(db,{serviceRequestId:7,serviceCode:"one-question-review"});
  assert.equal(a.created,true);
  assert.equal(a.amountMinor,5000);
  assert.match(a.capability,/^[a-f0-9]{64}$/);
  const repeat=await createFixedPriceOrder(db,{serviceRequestId:7,serviceCode:"one-question-review"});
  assert.equal(repeat.created,false);
  assert.equal(repeat.capability,undefined);
  assert.equal(repeat.orderId,a.orderId);
  const authorized=await getAuthorizedOrder(db,a.orderId,a.capability);
  assert.equal(authorized?.status,"pending");
  assert.equal(authorized?.amountMinor,5000);
  assert.equal(await getAuthorizedOrder(db,a.orderId,"f".repeat(64)),null);
  const b=await createFixedPriceOrder(db,{serviceRequestId:8,serviceCode:"ai-governance-review"});
  assert.equal(b.amountMinor,5000);
});
test("reject mismatch and retired services", async () => {
  const db=new DB();
  await assert.rejects(createFixedPriceOrder(db,{serviceRequestId:7,serviceCode:"ai-governance-review"}),/mismatch/);
  await assert.rejects(createFixedPriceOrder(db,{serviceRequestId:7,serviceCode:"check-a-claim"}),/Only fixed-price/);
  await assert.rejects(createFixedPriceOrder(db,{serviceRequestId:99,serviceCode:"one-question-review"}),/mismatch/);
});

test("fixed $200 service uses catalog price, preserves capability authorization and idempotency", async () => {
  const db=new DB();
  const created=await createFixedPriceOrder(db,{serviceRequestId:9,serviceCode:"pre-decision-review"});
  assert.equal(created.created,true);
  assert.equal(created.amountMinor,20000);
  assert.equal(created.currency,"USD");
  assert.equal((await getAuthorizedOrder(db,created.orderId,created.capability))?.amountMinor,20000);
  const repeat=await createFixedPriceOrder(db,{serviceRequestId:9,serviceCode:"pre-decision-review"});
  assert.equal(repeat.created,false);
  assert.equal(repeat.capability,undefined);
  assert.equal(repeat.orderId,created.orderId);
});
test("quotation-first service cannot bypass accepted quote via fixed-price order",async()=>{
  const db=new DB();
  await assert.rejects(createFixedPriceOrder(db,{serviceRequestId:10,serviceCode:"technical-pilot"}),/Only fixed-price/);
  assert.equal(db.orders.size,0);
});
