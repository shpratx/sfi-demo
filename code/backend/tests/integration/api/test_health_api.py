"""Integration tests for health endpoints."""

from starlette.testclient import TestClient


def test_health_returns_200(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_ready_returns_200(client: TestClient):
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    assert "status" in resp.json()
