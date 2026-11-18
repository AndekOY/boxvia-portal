// Exercise AES-256-GCM archive path with synthetic data and ephemeral CI-only key.
// No real proof or key is persisted or uploaded by this test.
import {randomBytes,webcrypto,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const source='/tmp/hitl-minimax-portable-private.json';
const archive='/tmp/hitl-minimax-encrypted-artifact.json';
const recoveredPath='/tmp/hitl-minimax-synthetic-recovered.json';
if(fs.existsSync(source)||fs.existsSync(archive))throw Error('test_requires_clean_temp_paths');
const synthetic=JSON.stringify({format:'BOXVIA-HITL-MINIMAX-EVIDENCE-v1',synthetic:true});
try {
 fs.writeFileSync(source,synthetic,{mode:0o600});
 const key=randomBytes(32).toString('base64url');
 const run=spawnSync(process.execPath,['tests/hitl-minimax-encrypt-archive.mjs'],{env:{...process.env,HITL_ARCHIVE_AES256_KEY_B64URL:key},encoding:'utf8'});
 if(run.status!==0)throw Error('archive_encryption_test_failed: '+String(run.stderr||'').slice(0,1200));
 const data=JSON.parse(fs.readFileSync(archive,'utf8'));
 if(data.algorithm!=='AES-256-GCM'||data.format!=='BOXVIA-HITL-MINIMAX-ENCRYPTED-v1')throw Error('archive_format_invalid');
 const imported=await webcrypto.subtle.importKey('raw',Buffer.from(key,'base64url'),'AES-GCM',false,['decrypt']);
 const recovered=Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(data.iv,'base64url'),additionalData:new TextEncoder().encode(data.aad),tagLength:128},imported,Buffer.from(data.ciphertext,'base64url'))).toString();
 if(recovered!==synthetic)throw Error('archive_recovery_failed');
 const digest=createHash('sha256').update(synthetic).digest('hex');
 const restore=spawnSync(process.execPath,['tests/hitl-minimax-recover-archive.mjs',archive,recoveredPath,digest],{env:{...process.env,HITL_ARCHIVE_AES256_KEY_B64URL:key},encoding:'utf8'});
 if(restore.status!==0||fs.readFileSync(recoveredPath,'utf8')!==synthetic)throw Error('recovery_cli_failed');
 fs.rmSync(recoveredPath,{force:true});
 const wrongDigest=spawnSync(process.execPath,['tests/hitl-minimax-recover-archive.mjs',archive,recoveredPath,'0'.repeat(64)],{env:{...process.env,HITL_ARCHIVE_AES256_KEY_B64URL:key},encoding:'utf8'});
 if(wrongDigest.status===0||fs.existsSync(recoveredPath))throw Error('wrong_digest_recovery_accepted');
 const wrongKey=spawnSync(process.execPath,['tests/hitl-minimax-recover-archive.mjs',archive,recoveredPath,digest],{env:{...process.env,HITL_ARCHIVE_AES256_KEY_B64URL:randomBytes(32).toString('base64url')},encoding:'utf8'});
 if(wrongKey.status===0||fs.existsSync(recoveredPath))throw Error('wrong_key_cli_recovery_accepted');
 const modified={...data,ciphertext:(data.ciphertext[0]==='A'?'B':'A')+data.ciphertext.slice(1)};
 const modifiedPath='/tmp/hitl-minimax-synthetic-tampered.json';
 try {
  fs.writeFileSync(modifiedPath,JSON.stringify(modified),{mode:0o600});
  const tamper=spawnSync(process.execPath,['tests/hitl-minimax-recover-archive.mjs',modifiedPath,recoveredPath,digest],{env:{...process.env,HITL_ARCHIVE_AES256_KEY_B64URL:key},encoding:'utf8'});
  if(tamper.status===0||fs.existsSync(recoveredPath))throw Error('tampered_ciphertext_accepted');
 }finally{fs.rmSync(modifiedPath,{force:true})}
 let rejected=false;
 try {await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(data.iv,'base64url'),additionalData:new TextEncoder().encode(data.aad),tagLength:128},await webcrypto.subtle.importKey('raw',randomBytes(32),'AES-GCM',false,['decrypt']),Buffer.from(data.ciphertext,'base64url'))}catch{rejected=true}
 if(!rejected)throw Error('wrong_key_accepted');
 console.log('PASS synthetic encrypted archive roundtrip and wrong-key rejection');
} finally {fs.rmSync(source,{force:true});fs.rmSync(archive,{force:true});fs.rmSync(recoveredPath,{force:true})}
