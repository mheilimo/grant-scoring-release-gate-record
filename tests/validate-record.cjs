#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "schema", "grant-scoring-release-gate-record.schema.json"), "utf8"));
const example = JSON.parse(fs.readFileSync(path.join(root, "examples", "fictional-bounded-pilot.json"), "utf8"));
const hashPattern = /^sha256:[0-9a-f]{64}$/;
const commitPattern = /^[0-9a-f]{40}$/;
const dateTime = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

function validateRecord(record) {
  const errors = [];
  const required = schema.required;
  for (const field of required) if (!(field in record)) errors.push(`missing:${field}`);
  if (record.schema_version !== "1.0.0") errors.push("schema_version");
  if (!nonEmpty(record.record_id)) errors.push("record_id");
  if (!dateTime(record.created_at)) errors.push("created_at");

  for (const name of ["baseline_fingerprint", "candidate_fingerprint"]) {
    const value = record[name] || {};
    for (const field of ["rubric_version", "policy_context", "model_identity"]) {
      if (!nonEmpty(value[field])) errors.push(`${name}.${field}`);
    }
    for (const field of ["resolved_config_sha256", "prompt_bundle_sha256", "tool_schema_sha256", "few_shot_set_sha256"]) {
      if (!hashPattern.test(value[field] || "")) errors.push(`${name}.${field}`);
    }
    if (!commitPattern.test(value.pipeline_commit || "")) errors.push(`${name}.pipeline_commit`);
    if (!dateTime(value.evidence_cutoff)) errors.push(`${name}.evidence_cutoff`);
    if (!dateTime(value.executed_at)) errors.push(`${name}.executed_at`);
  }

  const change = record.change || {};
  if (!nonEmpty(change.reason)) errors.push("change.reason");
  if (!Array.isArray(change.changed_fields) || change.changed_fields.length === 0) errors.push("change.changed_fields");
  if (!Array.isArray(change.affected_criteria) || change.affected_criteria.length === 0) errors.push("change.affected_criteria");
  if (!Array.isArray(change.affected_applicant_groups) || change.affected_applicant_groups.length === 0) errors.push("change.affected_applicant_groups");
  if (!nonEmpty(change.human_change_owner)) errors.push("change.human_change_owner");

  const calibration = record.calibration || {};
  if (!new Set(["fictional", "consented_deidentified", "mixed"]).has(calibration.case_basis)) errors.push("calibration.case_basis");
  if (!Number.isInteger(calibration.case_count) || calibration.case_count < 20 || calibration.case_count > 30) errors.push("calibration.case_count");
  if (calibration.reviewer_count !== 2) errors.push("calibration.reviewer_count");
  if (calibration.blind_independent_labels !== true) errors.push("calibration.blind_independent_labels");
  if (typeof calibration.raw_agreement !== "number" || calibration.raw_agreement < 0 || calibration.raw_agreement > 1) errors.push("calibration.raw_agreement");
  if (calibration.cohens_kappa_unweighted !== null && (typeof calibration.cohens_kappa_unweighted !== "number" || calibration.cohens_kappa_unweighted < -1 || calibration.cohens_kappa_unweighted > 1)) errors.push("calibration.cohens_kappa_unweighted");
  if (!Number.isInteger(calibration.material_disagreements) || calibration.material_disagreements < 0) errors.push("calibration.material_disagreements");
  if (!Number.isInteger(calibration.unresolved_material_disagreements) || calibration.unresolved_material_disagreements < 0 || calibration.unresolved_material_disagreements > calibration.material_disagreements) errors.push("calibration.unresolved_material_disagreements");

  if (!Array.isArray(record.disagreement_agenda)) errors.push("disagreement_agenda");
  for (const [index, item] of (record.disagreement_agenda || []).entries()) {
    for (const field of ["case_id", "criterion_id", "evidence_locator", "reviewer_a_state", "reviewer_b_state", "candidate_state", "accountable_owner", "human_outcome"]) {
      if (!nonEmpty(item[field])) errors.push(`disagreement_agenda.${index}.${field}`);
    }
    if (!new Set(["definition", "missing_evidence", "conflicting_evidence", "time_boundary", "scope", "extraction", "policy"]).has(item.disagreement_type)) errors.push(`disagreement_agenda.${index}.disagreement_type`);
  }

  if (!new Set(["not_used", "retrospective_separation", "error_analysis"]).has(record.historical_outcome_use)) errors.push("historical_outcome_use");
  const decision = record.decision || {};
  if (!new Set(["comparable", "recomputed", "separate_variant", "non_comparable", "retired"]).has(decision.comparability)) errors.push("decision.comparability");
  if (!new Set(["rejected", "bounded_pilot", "released"]).has(decision.release_status)) errors.push("decision.release_status");
  for (const field of ["human_owner", "programme_policy_owner", "eligibility_owner", "final_funding_decision_owner", "decision_note"]) {
    if (!nonEmpty(decision[field])) errors.push(`decision.${field}`);
  }
  if (!dateTime(decision.decided_at)) errors.push("decision.decided_at");
  return errors;
}

assert.deepEqual(validateRecord(example), []);
assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.additionalProperties, false);
assert.deepEqual(schema.properties.historical_outcome_use.enum, ["not_used", "retrospective_separation", "error_analysis"]);
assert.equal(schema.$defs.calibration.properties.case_count.minimum, 20);
assert.equal(schema.$defs.calibration.properties.case_count.maximum, 30);
assert.equal(schema.$defs.calibration.properties.reviewer_count.const, 2);
assert.equal(schema.$defs.calibration.properties.blind_independent_labels.const, true);

const mutate = (callback) => { const clone = structuredClone(example); callback(clone); return validateRecord(clone); };
assert.ok(mutate((value) => { value.candidate_fingerprint.prompt_bundle_sha256 = "sha256:not-a-hash"; }).includes("candidate_fingerprint.prompt_bundle_sha256"));
assert.ok(mutate((value) => { value.calibration.case_count = 31; }).includes("calibration.case_count"));
assert.ok(mutate((value) => { value.calibration.reviewer_count = 1; }).includes("calibration.reviewer_count"));
assert.ok(mutate((value) => { value.calibration.unresolved_material_disagreements = 13; }).includes("calibration.unresolved_material_disagreements"));
assert.ok(mutate((value) => { value.historical_outcome_use = "model_accuracy"; }).includes("historical_outcome_use"));
assert.ok(mutate((value) => { value.decision.final_funding_decision_owner = ""; }).includes("decision.final_funding_decision_owner"));

if (require.main === module) process.stdout.write("Grant-scoring release-gate record contract tests passed.\n");
module.exports = { validateRecord };

