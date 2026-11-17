// Independent approval evaluation only. No HTTP route, no D1 state mutation.
// Preview HOLD: no approver identity is configured and no activation is performed.
const deny=(reason)=>({decision:"HOLD",reason,mayActivate:false,hitlAuthorization:false});
export function evaluateIndependentActivation(input) {
  if(!input||typeof input!=="object")return deny("INVALID_INPUT");
  const {request,credential,owner,approver,evidence}=input;
  if(!request||request.action!=="ACTIVATION_REQUESTED"||request.from_state!=="PENDING"||request.to_state!=="PENDING")return deny("NO_VALID_REQUEST");
  if(!credential||credential.state!=="PENDING"||credential.credential_id!==request.credential_id||credential.owner_id!==request.owner_id)return deny("CREDENTIAL_MISMATCH");
  if(!owner||owner.id!==request.owner_id)return deny("OWNER_MISMATCH");
  if(!approver||approver.verified!==true||approver.role!=="INDEPENDENT_APPROVER"||typeof approver.id!=="string"||!approver.id)return deny("APPROVER_UNVERIFIED");
  if(approver.id===owner.id||approver.email?.toLowerCase()===owner.email?.toLowerCase())return deny("SELF_APPROVAL");
  if(!evidence||evidence.requestId!==request.id||evidence.credentialId!==credential.credential_id||typeof evidence.reference!=="string"||!evidence.reference.trim()||evidence.explicitDecision!=="APPROVE")return deny("EVIDENCE_MISMATCH");
  // Passing policy checks is NOT authority to change state; separate authorized transaction is required.
  return {decision:"REVIEW_READY",reason:"INDEPENDENT_REVIEW_REQUIREMENTS_MET",mayActivate:false,hitlAuthorization:false};
}
