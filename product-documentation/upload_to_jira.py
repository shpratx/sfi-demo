#!/usr/bin/env python3
"""
Upload epics and features from a step2-epics.json file into Jira Cloud.

Usage:
    python3 upload_to_jira.py step2-epics.json
    python3 upload_to_jira.py step2-epics.json --dry-run

Creates one Jira Epic per item in `epics[]`, and one Feature (child of that Epic)
per item in `epics[].features[]`. Rich context (scope, requirements, NFRs,
citations, reasoning) is written into the issue description.
"""

import argparse
import base64
import json
import sys
from typing import Any
from urllib import request, error

# ---------------------------------------------------------------------------
# Configuration — edit these to match your Jira instance
# ---------------------------------------------------------------------------
JIRA_URL    = "https://aavademo.atlassian.net"
JIRA_EMAIL  = "aava.demouser@ascendion.com"
JIRA_TOKEN  = "ATATT3xFfGF0nihpZcemEb_eH8umNFoal2kUqTcVR1fAE3wPuDTxW3h4YPUBjT8cMDkAqSGcxlKMCOgFG-61ZUMjUXmIItdS6cc2f2bjcOsi1ZMFxe85wNyDLU5dzFHlpgjZwPOrnGrE8AA-PcWiHZFuG2YBJhUG2lzSRCBYXRwvPWUTGx8vC_8=4EDE6D3E"
PROJECT_KEY = "GGMDEMOS"

# Issue type names — change FEATURE_ISSUE_TYPE to "Feature" if your project
EPIC_ISSUE_TYPE    = "Epic"
FEATURE_ISSUE_TYPE = "Feature"

# ---------------------------------------------------------------------------
# HTTP helper (stdlib only — no `requests` dependency)
# ---------------------------------------------------------------------------
def _auth_header() -> str:
    raw = f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")

def jira_post(path: str, payload: dict) -> dict:
    url = f"{JIRA_URL.rstrip('/')}{path}"
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, method="POST")
    req.add_header("Authorization", _auth_header())
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    try:
        with request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Jira API {e.code} on POST {path}: {detail}") from None

# ---------------------------------------------------------------------------
# Atlassian Document Format (ADF) builders
# Jira Cloud REST v3 requires ADF, not plain text, for `description`.
# ---------------------------------------------------------------------------
def adf_text(text: str) -> dict:
    return {"type": "text", "text": text}

def adf_paragraph(text: str) -> dict:
    return {"type": "paragraph", "content": [adf_text(text)] if text else []}

def adf_heading(text: str, level: int = 2) -> dict:
    return {
        "type": "heading",
        "attrs": {"level": level},
        "content": [adf_text(text)],
    }

def adf_bullet_list(items: list[str]) -> dict:
    return {
        "type": "bulletList",
        "content": [
            {
                "type": "listItem",
                "content": [adf_paragraph(item)],
            }
            for item in items
        ],
    }

def adf_doc(blocks: list[dict]) -> dict:
    return {"type": "doc", "version": 1, "content": blocks}

# ---------------------------------------------------------------------------
# Description builders — convert epic/feature dicts into ADF documents
# ---------------------------------------------------------------------------
def build_epic_description(epic: dict) -> dict:
    blocks: list[dict] = [adf_paragraph(epic.get("description", ""))]

    if epic.get("sprint") is not None:
        blocks.append(adf_paragraph(f"Sprint: {epic['sprint']}"))

    reqs = epic.get("requirements_covered") or []
    if reqs:
        blocks.append(adf_heading("Requirements covered", 3))
        blocks.append(adf_paragraph(", ".join(reqs)))

    scope_in = epic.get("scope_in") or []
    if scope_in:
        blocks.append(adf_heading("Scope — in", 3))
        blocks.append(adf_bullet_list(scope_in))

    scope_out = epic.get("scope_out") or []
    if scope_out:
        blocks.append(adf_heading("Scope — out", 3))
        blocks.append(adf_bullet_list(scope_out))

    if epic.get("reasoning"):
        blocks.append(adf_heading("Reasoning", 3))
        blocks.append(adf_paragraph(epic["reasoning"]))

    return adf_doc(blocks)

def build_feature_description(feature: dict) -> dict:
    blocks: list[dict] = [adf_paragraph(feature.get("description", ""))]

    meta_lines = []
    if feature.get("change_type"):
        meta_lines.append(f"Change type: {feature['change_type']}")
    if feature.get("data_sensitivity"):
        meta_lines.append(f"Data sensitivity: {feature['data_sensitivity']}")
    if feature.get("user_facing") is not None:
        meta_lines.append(f"User-facing: {feature['user_facing']}")
    if feature.get("backward_compatible") is not None:
        meta_lines.append(f"Backward compatible: {feature['backward_compatible']}")
    if feature.get("existing_feature_ref"):
        meta_lines.append(f"Existing feature ref: {feature['existing_feature_ref']}")
    for line in meta_lines:
        blocks.append(adf_paragraph(line))

    reqs = feature.get("requirements_covered") or []
    if reqs:
        blocks.append(adf_heading("Requirements covered", 3))
        blocks.append(adf_paragraph(", ".join(reqs)))

    nfrs = feature.get("nfrs_applicable") or []
    if nfrs:
        blocks.append(adf_heading("NFRs applicable", 3))
        blocks.append(adf_paragraph(", ".join(nfrs)))

    if feature.get("change_description"):
        blocks.append(adf_heading("Change description", 3))
        blocks.append(adf_paragraph(feature["change_description"]))

    for label, key in (
        ("Existing screens affected", "existing_screens_affected"),
        ("Existing APIs affected",    "existing_apis_affected"),
        ("Existing tables affected",  "existing_tables_affected"),
        ("Regression risks",          "regression_risks"),
    ):
        items = feature.get(key) or []
        if items:
            blocks.append(adf_heading(label, 3))
            blocks.append(adf_bullet_list(items))

    citation = feature.get("citation") or {}
    reqs_used = citation.get("requirements_used") or []
    kb_used   = citation.get("kb_sections_used") or []
    if reqs_used or kb_used:
        blocks.append(adf_heading("Citations", 3))
        if reqs_used:
            blocks.append(adf_paragraph("Requirements:"))
            blocks.append(adf_bullet_list(reqs_used))
        if kb_used:
            blocks.append(adf_paragraph("KB sections:"))
            blocks.append(adf_bullet_list(kb_used))

    if feature.get("reasoning"):
        blocks.append(adf_heading("Reasoning", 3))
        blocks.append(adf_paragraph(feature["reasoning"]))

    return adf_doc(blocks)

# ---------------------------------------------------------------------------
# Issue creation
# ---------------------------------------------------------------------------
def create_epic(epic: dict, dry_run: bool) -> str:
    summary = f"[{epic['epic_id']}] {epic['title']}"
    payload = {
        "fields": {
            "project":     {"key": PROJECT_KEY},
            "summary":     summary,
            "description": build_epic_description(epic),
            "issuetype":   {"name": EPIC_ISSUE_TYPE},
        }
    }
    if dry_run:
        print(f"  [DRY-RUN] Would create Epic: {summary}")
        return f"DRY-{epic['epic_id']}"
    result = jira_post("/rest/api/3/issue", payload)
    key = result["key"]
    print(f"  ✓ Created Epic {key}: {summary}")
    return key

def create_feature(feature: dict, parent_key: str, dry_run: bool) -> str:
    summary = f"[{feature['feature_id']}] {feature['title']}"
    payload = {
        "fields": {
            "project":     {"key": PROJECT_KEY},
            "summary":     summary,
            "description": build_feature_description(feature),
            "issuetype":   {"name": FEATURE_ISSUE_TYPE},
            "parent":      {"key": parent_key},
            # If the modern `parent` field doesn't work in your project
            # (legacy company-managed projects), comment the line above and
            # uncomment the line below — replace with your Epic Link field id:
            # "customfield_10014": parent_key,
        }
    }
    if dry_run:
        print(f"    [DRY-RUN] Would create Feature under {parent_key}: {summary}")
        return f"DRY-{feature['feature_id']}"
    result = jira_post("/rest/api/3/issue", payload)
    key = result["key"]
    print(f"    ✓ Created Feature {key} under {parent_key}: {summary}")
    return key

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description="Upload epics+features JSON to Jira.")
    parser.add_argument("json_file", help="Path to step2-epics.json")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be created, but don't call Jira.")
    args = parser.parse_args()

    with open(args.json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    epics = data.get("epics", [])
    print(f"Loaded {len(epics)} epics from {args.json_file}")
    print(f"Target: {JIRA_URL}  project={PROJECT_KEY}")
    if args.dry_run:
        print("Mode: DRY RUN (no API calls)")
    print()

    summary: list[tuple[str, str, int]] = []  # (epic_id, epic_key, feature_count)
    for epic in epics:
        print(f"Epic {epic['epic_id']}: {epic['title']}")
        try:
            epic_key = create_epic(epic, args.dry_run)
        except Exception as e:
            print(f"  ✗ Failed to create epic {epic['epic_id']}: {e}", file=sys.stderr)
            continue

        feature_count = 0
        for feature in epic.get("features", []):
            try:
                create_feature(feature, epic_key, args.dry_run)
                feature_count += 1
            except Exception as e:
                print(f"    ✗ Failed feature {feature.get('feature_id')}: {e}",
                      file=sys.stderr)
        summary.append((epic["epic_id"], epic_key, feature_count))
        print()

    print("=" * 60)
    print("Summary")
    print("=" * 60)
    for epic_id, epic_key, count in summary:
        print(f"  {epic_id} → {epic_key}  ({count} features)")
    print(f"\nTotal: {len(summary)} epics, "
          f"{sum(c for _, _, c in summary)} features")
    return 0

if __name__ == "__main__":
    sys.exit(main())