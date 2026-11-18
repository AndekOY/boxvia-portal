// Strictly non-sensitive acceptance status for isolated Preview archive.
// Inputs: GitHub Actions artifact inventory JSON and external custody/restore evidence flags.
// Never infer archival acceptance from a successful workflow run alone.
import fs from 'node:fs';
const [inventoryPath]=process.argv.slice(2);
if(!inventoryPath)throw Error('artifact_inventory_required');
const inventory=JSON.parse(fs.readFileSync(inventoryPath,'utf8'));
if(!Array.isArray(inventory.artifacts))throw Error('invalid_artifact_inventory');
const candidates=inventory.artifacts.filter(a=>a.name==='hitl-minimax-encrypted-proof-preview'&&!a.expired&&Number(a.size_in_bytes)>0);
const uploaded=candidates.length===1;
const custody=process.env.HITL_EXTERNAL_KEY_CUSTODY_CONFIRMED==='true';
const restored=process.env.HITL_INDEPENDENT_RESTORE_CONFIRMED==='true';
const durable=process.env.HITL_INDEPENDENT_DURABLE_COPY_CONFIRMED==='true';
const accepted=uploaded&&custody&&restored&&durable;
const status={scope:'isolated-preview',archiveArtifactUploaded:uploaded,keyCustodyConfirmed:custody,independentRestoreConfirmed:restored,independentDurableCopyConfirmed:durable,archiveStatus:accepted?'PASS':'HOLD',sourceProvenance:'UNESTABLISHED',legacyGates:'HOLD',productionChanged:false};
console.log(JSON.stringify(status));
if(process.env.HITL_REQUIRE_ARCHIVE_PASS==='true'&&!accepted)process.exitCode=1;
