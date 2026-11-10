# BXC-PIZZA-TEST-REPORT-EXAMPLES-001
## Three worked customer-facing report specimens | v0.1
**SYNTHETIC TEST DATA ONLY — NOT REAL CLAIMS, SOURCES OR CUSTOMERS**
**2026-11-10 | INTERNAL / RELEASE HOLD**

# Example 1 — Check a Claim / SUPPORTED
**Object:** "The fictional PizzaBox API v1.2 supports CSV export."
**Source & Evidence:** PB-1, fictional PizzaBox API v1.2 manual §4: "Export formats: CSV, JSON." This excerpt was invented solely for testing.
**Assessment Boundary:** comparison of one claim against one synthetic manual excerpt; no live source or API was checked.
**Evidence Standing:** **SUPPORTED** (synthetic fixture only). CSV is explicitly listed in PB-1.
**Traceable Finding:** The provided fictional document supports the claim. No conclusion about an existing product is made.
**RU technical translation:** Вымышленный документ PB-1 прямо перечисляет CSV, поэтому утверждение подтверждено только в границах синтетического примера. Реальный API не проверялся.

# Example 2 — One Question Review / NOT SUPPORTED
**Object:** "Switching to the fictional vendor guarantees 30% cost savings in year one."
**Source & Evidence:** BQ-1 fictional cost inputs: current annual cost 10,000; proposed recurring cost 7,000; one-time transition cost 1,500.
**Assessment Boundary:** arithmetic under supplied assumptions; no real contract, invoice or price verification.
**Evidence Standing:** **NOT SUPPORTED**. First-year proposed cost is 8,500, so modeled savings are 1,500 / 10,000 = 15%, not 30%.
**Traceable Finding:** The proposed 30% first-year savings claim is inconsistent with BQ-1. Actual realized savings cannot be established from these synthetic inputs.
**RU technical translation:** В первый год предполагаемые расходы составляют 8 500 при исходных 10 000. Расчетная экономия равна 15%, поэтому утверждение о 30% экономии первого года не подтверждено. Фактический эффект неизвестен.

# Example 3 — Focused AI Governance Review / UNESTABLISHED
**Object:** "The fictional organization's AI monitoring control has been demonstrated to operate continuously."
**Source & Evidence:** GOV-1 fictional Policy v2 §7 states weekly monitoring is required; GOV-2 fictional Roles v1 §3 assigns ownership to Model Risk Lead. No execution evidence is provided.
**Assessment Boundary:** documentary evidence of policy design and assignment only; no operational testing.
**Evidence Standing:** **UNESTABLISHED**. Written requirements and assigned responsibility do not demonstrate performed monitoring.
**Traceable Finding:** Documentary design and ownership are supported; continuous operating effectiveness is not established.
**RU technical translation:** Документы подтверждают наличие требования мониторинга и назначение ответственного, но не содержат свидетельств фактического выполнения контроля. Вывод об устойчивой работе контроля не установлен.

## Specimen QA
Each example contains one assessed proposition, identified evidence, boundary, one status and a traceable finding. No external fact claims are made. They are not real customer deliverables and cannot demonstrate that deadlines or unit economics are achievable.
