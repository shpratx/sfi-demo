"""QR code and PDF generation service."""

import io
from uuid import UUID

import qrcode  # type: ignore[import-untyped]
from reportlab.lib.pagesizes import A4  # type: ignore[import-untyped]
from reportlab.lib.units import mm  # type: ignore[import-untyped]
from reportlab.lib.utils import ImageReader  # type: ignore[import-untyped]
from reportlab.pdfgen import canvas  # type: ignore[import-untyped]
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.domain.models.organization import Organization

_BASE_URL = "https://hive.schreiber.com/checkin"


class QrService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _get_org(self, org_id: UUID) -> Organization:
        org = self.db.query(Organization).filter(
            Organization.id == org_id, Organization.is_deleted.is_(False)
        ).first()
        if not org:
            raise NotFoundError("Organization not found")
        return org

    def generate_qr(self, org_id: UUID) -> bytes:
        self._get_org(org_id)
        url = f"{_BASE_URL}/{org_id}"
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image()
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def generate_pdf(self, org_id: UUID) -> bytes:
        org = self._get_org(org_id)
        url = f"{_BASE_URL}/{org_id}"

        # Generate QR image
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        qr_img = qr.make_image()
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)

        # Build PDF
        pdf_buf = io.BytesIO()
        c = canvas.Canvas(pdf_buf, pagesize=A4)
        w, h = A4

        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(w / 2, h - 60, org.name)

        # Centered QR
        qr_size = 80 * mm
        c.drawImage(ImageReader(qr_buf), (w - qr_size) / 2, (h - qr_size) / 2, qr_size, qr_size)

        # Footer URL
        c.setFont("Helvetica", 10)
        c.drawCentredString(w / 2, 40, url)

        c.save()
        return pdf_buf.getvalue()
