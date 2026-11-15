import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign, createHash, randomBytes, webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
globalThis.crypto=webcrypto;
const code=readFileSync(new URL('../cloudflare/hitl-webauthn-verify.js',import.meta.url),'utf8');
const {verifyWebAuthnAssertion,encodeBase64url}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const rpId='boxvia-hitl-identity-hold-test.andeks.workers.dev';
const origin='https://'+rpId;
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const credential={credentialId:'synthetic-credential',rpId,state:'ACTIVE',signCount:0,publicKeySpki:encodeBase64url(publicKey.export({type:'spki',format:'der'}))};
const challenge=encodeBase64url(randomBytes(32));
const expected={rpId,origin,challenge,expiresAtMs:Date.now()+30000};
function make({flags=5,challengeValue=challenge,originValue=origin, rpValue=rpId,signKey=privateKey,counter=1}={}) {
 const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:challengeValue,origin:originValue,crossOrigin:false}));
 const auth=Buffer.alloc(37);createHash('sha256').update(rpValue).digest().copy(auth,0);auth[32]=flags;auth.writeUInt32BE(counter,33);
 const signature=sign('sha256',Buffer.concat([auth,createHash('sha256').update(client).digest()]),signKey);
 return {id:credential.credentialId,type:'public-key',response:{clientDataJSON:encodeBase64url(client),authenticatorData:encodeBase64url(auth),signature:encodeBase64url(signature)}};
}
test('valid UV signed assertion',async()=>assert.deepEqual(await verifyWebAuthnAssertion({assertion:make(),expected,credential}),{credentialId:credential.credentialId,signCount:1,userVerified:true}));
for (const [name,override] of [
 ['wrong challenge',{challengeValue:encodeBase64url(randomBytes(32))}],
 ['wrong origin',{originValue:'https://evil.example'}],
 ['wrong RP ID',{rpValue:'evil.example'}],
 ['missing UV',{flags:1}],
 ['missing UP',{flags:4}],
 ['counter replay',{counter:1}],
 ['invalid signature',{signKey:generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey}],
]) test(name,async()=>{
 const c=name==='counter replay'?{...credential,signCount:1}:credential;
 await assert.rejects(()=>verifyWebAuthnAssertion({assertion:make(override),expected,credential:c}));
});
test('expired challenge',async()=>assert.rejects(()=>verifyWebAuthnAssertion({assertion:make(),expected:{...expected,expiresAtMs:Date.now()-1},credential})));
test('revoked credential',async()=>assert.rejects(()=>verifyWebAuthnAssertion({assertion:make(),expected,credential:{...credential,state:'REVOKED'}})));
test('wrong credential ID',async()=>assert.rejects(()=>verifyWebAuthnAssertion({assertion:{...make(),id:'other'},expected,credential})));
