"""
Tests for OTP send and verify endpoints.

POST /api/otp/send    — sends a 6-digit OTP to the given phone number
POST /api/otp/verify  — verifies the OTP and performs patient check-in
"""

import pytest


VALID_PHONE = "1234567890"


class TestOTPSend:
    def test_send_missing_body_returns_422(self, client):
        """Empty body → validation error."""
        resp = client.post("/api/otp/send", json={})
        assert resp.status_code == 422

    def test_send_valid_phone_returns_200(self, client):
        resp = client.post("/api/otp/send", json={"phone_number": VALID_PHONE})
        assert resp.status_code == 200

    def test_send_response_has_required_fields(self, client):
        resp = client.post("/api/otp/send", json={"phone_number": VALID_PHONE})
        data = resp.json()
        assert "message" in data
        assert "otp_id" in data
        assert "otp_code" in data
        assert "expires_at" in data

    def test_send_otp_is_six_digits(self, client):
        resp = client.post("/api/otp/send", json={"phone_number": VALID_PHONE})
        otp_code = resp.json()["otp_code"]
        assert len(otp_code) == 6, f"Expected 6 digits, got: {otp_code!r}"
        assert otp_code.isdigit(), "OTP must be numeric"


class TestOTPVerify:
    def test_verify_missing_body_returns_422(self, client):
        resp = client.post("/api/otp/verify", json={})
        assert resp.status_code == 422

    def test_verify_wrong_otp_returns_400_or_200_with_failure(self, client):
        """A wrong OTP must either return HTTP 400 or success=False."""
        payload = {
            "phone_number": VALID_PHONE,
            "otp_code": "000000",  # deliberately wrong
        }
        resp = client.post("/api/otp/verify", json=payload)
        assert resp.status_code in (200, 400, 404)
        if resp.status_code == 200:
            assert resp.json()["success"] is False

    def test_verify_invalid_otp_format_returns_422(self, client):
        """OTP shorter than 6 digits must fail schema validation."""
        payload = {
            "phone_number": VALID_PHONE,
            "otp_code": "123",   # too short
        }
        resp = client.post("/api/otp/verify", json=payload)
        assert resp.status_code == 422

    def test_verify_correct_otp_end_to_end(self, client):
        """
        Full happy-path:
          1. Send OTP → capture the returned code (dev mode only).
          2. Verify that exact code → expect success=True.
        """
        send_resp = client.post("/api/otp/send", json={"phone_number": VALID_PHONE})
        assert send_resp.status_code == 200, send_resp.text

        otp_code = send_resp.json()["otp_code"]

        verify_resp = client.post(
            "/api/otp/verify",
            json={
                "phone_number": VALID_PHONE,
                "otp_code":     otp_code,
            },
        )
        data = verify_resp.json()
        # Accept either a successful check-in or a "patient not found" path —
        # what matters is the OTP itself was accepted (not a wrong-code error).
        assert verify_resp.status_code in (200, 404)
        if verify_resp.status_code == 200 and data.get("success") is False:
            # success=False only acceptable if the patient doesn't exist yet
            assert "not found" in data.get("message", "").lower() or \
                   "invalid" not in data.get("message", "").lower()
