#!/usr/bin/env python3
"""
Upload stories from an ep0X-step2-stories.json file into Jira Cloud.

Each story is created as a Story issue under the same EPIC as its Feature,
and then LINKED to its Feature (not nested as a child) using an issue link.

Usage:
    python3 upload_stories_to_jira.py ep01-step2-stories.json --dry-run
    python3 upload_stories_to_jira.py ep01-step2-stories.json

Run once per stories file.
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
from typing import Any, Dict, List, Optional, Tuple
from urllib import request, parse, error

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
JIRA_URL    = "https://aavademo.atlassian.net"
JIRA_EMAIL  = "aava.demouser@ascendion.com"
JIRA_TOKEN  = "ATATT3xFfGF0nihpZcemEb_eH8umNFoal2kUqTcVR1fAE3wPuDTxW3h4YPUBjT8cMDkAqSGcxlKMCOgFG-61ZUMjUXmIItdS6cc2f2bjcOsi1ZMFxe85wNyDLU5dzFHlpgjZwPOrnGrE8AA-PcWiHZFuG2YBJhUG2lzSRCBYXRwvPWUTGx8vC_8=4EDE6D3E"
PROJECT_KEY = "GGMDEMOS"

# Issue type for the stories themselves.
STORY_ISSUE_TYPE = "Story"

# Link type between Story and Feature. "Relates" is the universally-available
# default. Other common options (must exist in your Jira): "Blocks",
# "Implements", "Is Implemented By". Run GET /rest/api/3/issueLinkType to see
# what's configured.
LINK_TYPE_NAME      = "Relates"
LINK_DIRECTION      = "outward"   # Story --relates to--> Feature

# -----------------------------------------------------------------------
# feature_id -> Jira key mapping (from previous run)
# -----------------------------------------------------------------------
FEATURE_ID_TO_JIRA_KEY: dict[str, str] = {
    "F-01.1": "GGMDEMOS-155",
    "F-01.2": "GGMDEMOS-156",
    "F-01.3": "GGMDEMOS-157",
    "F-01.4": "GGMDEMOS-158",

    "F-02.1": "GGMDEMOS-160",
    "F-02.2": "GGMDEMOS-161",


    "F-03.1": "GGMDEMOS-163",
    "F-03.2": "GGMDEMOS-164",
    "F-03.3": "GGMDEMOS-165",
    "F-03.4": "GGMDEMOS-166",
    

    "F-04.1": "GGMDEMOS-168",
    "F-04.2": "GGMDEMOS-169",
    "F-04.3": "GGMDEMOS-170",

    "F-05.1": "GGMDEMOS-172",


    "F-06.1": "GGMDEMOS-174",
    "F-06.2": "GGMDEMOS-175",

    "F-07.1": "GGMDEMOS-177",
    "F-07.2": "GGMDEMOS-178",

    "F-08.1": "GGMDEMOS-180",
    "F-08.2": "GGMDEMOS-181",

}

# ---------------------------------------------------------------------------
# HTTP helpers (stdlib only)
# ---------------------------------------------------------------------------
def _auth_header() -> str:
    raw = f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")

def _request(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"{JIRA_URL.rstrip('/')}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = request.Request(url, data=data, method=method)
    req.add_header("Authorization", _auth_header())
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    try:
        with request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Jira API {e.code} on {method} {path}: {detail}") from None

def jira_post(path: str, payload: dict) -> dict:
    return _request("POST", path, payload)

def jira_get(path: str) -> dict:
    return _request("GET", path)

# ---------------------------------------------------------------------------
# Find the Epic that a Feature belongs to, so we can put the Story there too.
# ---------------------------------------------------------------------------
def get_epic_key_for_feature(feature_key: str) -> str | None:
    """Return the Epic key that the given Feature issue is parented under."""
    result = jira_get(f"/rest/api/3/issue/{feature_key}?fields=parent")
    parent = (result.get("fields") or {}).get("parent") or {}
    return parent.get("key")

# ---------------------------------------------------------------------------
# ADF builders
# ---------------------------------------------------------------------------
def adf_text(text: str) -> dict:
    return {"type": "text", "text": text}

def adf_paragraph(text: str) -> dict:
    return {"type": "paragraph", "content": [adf_text(text)] if text else []}

def adf_heading(text: str, level: int = 3) -> dict:
    return {"type": "heading", "attrs": {"level": level},
            "content": [adf_text(text)]}

def adf_bullet_list(items: list[str]) -> dict:
    return {"type": "bulletList",
            "content": [{"type": "listItem",
                         "content": [adf_paragraph(item)]} for item in items]}

def adf_doc(blocks: list[dict]) -> dict:
    return {"type": "doc", "version": 1, "content": blocks}

# ---------------------------------------------------------------------------
# Description builder for a story
# ---------------------------------------------------------------------------
def build_story_description(story: dict, feature_key: str) -> dict:
    blocks: list[dict] = []

    # Pointer to the Feature so anyone reading the Story sees the link target
    blocks.append(adf_paragraph(
        f"Implements feature: {story.get('feature_id')} ({feature_key})"))

    # User story statement
    if story.get("user_story"):
        blocks.append(adf_heading("User story", 3))
        blocks.append(adf_paragraph(story["user_story"]))

    # Quick-look metadata
    meta = []
    if story.get("story_points") is not None:
        meta.append(f"Story points: {story['story_points']}")
    if story.get("data_sensitivity"):
        meta.append(f"Data sensitivity: {story['data_sensitivity']}")
    if story.get("change_type"):
        meta.append(f"Change type: {story['change_type']}")
    if story.get("depends_on"):
        meta.append(f"Depends on: {', '.join(story['depends_on'])}")
    if story.get("regulatory_linkage"):
        meta.append(f"Regulatory linkage: {story['regulatory_linkage']}")
    for line in meta:
        blocks.append(adf_paragraph(line))

    # Acceptance criteria
    ac = story.get("acceptance_criteria") or []
    if ac:
        blocks.append(adf_heading("Acceptance criteria", 3))
        blocks.append(adf_bullet_list(ac))

    # Existing context (for brownfield/enhance stories)
    ctx = story.get("existing_context") or {}
    ctx_has_content = any(ctx.get(k) for k in (
        "existing_feature_ref", "what_exists_today", "what_changes",
        "screens_affected", "apis_affected", "tables_affected"))
    if ctx_has_content:
        blocks.append(adf_heading("Existing context", 3))
        if ctx.get("existing_feature_ref"):
            blocks.append(adf_paragraph(f"Existing feature: {ctx['existing_feature_ref']}"))
        if ctx.get("what_exists_today"):
            blocks.append(adf_paragraph(f"Today: {ctx['what_exists_today']}"))
        if ctx.get("what_changes"):
            blocks.append(adf_paragraph(f"Changes: {ctx['what_changes']}"))
        if ctx.get("backward_compatible") is not None:
            blocks.append(adf_paragraph(
                f"Backward compatible: {ctx['backward_compatible']}"))
        for label, key in (("Screens affected", "screens_affected"),
                           ("APIs affected",    "apis_affected"),
                           ("Tables affected",  "tables_affected")):
            items = ctx.get(key) or []
            if items:
                blocks.append(adf_paragraph(label + ":"))
                blocks.append(adf_bullet_list(items))

    # Regression criteria
    regression = story.get("regression_criteria") or []
    if regression:
        blocks.append(adf_heading("Regression criteria", 3))
        blocks.append(adf_bullet_list(regression))

    # Citations
    citation = story.get("citation") or {}
    cit_has = any(citation.get(k) for k in (
        "requirements_used", "domain_kb_sections",
        "architecture_kb_sections", "baseline_refs"))
    if cit_has:
        blocks.append(adf_heading("Citations", 3))
        for label, key in (("Requirements",            "requirements_used"),
                           ("Domain KB",               "domain_kb_sections"),
                           ("Architecture KB",         "architecture_kb_sections"),
                           ("Baseline refs",           "baseline_refs")):
            items = citation.get(key) or []
            if items:
                blocks.append(adf_paragraph(label + ":"))
                blocks.append(adf_bullet_list(items))

    # Reasoning
    if story.get("reasoning"):
        blocks.append(adf_heading("Reasoning", 3))
        blocks.append(adf_paragraph(story["reasoning"]))

    return adf_doc(blocks)

# ---------------------------------------------------------------------------
# Create a Story under the Feature's Epic, then link Story -> Feature
# ---------------------------------------------------------------------------
def create_story_issue(story: dict, feature_key: str, epic_key: str | None,
                       dry_run: bool) -> str:
    summary = f"[{story['story_id']}] {story['title']}"
    fields: dict = {
        "project":     {"key": PROJECT_KEY},
        "summary":     summary,
        "description": build_story_description(story, feature_key),
        "issuetype":   {"name": STORY_ISSUE_TYPE},
    }
    # Park the Story under the same Epic as its Feature (keeps the backlog tidy).
    # If the Feature has no parent Epic, we simply create the Story at top level.
    if epic_key:
        fields["parent"] = {"key": epic_key}

    if dry_run:
        parent_note = f" under epic {epic_key}" if epic_key else " (no epic parent)"
        print(f"    [DRY-RUN] Would create {STORY_ISSUE_TYPE}{parent_note}: {summary}")
        return f"DRY-{story['story_id']}"

    result = jira_post("/rest/api/3/issue", {"fields": fields})
    key = result["key"]
    parent_note = f" under epic {epic_key}" if epic_key else ""
    print(f"    ✓ Created {key}{parent_note}: {summary}")
    return key

def link_story_to_feature(story_key: str, feature_key: str, dry_run: bool) -> None:
    payload = {
        "type":         {"name": LINK_TYPE_NAME},
        "inwardIssue":  {"key": feature_key if LINK_DIRECTION == "inward"  else story_key},
        "outwardIssue": {"key": feature_key if LINK_DIRECTION == "outward" else story_key},
    }
    if dry_run:
        print(f"      [DRY-RUN] Would link {story_key} --{LINK_TYPE_NAME}--> {feature_key}")
        return
    jira_post("/rest/api/3/issueLink", payload)
    print(f"      ✓ Linked {story_key} --{LINK_TYPE_NAME}--> {feature_key}")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Upload stories JSON to Jira and link them to their Feature.")
    parser.add_argument("json_file", help="Path to epXX-step2-stories.json")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would happen, but don't call Jira.")
    args = parser.parse_args()

    with open(args.json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    stories = data.get("stories", [])
    print(f"Loaded {len(stories)} stories from {args.json_file}")
    print(f"Epic: {data.get('epic_id')} — {data.get('epic_title')}")
    print(f"Target: {JIRA_URL}  project={PROJECT_KEY}")
    print(f"Story issue type: {STORY_ISSUE_TYPE}")
    print(f"Link type: {LINK_TYPE_NAME} ({LINK_DIRECTION})")
    if args.dry_run:
        print("Mode: DRY RUN (no writes)")
    print()

    # Resolve every feature_id up front, and look up each Feature's Epic.
    feature_ids = sorted({s["feature_id"] for s in stories})
    feature_key_for: dict[str, str] = {}
    epic_key_for:    dict[str, Optional[str]] = {}
    for fid in feature_ids:
        fkey = FEATURE_ID_TO_JIRA_KEY.get(fid)
        if not fkey:
            print(f"  {fid} → NOT IN FEATURE_ID_TO_JIRA_KEY", file=sys.stderr)
            continue
        feature_key_for[fid] = fkey
        # Look up the Feature's parent Epic (one GET per unique feature).
        # Skipped in dry-run to keep it fully offline-safe.
        if args.dry_run:
            epic_key_for[fid] = None
            print(f"  {fid} → feature {fkey}  (epic lookup skipped in dry-run)")
        else:
            try:
                epic = get_epic_key_for_feature(fkey)
                epic_key_for[fid] = epic
                print(f"  {fid} → feature {fkey}  (epic: {epic or 'none'})")
            except Exception as e:
                print(f"  {fid} → feature {fkey}  (epic lookup failed: {e})",
                      file=sys.stderr)
                epic_key_for[fid] = None

    missing = [f for f in feature_ids if f not in feature_key_for]
    if missing:
        print(f"\n✗ Missing feature mappings: {missing}", file=sys.stderr)
        return 2
    print()

    created: list[tuple[str, str, str]] = []  # (story_id, story_key, feature_key)
    for story in stories:
        fid = story["feature_id"]
        feature_key = feature_key_for[fid]
        epic_key = epic_key_for.get(fid)
        print(f"Story {story['story_id']} ({fid} → {feature_key})")
        try:
            story_key = create_story_issue(story, feature_key, epic_key, args.dry_run)
            link_story_to_feature(story_key, feature_key, args.dry_run)
            created.append((story["story_id"], story_key, feature_key))
        except Exception as e:
            print(f"    ✗ Failed: {e}", file=sys.stderr)

    print()
    print("=" * 60)
    print(f"Summary: {len(created)}/{len(stories)} stories created and linked")
    print("=" * 60)
    for sid, skey, fkey in created:
        print(f"  {sid} → {skey}  (linked to {fkey})")
    return 0

if __name__ == "__main__":
    sys.exit(main())

