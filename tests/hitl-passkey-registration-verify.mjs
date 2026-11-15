import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,createHash,randomBytes} from 'node:crypto';
const asUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const verifier=asUrl(readFileSync('cloudflare/hitl-webauthn-verify.js','utf8'));
const registration=asUrl(readFileSync('cloudflare/hitl-passkey-registration-verify.js','utf8').replace('./hitl-webauthn-verify.js',verifier));
const {verifyHitlRegistration}=await import(registration);
const {encodeBase64url}=await import(verifier);
const rpId='preview.example',origin='https://preview.example',challenge=encodeBase64url(randomBytes(32));
const {publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
const bytes=s=>Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'),'base64');
function head(major,n){if(n<24)return Buffer.from([major*32+n]);if(n<256)return Buffer.from([major*32+24,n]);return Buffer.from([major*32+25,n>>8,n&255])}
function cbor(x){if(typeof x==='number')return head(x>=0?0:1,x>=0?x:-1-x);if(typeof x==='string'){const b=Buffer.from(x);return Buffer.concat([head(3,b.length),b])}if(Buffer.isBuffer(x))return Buffer.concat([head(2,x.length),x]);if(x instanceof Map)return Buffer.concat([head(5,x.size),...Array.from(x,([k,v])=>[cbor(k),cbor(v)]).flat()]);throw Error('invalid')}
const credId=randomBytes(32);
const cose=cbor(new Map([[1,2],[3,-7],[-1,1],[-2,bytes(jwk.x)],[-3,bytes(jwk.y)]]));
const auth=Buffer.concat([createHash('sha256').update(rpId).digest(),Buffer.from([0x45,0,0,0,1]),Buffer.alloc(16),Buffer.from([0,credId.length]),credId,cose]);
const obj=cbor(new Map([['fmt','none'],['attStmt',new Map()],['authData',auth]]));
function credential(c=challenge,o=origin,a=auth){const att=cbor(new Map([['fmt','none'],['attStmt',new Map()],['authData',a]]));return {id:encodeBase64url(credId),rawId:encodeBase64url(credId),type:'public-key',response:{clientDataJSON:encodeBase64url(Buffer.from(JSON.stringify({type:'webauthn.create',challenge:c,origin:o}))),attestationObject:encodeBase64url(att)}}}
const args=c=>({credential:c,expectedChallenge:challenge,origin,rpId});
test('valid synthetic registration yields pending credential public key',async()=>{const v=await verifyHitlRegistration(args(credential()));assert.equal(v.credentialId,encodeBase64url(credId));assert.ok(v.publicKeySpki);assert.equal(v.signCount,1)});
test('wrong origin rejected',async()=>assert.rejects(()=>verifyHitlRegistration(args(credential(challenge,'https://other.example'))),/client_mismatch/));
test('wrong challenge rejected',async()=>assert.rejects(()=>verifyHitlRegistration(args(credential(encodeBase64url(randomBytes(32))))),/client_mismatch/));
test('missing UV rejected',async()=>{const a=Buffer.from(auth);a[32]=0x41;await assert.rejects(()=>verifyHitlRegistration(args(credential(challenge,origin,a))),/uv_or_attested_data_missing/)});
test('wrong RP hash rejected',async()=>{const a=Buffer.from(auth);a[0]^=1;await assert.rejects(()=>verifyHitlRegistration(args(credential(challenge,origin,a))),/rp_mismatch/)});
test('duplicate CBOR key rejected',async()=>{const bad=Buffer.concat([Buffer.from([0xa4]),cbor('fmt'),cbor('none'),cbor('fmt'),cbor('none'),cbor('attStmt'),cbor(new Map()),cbor('authData'),cbor(auth)]);const c=credential();c.response.attestationObject=encodeBase64url(bad);await assert.rejects(()=>verifyHitlRegistration(args(c)),/cbor_duplicate/)});
