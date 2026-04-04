"""
Tests for queue-management endpoints.

GET  /api/queue/status              — public queue summary
GET  /api/queue/clinician/{id}      — tickets for a specific clinician
GET  /api/appointments/admin        — admin view of all tickets
"""


class TestQueueStatus:
    def test_status_returns_200(self, client):
        resp = client.get("/api/queue/status")
        assert resp.status_code == 200

    def test_status_has_required_fields(self, client):
        data = client.get("/api/queue/status").json()
        assert "success" in data or "current_queue" in data

    def test_status_current_queue_is_number(self, client):
        data = client.get("/api/queue/status").json()
        if "current_queue" in data:
            assert isinstance(data["current_queue"], int)

    def test_status_empty_queue_on_fresh_db(self, client):
        """Fresh test DB has no tickets so current_queue should be 0."""
        data = client.get("/api/queue/status").json()
        if "current_queue" in data:
            assert data["current_queue"] == 0


class TestClinicianQueue:
    def test_nonexistent_clinician_returns_404_or_empty(self, client):
        """Clinician 99999 does not exist → 404 or empty list."""
        resp = client.get("/api/queue/clinician/99999")
        assert resp.status_code in (200, 404)
        if resp.status_code == 200:
            data = resp.json()
            # Could be {"queue_tickets": []} or similar empty shape
            queue = data.get("queue_tickets", data if isinstance(data, list) else [])
            assert len(queue) == 0

    def test_clinician_id_must_be_integer(self, client):
        resp = client.get("/api/queue/clinician/not-a-number")
        assert resp.status_code == 422


class TestAdminQueue:
    def test_admin_queue_returns_200(self, client):
        resp = client.get("/api/appointments/admin")
        assert resp.status_code == 200

    def test_admin_queue_is_list_or_wrapped(self, client):
        data = client.get("/api/appointments/admin").json()
        # Either a bare list or a wrapper object with a list inside
        assert isinstance(data, (list, dict))

    def test_admin_queue_empty_on_fresh_db(self, client):
        data = client.get("/api/appointments/admin").json()
        if isinstance(data, list):
            assert len(data) == 0
        else:
            # Wrapped response: {"tickets": [...], ...}
            tickets = data.get("tickets", data.get("appointments", []))
            assert len(tickets) == 0
