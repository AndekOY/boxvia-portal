// Preview proof replay verifier. Requires trusted D1 proof/challenge records as inputs.
// WebAuthn signature covers the challenge, NOT the decision directly; the server-side
// challenge-to-decision record is an essential trust dependency.
import {decodeBase64url,verifyWebAuthnAssertion} from './hitl-webauthn-verify.js';
import {canonicalDecision,decisionDigest} from './hitl-minimax-canonical.js';
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
const sha=async text=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
export async function verifyMinimaxProofBundle({proof,bundle,challengeRecord,snapshot}) {
 if(!proof||!bundle||!challengeRecord||!snapshot)throw Error('missing_evidence');
 if(proof.id!==bundle.proof_id||proof.challenge_id!==challengeRecord.id||
    proof.credential_id!==challengeRecord.credential_id||proof.owner_id!==challengeRecord.owner_id||
    proof.decision_id!==challengeRecord.decision_id||proof.decision_version!==challengeRecord.decision_version||
    proof.case_id!==challengeRecord.case_id||proof.action!==challengeRecord.action||
    proof.snapshot_sha256!==challengeRecord.snapshot_sha256||proof.user_verified!==1||
    challengeRecord.state!=='CONSUMED')throw Error('evidence_record_mismatch');
 const canonical=canonicalDecision(snapshot,proof.action);
 if(bundle.canonical_decision!==canonical||await decisionDigest(snapshot,proof.action)!==proof.snapshot_sha256||
    snapshot.caseId!==proof.case_id||snapshot.decisionId!==proof.decision_id||snapshot.version!==proof.decision_version)
    throw Error('decision_binding_mismatch');
 if(bundle.rp_id!==challengeRecord.rp_id||bundle.origin!==challengeRecord.origin||
    await sha(bundle.challenge)!==challengeRecord.challenge_sha256)throw Error('challenge_binding_mismatch');
 if(!Number.isSafeInteger(bundle.sign_count_before)||bundle.sign_count_before<0||
    !Number.isSafeInteger(bundle.sign_count_after)||bundle.sign_count_after<0)throw Error('counter_invalid');
 const assertion={id:proof.credential_id,type:'public-key',response:{
   clientDataJSON:bundle.client_data_json,authenticatorData:bundle.authenticator_data,
   signature:bundle.signature,userHandle:null}};
 const verified=await verifyWebAuthnAssertion({assertion,
   expected:{challenge:bundle.challenge,origin:bundle.origin,rpId:bundle.rp_id,expiresAtMs:Number.MAX_SAFE_INTEGER},
   credential:{state:'ACTIVE',credentialId:proof.credential_id,rpId:bundle.rp_id,
     publicKeySpki:bundle.public_key_spki,signCount:bundle.sign_count_before}});
 if(verified.signCount!==bundle.sign_count_after)throw Error('counter_result_mismatch');
 // Does not independently authenticate the D1 record, credential enrollment, or signer identity.
 return {verified:true,proofId:proof.id,decisionId:proof.decision_id,action:proof.action,
   snapshotSha256:proof.snapshot_sha256,webAuthnSignatureVerified:true,
   recordProvenanceVerified:false,legacyGateAuthorized:false};
}
