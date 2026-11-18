// Fail-closed synthetic acceptance matrix; no real archive or external attestation.
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'hitl-acceptance-'));
const flags=['HITL_EXTERNAL_KEY_CUSTODY_CONFIRMED','HITL_INDEPENDENT_RESTORE_CONFIRMED','HITL_INDEPENDENT_DURABLE_COPY_CONFIRMED'];
const run=(artifacts,values,strict=false)=>{
 const path=join(dir,'inventory.json');writeFileSync(path,JSON.stringify({artifacts}));
 const env={...process.env,...Object.fromEntries(flags.map((k,i)=>[k,values[i]?'true':'false'])),HITL_REQUIRE_ARCHIVE_PASS:strict?'true':'false'};
 const p=spawnSync(process.execPath,['tests/hitl-minimax-archive-acceptance.mjs',path],{env,encoding:'utf8'});
 if(!p.stdout.trim())throw Error('acceptance_output_missing');
 const result=JSON.parse(p.stdout.trim());
 return {code:p.status,result};
};
const artifact={name:'hitl-minimax-encrypted-proof-preview',expired:false,size_in_bytes:100};
try{
 for(const [label,inventory,flagsValue,expected] of [
  ['missing',[],[true,true,true],false],
  ['expired',[{...artifact,expired:true}],[true,true,true],false],
  ['zero-byte',[{...artifact,size_in_bytes:0}],[true,true,true],false],
  ['duplicate',[artifact,artifact],[true,true,true],false],
  ['no-custody',[artifact],[false,true,true],false],
  ['no-restore',[artifact],[true,false,true],false],
  ['no-durable-copy',[artifact],[true,true,false],false],
  ['all-asserted',[artifact],[true,true,true],true]
 ]){
  const normal=run(inventory,flagsValue);
  if(normal.code!==0||(normal.result.archiveStatus==='PASS')!==expected||normal.result.sourceProvenance!=='UNESTABLISHED'||normal.result.legacyGates!=='HOLD'||normal.result.productionChanged!==false)throw Error('acceptance_matrix_failed_'+label);
  const strict=run(inventory,flagsValue,true);
  if((strict.code===0)!==expected)throw Error('strict_gate_failed_'+label);
 }
 console.log('PASS synthetic archive acceptance matrix; asserted flags are not independent evidence');
}finally{rmSync(dir,{recursive:true,force:true})}
