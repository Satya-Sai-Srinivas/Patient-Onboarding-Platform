"""
Tests for the /health, / (root), and /info endpoints.
"""


class TestRootEndpoint:
    def test_root_returns_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_root_contains_service_name(self, client):
        data = client.get("/").json()
        assert "service" in data
        assert "Healthcare" in data["service"]

    def test_root_contains_version(self, client):
        data = client.get("/").json()
        assert "version" in data

    def test_root_contains_websocket_endpoints(self, client):
        data = client.get("/").json()
        assert "websocket_endpoints" in data
        assert isinstance(data["websocket_endpoints"], list)


class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_has_required_fields(self, client):
        data = client.get("/health").json()
        assert "status" in data
        assert "db" in data
        assert "version" in data
        assert "timestamp" in data

    def test_health_db_ok_with_sqlite(self, client):
        """SQLite test DB is always reachable so db field must be 'ok'."""
        data = client.get("/health").json()
        assert data["db"] == "ok"
        assert data["status"] == "healthy"


class TestInfoEndpoint:
    def test_info_returns_200(self, client):
        resp = client.get("/info")
        assert resp.status_code == 200

    def test_info_has_features(self, client):
        data = client.get("/info").json()
        assert "features" in data
        features = data["features"]
        assert "realtime" in features
        assert "websockets" in features

    def test_info_has_stats(self, client):
        data = client.get("/info").json()
        assert "stats" in data
        assert "routers_loaded" in data["stats"]
