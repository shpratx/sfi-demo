"""QR code endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header
from fastapi.responses import Response as RawResponse
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.config import settings
from app.infrastructure.database import get_db
from app.service.qr_service import QrService

router = APIRouter(
    prefix=f"{settings.api_prefix}/driver-checkin/qr-code", tags=["qr-code"],
    dependencies=[Depends(require_admin)],
)


def _qr_service(db: Session = Depends(get_db)) -> QrService:
    return QrService(db)


@router.post("", response_class=RawResponse)
def generate_qr(
    x_organization_id: str = Header(...),
    svc: QrService = Depends(_qr_service),
) -> RawResponse:
    png = svc.generate_qr(UUID(x_organization_id))
    return RawResponse(content=png, media_type="image/png")


@router.get("/pdf", response_class=RawResponse)
def download_pdf(
    x_organization_id: str = Header(...),
    svc: QrService = Depends(_qr_service),
) -> RawResponse:
    pdf = svc.generate_pdf(UUID(x_organization_id))
    return RawResponse(
        content=pdf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=qr-code.pdf"},
    )
