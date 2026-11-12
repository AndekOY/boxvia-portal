# BoxVia website text

Use one sentence per paragraph in visible page content and status messages.

Keep public text in English, clear enough to understand in 10-15 seconds.

Use a hyphen instead of an en dash or em dash in prose.

Preserve links, inline formatting, accessibility attributes and payment behavior when editing text.

Write assessment outcome names in uppercase, including SUPPORTED, NOT SUPPORTED and UNESTABLISHED.

## Evidence-first engineering and incident response (mandatory)

1. Establish facts from primary evidence: current source code, deployed configuration, runtime logs, actual database schema, reproducible requests, and test outputs.
2. Clearly label every claim as CONFIRMED, UNVERIFIED, FAILED, or NOT TESTED where status matters. A hypothesis is never a confirmed root cause.
3. Diagnose the actual failing stage and root cause before modifying code, configuration, secrets, databases, or deployment workflows. When evidence is insufficient, collect targeted evidence instead of guessing.
4. Prefer minimal, scoped changes that directly address a confirmed failure. Do not modify unrelated components or relax security controls as a workaround.
5. Verify each fix with relevant automated tests and an end-to-end functional check. A successful build, deployment, or presence of a secret is not proof of functional correctness.
6. Do not repeat the same unsuccessful submit/deploy cycle without new evidence that changes the diagnosis.
7. State explicitly what was inspected, what was changed, what passed, what remains unverified, and which environment was affected.
8. Keep Preview/sandbox isolated from Production. Do not change Production or rotate secrets without explicit authorization.
9. Never claim that an action, verification, or root-cause analysis succeeded unless tool output or a direct user-provided result supports it.
10. For incident reports, record the evidence-to-cause-to-fix-to-verification chain. If the causal chain is incomplete, say so.

This protocol is mandatory for BoxVia repository work and overrides any temptation to present speculative explanations as established facts.
