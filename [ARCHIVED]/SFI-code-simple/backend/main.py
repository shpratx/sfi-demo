"""
FastAPI backend for the Driver Check In Admin demo.

Demo-only: in-memory store, simple opaque tokens (not real JWT).
Implements the major flows from hive-user-flows.md: auth + role gating,
organizations, settings CRUD with validation, QR generation, and a
mobile-projection endpoint that returns only enabled settings.
"""
import base64
import io
import re
import uuid
from typing import Optional

import qrcode
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Driver Check In Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Auth (demo)
# ─────────────────────────────────────────────────────────────────────────────
class User(BaseModel):
    id: str
    email: str
    name: str
    role: str   # "ADMIN" | "STANDARD"
    org_id: str


_USERS: dict[str, dict] = {
    "admin@schreiber.com": {
        "password": "admin",
        "user": User(id="u1", email="admin@schreiber.com", name="Jane Smith",
                     role="ADMIN", org_id="org-greenbay"),
    },
    "user@schreiber.com": {
        "password": "user",
        "user": User(id="u2", email="user@schreiber.com", name="Bob Driver",
                     role="STANDARD", org_id="org-greenbay"),
    },
}

_TOKENS: dict[str, str] = {}    # token -> email
_FAILED: dict[str, list[float]] = {}  # email -> attempt timestamps (lockout)


class LoginRequest(BaseModel):
    email: str
    password: str


def _current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    email = _TOKENS.get(token)
    if not email:
        raise HTTPException(401, "Session expired — please log in again")
    return _USERS[email]["user"]


def _require_admin(user: User = Depends(_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(403, "Access Denied")
    return user


@app.post("/api/auth/login")
def login(req: LoginRequest):
    record = _USERS.get(req.email.lower().strip())
    if not record or record["password"] != req.password:
        raise HTTPException(401, "Invalid credentials")
    token = uuid.uuid4().hex
    _TOKENS[token] = req.email.lower().strip()
    return {"token": token, "user": record["user"]}


@app.post("/api/auth/logout")
def logout(user: User = Depends(_current_user), authorization: str = Header(...)):
    token = authorization.split(" ", 1)[1]
    _TOKENS.pop(token, None)
    return {"ok": True}


@app.get("/api/auth/me", response_model=User)
def me(user: User = Depends(_current_user)):
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Organizations (Flow 3)
# ─────────────────────────────────────────────────────────────────────────────
class Organization(BaseModel):
    id: str
    name: str
    address: str = ""
    phone: str = ""


_ORGS: dict[str, Organization] = {
    "org-greenbay": Organization(id="org-greenbay", name="Schreiber Foods - Green Bay",
                                 address="123 Main St, Green Bay, WI", phone="555-0142"),
    "org-shawano": Organization(id="org-shawano", name="Schreiber Foods - Shawano",
                                address="500 Industrial Dr, Shawano, WI", phone="555-0188"),
}


class OrgInput(BaseModel):
    name: str
    address: str = ""
    phone: str = ""


@app.get("/api/organizations")
def list_orgs(user: User = Depends(_require_admin)):
    return list(_ORGS.values())


@app.post("/api/organizations", response_model=Organization)
def create_org(payload: OrgInput, user: User = Depends(_require_admin)):
    if not payload.name.strip():
        raise HTTPException(400, "Organization name is required")
    org = Organization(id=f"org-{uuid.uuid4().hex[:8]}", **payload.model_dump())
    _ORGS[org.id] = org
    return org


@app.put("/api/organizations/{org_id}", response_model=Organization)
def update_org(org_id: str, payload: OrgInput, user: User = Depends(_require_admin)):
    if org_id not in _ORGS:
        raise HTTPException(404, "Not found")
    if not payload.name.strip():
        raise HTTPException(400, "Organization name is required")
    org = Organization(id=org_id, **payload.model_dump())
    _ORGS[org_id] = org
    return org


@app.delete("/api/organizations/{org_id}")
def delete_org(org_id: str, user: User = Depends(_require_admin)):
    if org_id not in _ORGS:
        raise HTTPException(404, "Not found")
    del _ORGS[org_id]
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────────────────
# Driver Check In Settings (Flows 5–9, 11)
# ─────────────────────────────────────────────────────────────────────────────
class Settings(BaseModel):
    organizationName: str = "Schreiber Foods - Green Bay"
    qrCodeAccess: bool = True
    driverName: bool = True
    driverId: bool = True
    driverPhone: bool = True
    truckNumber: bool = True
    carrierApproval: bool = True

    temperatureEnabled: bool = False
    temperatureRange: str = ""

    earlyCheckInEnabled: bool = False
    earlyCheckInHours: str = ""
    earlyCheckInInstruction: str = (
        "Due to earlier arrival time, you cannot check in via regular process. "
        "Please contact Facility Administrator directly via phone number {TRAFFIC_CLERK_PHONE}"
    )

    confirmationEnabled: bool = True
    confirmationText: str = (
        "Driver Check In is successfully completed! Please wait for the call from "
        "Traffic Clerk for Dock assignment and further instructions."
    )


def _default_settings_for(org_id: str) -> Settings:
    org = _ORGS.get(org_id)
    s = Settings()
    if org:
        s.organizationName = org.name
    return s


_settings_store: dict[str, Settings] = {
    "org-greenbay": _default_settings_for("org-greenbay"),
}


class FieldUpdate(BaseModel):
    field: str
    value: object


class ValidateRequest(BaseModel):
    field: str
    value: str


def _settings_for(org_id: str) -> Settings:
    if org_id not in _settings_store:
        _settings_store[org_id] = _default_settings_for(org_id)
    return _settings_store[org_id]


@app.get("/api/settings", response_model=Settings)
def get_settings(user: User = Depends(_require_admin)):
    return _settings_for(user.org_id)


@app.put("/api/settings", response_model=Settings)
def update_settings(payload: Settings, user: User = Depends(_require_admin)):
    _settings_store[user.org_id] = payload
    return payload


@app.patch("/api/settings", response_model=Settings)
def patch_setting(update: FieldUpdate, user: User = Depends(_require_admin)):
    current = _settings_for(user.org_id)
    if not hasattr(current, update.field):
        raise HTTPException(400, f"Unknown field: {update.field}")
    data = current.model_dump()
    data[update.field] = update.value
    try:
        _settings_store[user.org_id] = Settings(**data)
    except Exception as e:
        raise HTTPException(400, str(e))
    return _settings_store[user.org_id]


_TEMP_RE = re.compile(r"^\s*-?\d+(\.\d+)?\s*°?[FCfc]?\s*[-–to]+\s*-?\d+(\.\d+)?\s*°?[FCfc]?\s*$")
_HOURS_RE = re.compile(r"^\d+$")


@app.post("/api/validate")
def validate(req: ValidateRequest):
    v = (req.value or "").strip()
    if req.field == "temperatureRange":
        if not v: return {"ok": False, "error": "A value is required"}
        if not _TEMP_RE.match(v): return {"ok": False, "error": "Invalid format"}
        return {"ok": True}
    if req.field == "earlyCheckInHours":
        if not v: return {"ok": False, "error": "A value is required"}
        if not _HOURS_RE.match(v): return {"ok": False, "error": "Numbers only"}
        return {"ok": True}
    if req.field in ("earlyCheckInInstruction", "confirmationText"):
        if not v: return {"ok": False, "error": "A value is required"}
        return {"ok": True}
    return {"ok": True}


@app.post("/api/qrcode")
def generate_qr(user: User = Depends(_require_admin)):
    settings = _settings_for(user.org_id)
    token = uuid.uuid4().hex
    payload = f"hive://driver-checkin/{user.org_id}?token={token}"
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return {
        "title": f"QR Code for {settings.organizationName} Driver Check In Access",
        "payload": payload,
        "imageDataUrl": f"data:image/png;base64,{b64}",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Mobile-projection endpoint (Flow 10) — returns only enabled fields/steps
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/mobile/settings")
def mobile_settings(org: str = "org-greenbay"):
    s = _settings_for(org)
    out = {
        "organizationName": s.organizationName,
        "fields": [],
        "steps": [],
        "confirmation": None,
    }
    # Identity fields the mobile app collects from the driver
    out["fields"].append({"key": "driverName", "label": "Driver Name", "required": True})
    if s.driverId:
        out["fields"].append({"key": "driverId", "label": "Driver ID", "required": True})
    out["fields"].append({"key": "driverPhone", "label": "Phone Number", "required": True})
    out["fields"].append({"key": "truckNumber", "label": "Truck Number", "required": True})

    if s.carrierApproval:
        out["steps"].append({"key": "carrierApproval", "title": "Carrier Approval"})
    if s.temperatureEnabled:
        out["steps"].append({
            "key": "temperatureAck",
            "title": "Temperature Acknowledgement",
            "range": s.temperatureRange,
        })
    if s.earlyCheckInEnabled:
        out["steps"].append({
            "key": "earlyCheckIn",
            "title": "Early Check In",
            "hours": s.earlyCheckInHours,
            "instruction": s.earlyCheckInInstruction,
        })
    if s.confirmationEnabled:
        out["confirmation"] = s.confirmationText
    return out


@app.get("/")
def root():
    return {"service": "Driver Check In Admin API", "docs": "/docs"}
