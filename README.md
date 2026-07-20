# Grant-Scoring Release Gate Record

This open package provides a machine-readable record for one release decision after a grant or public-funding first-pass assessment changes. It keeps four things connected without collapsing them into one score:

1. the baseline and candidate evaluation fingerprints;
2. the exact configuration change and its expected scope;
3. blinded independent reviewer-calibration evidence; and
4. the accountable human release and comparability decision.

The package complements a narrative release protocol with a JSON Schema, a fully fictional example and a zero-dependency contract validator.

## Files

| File | Purpose |
|---|---|
| `schema/grant-scoring-release-gate-record.schema.json` | JSON Schema Draft 2020-12 contract |
| `examples/fictional-bounded-pilot.json` | Fictional 24-case, two-reviewer decision record |
| `tests/validate-record.cjs` | Zero-dependency positive and negative contract checks |
| `LICENSE.md` | CC BY 4.0 reuse terms |

Run the checks with:

~~~bash
node tests/validate-record.cjs
~~~

## What the record preserves

Each fingerprint names the rubric and policy context, resolved configuration, prompt bundle, tool schema, few-shot set, model identity, evidence cutoff, pipeline commit and execution time. Hash-bearing fields use a `sha256:` prefix and a 64-character lowercase digest.

The change section records the old and new values, the reason, potentially affected criteria and applicant groups, and the human change owner. Similar aggregate averages are not accepted as evidence that two variants are comparable.

The calibration section requires 20–30 fictional or consented and de-identified cases, exactly two blind independent reviewers, label distributions, raw agreement, optional unweighted Cohen's kappa and a count of material and unresolved disagreements. Agreement is not correctness, and the statistic does not establish policy validity, fairness or model accuracy.

The disagreement agenda keeps the evidence locator, both reviewer states, candidate state, disagreement type, policy question, accountable owner and human outcome together. The candidate system cannot close its own disagreement.

The decision section separates `comparability` from `release_status`. A team can therefore record a bounded pilot while keeping the new variant separate, or mark it `non_comparable` without erasing the run. Programme-policy, eligibility and final-funding owners remain named human roles.

## Historical outcomes

The schema permits historical decisions only as `not_used`, `retrospective_separation` or `error_analysis`. Funded, declined or hidden outcomes include budgets, programme priorities, policy and human judgement; this package does not treat them as automatic ground-truth labels for who deserved funding.

## Boundaries and maker disclosure

This package does not define programme criteria, verify application evidence, validate a rubric, certify fairness, calculate a universal grant score, decide eligibility, rank applications, award funding or replace policy, procurement, legal, panel or full review. The fictional example values are workflow data, not target performance levels.

Disclosure: I work on DDScore at Playful Pixels Oy.

DDScore is separate analytical tooling. In an adjacent [structured evaluator review](https://www.ddscore.ai/for-evaluator/?utm_source=github-repository&utm_medium=referral&utm_campaign=ddscore-30d-jul-2026&utm_content=grant_scoring_release_gate_record_schema_a), it turns submitted private-company materials into a structured 0–100 analysis across 12 dimensions, checks relevant claims against current public sources and keeps confidence and named gaps visible. It supports the evaluator; programme fit and the final funding decision stay with people. This repository is not the DDScore output schema.

