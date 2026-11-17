// Encrypt a private Preview proof package before any durable CI artifact upload.
// Requires a separately managed 32-byte AES key (base64url), never generated in CI.
import fs from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
const keyText=process.env.HITL_ARCHIVE_AES256_KEY_B64URL;
if(!keyText||!/^[A-Za-z0-9_-]{43}$/.test(keyText))throw Error('archive_key_not_configured');
const keyBytes=Buffer.from(keyText.replace(/-/g,'+').replace(/_/g,'/'),'base64');
if(keyBytes.length!==32)throw Error('archive_key_invalid');
const source='/tmp/hitl-minimax-portable-private.json';
const plain=fs.readFileSync(source);
const iv=webcrypto.getRandomValues(new Uint8Array(12));
const key=await webcrypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);
const aad=new TextEncoder().encode('BOXVIA-HITL-MINIMAX-EVIDENCE-v1');
const encrypted=Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,plain));
const out={format:'BOXVIA-HITL-MINIMAX-ENCRYPTED-v1',algorithm:'AES-256-GCM',aad:'BOXVIA-HITL-MINIMAX-EVIDENCE-v1',iv:Buffer.from(iv).toString('base64url'),ciphertext:encrypted.toString('base64url'),plaintextSha256:createHash('sha256').update(plain).digest('hex')};
fs.writeFileSync('/tmp/hitl-minimax-encrypted-artifact.json',JSON.stringify(out),{mode:0o600});
const recovered=Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,encrypted));
if(!recovered.equals(plain))throw Error('archive_roundtrip_failed');
console.log('PASS encrypted proof archive roundtrip; plaintext not uploaded');
