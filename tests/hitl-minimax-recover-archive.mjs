// Recovery-only decryption of a private encrypted Preview evidence artifact.
// Requires separately held HITL_ARCHIVE_AES256_KEY_B64URL and an explicit output path.
// Never print plaintext, key, or decrypted authentication records.
import fs from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
const [archivePath,outputPath,expectedDigest]=process.argv.slice(2);
if(!archivePath||!outputPath||!/^[a-f0-9]{64}$/.test(expectedDigest||''))throw Error('archive_output_and_expected_digest_required');
const keyText=process.env.HITL_ARCHIVE_AES256_KEY_B64URL;
if(!keyText||!/^[A-Za-z0-9_-]{43}$/.test(keyText))throw Error('archive_recovery_key_required');
const keyBytes=Buffer.from(keyText,'base64url');
if(keyBytes.length!==32)throw Error('invalid_recovery_key');
const a=JSON.parse(fs.readFileSync(archivePath,'utf8'));
if(a.format!=='BOXVIA-HITL-MINIMAX-ENCRYPTED-v1'||a.algorithm!=='AES-256-GCM'||a.aad!=='BOXVIA-HITL-MINIMAX-EVIDENCE-v1'||!/^[a-f0-9]{64}$/.test(a.plaintextSha256||'')||!(/^[A-Za-z0-9_-]{16}$/.test(a.iv||'')))throw Error('invalid_archive_metadata');
if(a.plaintextSha256!==expectedDigest)throw Error('archive_digest_not_anchored');
const key=await webcrypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['decrypt']);
const plain=Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(a.iv,'base64url'),additionalData:new TextEncoder().encode(a.aad),tagLength:128},key,Buffer.from(a.ciphertext,'base64url')));
if(createHash('sha256').update(plain).digest('hex')!==expectedDigest)throw Error('decrypted_digest_mismatch');
const parsed=JSON.parse(plain.toString('utf8'));
if(parsed.format!=='BOXVIA-HITL-MINIMAX-EVIDENCE-v1'||JSON.stringify(parsed)!==plain.toString('utf8'))throw Error('decrypted_package_invalid');
fs.writeFileSync(outputPath,plain,{flag:'wx',mode:0o600});
console.log('PASS authenticated archive recovery and anchored SHA-256; run offline WebAuthn verifier separately; provenance UNESTABLISHED');
