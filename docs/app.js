(function () {
  "use strict";

  const hash = (suffix) => `sha256:${"0".repeat(63)}${suffix}`;
  const fictionalRecord = {
    schema_version: "1.0.0",
    record_id: "fictional-call-2026-release-a",
    created_at: "2026-07-20T00:00:00Z",
    baseline_fingerprint: {
      rubric_version: "fictional-commercial-rubric-1.0.0",
      policy_context: "fictional-call-2026",
      resolved_config_sha256: hash("1"), prompt_bundle_sha256: hash("2"), tool_schema_sha256: hash("3"), few_shot_set_sha256: hash("4"),
      model_identity: "fictional-model-2026-06", evidence_cutoff: "2026-06-30T23:59:59Z", pipeline_commit: `${"0".repeat(39)}1`, executed_at: "2026-07-01T08:00:00Z"
    },
    candidate_fingerprint: {
      rubric_version: "fictional-commercial-rubric-1.1.0",
      policy_context: "fictional-call-2026",
      resolved_config_sha256: hash("5"), prompt_bundle_sha256: hash("6"), tool_schema_sha256: hash("7"), few_shot_set_sha256: hash("8"),
      model_identity: "fictional-model-2026-07", evidence_cutoff: "2026-07-19T23:59:59Z", pipeline_commit: `${"0".repeat(39)}2`, executed_at: "2026-07-20T08:00:00Z"
    },
    change: {
      reason: "Fictional clarification of evidence recency and scope definitions.",
      changed_fields: [{ field: "rubric_version", old_value: "fictional-commercial-rubric-1.0.0", new_value: "fictional-commercial-rubric-1.1.0" }],
      affected_criteria: ["market", "traction"], affected_applicant_groups: ["fictional-early-stage-companies"], human_change_owner: "programme-review-lead"
    },
    calibration: {
      case_basis: "fictional", case_count: 24, reviewer_count: 2, blind_independent_labels: true,
      label_distribution: {
        reviewer_a: { supported: 4, partial: 4, missing: 4, conflicting: 4, stale: 4, not_applicable: 4 },
        reviewer_b: { supported: 4, partial: 4, missing: 4, conflicting: 4, stale: 4, not_applicable: 4 }
      },
      raw_agreement: 0.5, cohens_kappa_unweighted: 0.4, material_disagreements: 12, unresolved_material_disagreements: 0
    },
    disagreement_agenda: [{
      case_id: "fictional-case-07", criterion_id: "traction", evidence_locator: "fictional-case-07#metric-window",
      reviewer_a_state: "partial", reviewer_b_state: "stale", candidate_state: "partial", disagreement_type: "time_boundary",
      policy_question: "Which fictional observation window applies?", accountable_owner: "programme-review-lead",
      human_outcome: "Keep candidate as a separate variant during a bounded pilot.", decided_at: "2026-07-20T09:00:00Z", applies_from: "2026-07-21T00:00:00Z"
    }],
    historical_outcome_use: "retrospective_separation",
    decision: {
      comparability: "separate_variant", release_status: "bounded_pilot", human_owner: "programme-review-lead",
      programme_policy_owner: "programme-policy-owner", eligibility_owner: "eligibility-review-owner",
      final_funding_decision_owner: "funding-panel-chair", decided_at: "2026-07-20T09:15:00Z",
      decision_note: "Fictional bounded pilot; do not mix candidate and baseline results."
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
  const dateTime = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
  const hashPattern = /^sha256:[0-9a-f]{64}$/;
  const commitPattern = /^[0-9a-f]{40}$/;
  const allowed = {
    basis: new Set(["fictional", "consented_deidentified", "mixed"]),
    historical: new Set(["not_used", "retrospective_separation", "error_analysis"]),
    comparability: new Set(["comparable", "recomputed", "separate_variant", "non_comparable", "retired"]),
    release: new Set(["rejected", "bounded_pilot", "released"]),
    disagreement: new Set(["definition", "missing_evidence", "conflicting_evidence", "time_boundary", "scope", "extraction", "policy"])
  };

  function validateRecord(record) {
    const errors = [];
    if (record.schema_version !== "1.0.0") errors.push("Schema version must be 1.0.0.");
    if (!nonEmpty(record.record_id)) errors.push("Record ID is required.");
    if (!dateTime(record.created_at)) errors.push("Created-at time must be valid.");
    for (const name of ["baseline_fingerprint", "candidate_fingerprint"]) {
      const value = record[name] || {};
      for (const field of ["rubric_version", "policy_context", "model_identity"]) if (!nonEmpty(value[field])) errors.push(`${name}.${field} is required.`);
      for (const field of ["resolved_config_sha256", "prompt_bundle_sha256", "tool_schema_sha256", "few_shot_set_sha256"]) if (!hashPattern.test(value[field] || "")) errors.push(`${name}.${field} must use sha256: plus 64 lowercase hex characters.`);
      if (!commitPattern.test(value.pipeline_commit || "")) errors.push(`${name}.pipeline_commit must contain 40 lowercase hex characters.`);
      if (!dateTime(value.evidence_cutoff)) errors.push(`${name}.evidence_cutoff must be valid.`);
      if (!dateTime(value.executed_at)) errors.push(`${name}.executed_at must be valid.`);
    }
    const change = record.change || {};
    if (!nonEmpty(change.reason)) errors.push("Change reason is required.");
    if (!Array.isArray(change.changed_fields) || change.changed_fields.length === 0) errors.push("At least one changed field is required.");
    if (!Array.isArray(change.affected_criteria) || change.affected_criteria.length === 0) errors.push("At least one affected criterion is required.");
    if (!Array.isArray(change.affected_applicant_groups) || change.affected_applicant_groups.length === 0) errors.push("At least one affected applicant group is required.");
    if (!nonEmpty(change.human_change_owner)) errors.push("Human change owner is required.");
    const calibration = record.calibration || {};
    if (!allowed.basis.has(calibration.case_basis)) errors.push("Case basis is invalid.");
    if (!Number.isInteger(calibration.case_count) || calibration.case_count < 20 || calibration.case_count > 30) errors.push("Case count must be an integer from 20 to 30.");
    if (calibration.reviewer_count !== 2) errors.push("Reviewer count must be exactly two.");
    if (calibration.blind_independent_labels !== true) errors.push("Reviewer labels must be blind and independent.");
    if (typeof calibration.raw_agreement !== "number" || calibration.raw_agreement < 0 || calibration.raw_agreement > 1) errors.push("Raw agreement must be between zero and one.");
    if (calibration.cohens_kappa_unweighted !== null && (typeof calibration.cohens_kappa_unweighted !== "number" || calibration.cohens_kappa_unweighted < -1 || calibration.cohens_kappa_unweighted > 1)) errors.push("Kappa must be blank or between minus one and one.");
    if (!Number.isInteger(calibration.material_disagreements) || calibration.material_disagreements < 0) errors.push("Material disagreements must be a non-negative integer.");
    if (!Number.isInteger(calibration.unresolved_material_disagreements) || calibration.unresolved_material_disagreements < 0 || calibration.unresolved_material_disagreements > calibration.material_disagreements) errors.push("Unresolved disagreements cannot exceed material disagreements.");
    if (!calibration.label_distribution || typeof calibration.label_distribution !== "object" || Array.isArray(calibration.label_distribution)) errors.push("Label distribution must be a JSON object.");
    if (!Array.isArray(record.disagreement_agenda)) errors.push("Disagreement agenda must be a JSON array.");
    for (const [index, item] of (record.disagreement_agenda || []).entries()) {
      for (const field of ["case_id", "criterion_id", "evidence_locator", "reviewer_a_state", "reviewer_b_state", "candidate_state", "accountable_owner", "human_outcome"]) if (!nonEmpty(item[field])) errors.push(`Agenda row ${index + 1}: ${field} is required.`);
      if (!allowed.disagreement.has(item.disagreement_type)) errors.push(`Agenda row ${index + 1}: disagreement type is invalid.`);
    }
    if (!allowed.historical.has(record.historical_outcome_use)) errors.push("Historical-outcome use is invalid.");
    const decision = record.decision || {};
    if (!allowed.comparability.has(decision.comparability)) errors.push("Comparability state is invalid.");
    if (!allowed.release.has(decision.release_status)) errors.push("Release status is invalid.");
    for (const field of ["human_owner", "programme_policy_owner", "eligibility_owner", "final_funding_decision_owner", "decision_note"]) if (!nonEmpty(decision[field])) errors.push(`${field} is required.`);
    if (!dateTime(decision.decided_at)) errors.push("Decision time must be valid.");
    return errors;
  }

  function toLocalInput(value) {
    if (!value) return "";
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function toIso(value) { return value ? new Date(value).toISOString() : ""; }
  function csv(value) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
  function number(id) { const value = document.getElementById(id).value; return value === "" ? null : Number(value); }
  function text(id) { return document.getElementById(id).value.trim(); }
  function parseJson(id, fallback, errors) {
    try { return JSON.parse(document.getElementById(id).value); }
    catch { errors.push(`${id.replaceAll("-", " ")} must contain valid JSON.`); return fallback; }
  }
  function readFingerprint(prefix) {
    return {
      rubric_version: text(`${prefix}-rubric`), policy_context: text(`${prefix}-policy`),
      resolved_config_sha256: text(`${prefix}-config`), prompt_bundle_sha256: text(`${prefix}-prompt`),
      tool_schema_sha256: text(`${prefix}-tool`), few_shot_set_sha256: text(`${prefix}-few-shot`),
      model_identity: text(`${prefix}-model`), evidence_cutoff: toIso(text(`${prefix}-cutoff`)),
      pipeline_commit: text(`${prefix}-commit`), executed_at: toIso(text(`${prefix}-executed`))
    };
  }
  function buildRecord() {
    const parseErrors = [];
    const record = {
      schema_version: "1.0.0", record_id: text("record-id"), created_at: toIso(text("created-at")),
      baseline_fingerprint: readFingerprint("baseline"), candidate_fingerprint: readFingerprint("candidate"),
      change: {
        reason: text("change-reason"), changed_fields: parseJson("changed-fields", [], parseErrors),
        affected_criteria: csv(text("affected-criteria")), affected_applicant_groups: csv(text("affected-groups")),
        human_change_owner: text("change-owner")
      },
      calibration: {
        case_basis: text("case-basis"), case_count: number("case-count"), reviewer_count: number("reviewer-count"),
        blind_independent_labels: true, label_distribution: parseJson("label-distribution", {}, parseErrors),
        raw_agreement: number("raw-agreement"), cohens_kappa_unweighted: number("kappa"),
        material_disagreements: number("material-disagreements"), unresolved_material_disagreements: number("unresolved-disagreements")
      },
      disagreement_agenda: parseJson("disagreement-agenda", [], parseErrors), historical_outcome_use: text("historical-use"),
      decision: {
        comparability: text("comparability"), release_status: text("release-status"), human_owner: text("human-owner"),
        programme_policy_owner: text("policy-owner"), eligibility_owner: text("eligibility-owner"), final_funding_decision_owner: text("funding-owner"),
        decided_at: toIso(text("decided-at")), decision_note: text("decision-note")
      }
    };
    return { record, errors: [...parseErrors, ...validateRecord(record)] };
  }
  function setValue(id, value) { document.getElementById(id).value = value ?? ""; }
  function loadRecord(record) {
    setValue("record-id", record.record_id); setValue("created-at", toLocalInput(record.created_at));
    setValue("change-reason", record.change.reason); setValue("changed-fields", JSON.stringify(record.change.changed_fields, null, 2));
    setValue("affected-criteria", record.change.affected_criteria.join(", ")); setValue("affected-groups", record.change.affected_applicant_groups.join(", ")); setValue("change-owner", record.change.human_change_owner);
    for (const [prefix, value] of [["baseline", record.baseline_fingerprint], ["candidate", record.candidate_fingerprint]]) {
      setValue(`${prefix}-rubric`, value.rubric_version); setValue(`${prefix}-policy`, value.policy_context); setValue(`${prefix}-config`, value.resolved_config_sha256);
      setValue(`${prefix}-prompt`, value.prompt_bundle_sha256); setValue(`${prefix}-tool`, value.tool_schema_sha256); setValue(`${prefix}-few-shot`, value.few_shot_set_sha256);
      setValue(`${prefix}-model`, value.model_identity); setValue(`${prefix}-cutoff`, toLocalInput(value.evidence_cutoff)); setValue(`${prefix}-commit`, value.pipeline_commit); setValue(`${prefix}-executed`, toLocalInput(value.executed_at));
    }
    setValue("case-basis", record.calibration.case_basis); setValue("case-count", record.calibration.case_count); setValue("reviewer-count", record.calibration.reviewer_count);
    setValue("raw-agreement", record.calibration.raw_agreement); setValue("kappa", record.calibration.cohens_kappa_unweighted); setValue("material-disagreements", record.calibration.material_disagreements); setValue("unresolved-disagreements", record.calibration.unresolved_material_disagreements);
    setValue("label-distribution", JSON.stringify(record.calibration.label_distribution, null, 2)); setValue("disagreement-agenda", JSON.stringify(record.disagreement_agenda, null, 2));
    setValue("historical-use", record.historical_outcome_use); setValue("comparability", record.decision.comparability); setValue("release-status", record.decision.release_status);
    setValue("human-owner", record.decision.human_owner); setValue("policy-owner", record.decision.programme_policy_owner); setValue("eligibility-owner", record.decision.eligibility_owner); setValue("funding-owner", record.decision.final_funding_decision_owner);
    setValue("decided-at", toLocalInput(record.decision.decided_at)); setValue("decision-note", record.decision.decision_note);
    render(false);
  }
  function render(showValidation) {
    const { record, errors } = buildRecord();
    document.getElementById("json-output").textContent = JSON.stringify(record, null, 2);
    const list = document.getElementById("validation-errors"); list.replaceChildren(...errors.map((error) => { const item = document.createElement("li"); item.textContent = error; return item; }));
    const state = document.getElementById("validation-state");
    state.className = `state ${showValidation ? (errors.length ? "invalid" : "valid") : "neutral"}`;
    state.textContent = showValidation ? (errors.length ? `${errors.length} issue${errors.length === 1 ? "" : "s"}` : "Valid record") : "Not checked";
    return { record, errors };
  }
  async function copyJson() {
    const { record, errors } = render(true); if (errors.length) return false;
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    document.getElementById("validation-state").textContent = "Copied"; return true;
  }
  function downloadJson() {
    const { record, errors } = render(true); if (errors.length) return false;
    const blob = new Blob([`${JSON.stringify(record, null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${record.record_id || "release-gate-record"}.json`; link.click(); URL.revokeObjectURL(link.href); return true;
  }

  window.ReleaseGateBuilder = { fictionalRecord: clone(fictionalRecord), validateRecord, buildRecord, loadRecord, render, copyJson, downloadJson };
  document.addEventListener("DOMContentLoaded", () => {
    loadRecord(clone(fictionalRecord));
    document.getElementById("record-form").addEventListener("input", () => render(false));
    document.getElementById("load-example").addEventListener("click", () => loadRecord(clone(fictionalRecord)));
    document.getElementById("validate-record").addEventListener("click", () => render(true));
    document.getElementById("copy-json").addEventListener("click", () => copyJson().catch(() => { document.getElementById("validation-state").textContent = "Copy unavailable"; }));
    document.getElementById("download-json").addEventListener("click", downloadJson);
    document.getElementById("record-form").addEventListener("reset", () => setTimeout(() => loadRecord(clone(fictionalRecord)), 0));
  });
})();

