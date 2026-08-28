import io
import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient


# -------------------------------------------------------------------
# Fixtures
# -------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def sample_csv_bytes():
    """A tiny but realistic CSV that has both categorical and numeric columns."""
    content = (
        "Region,Product,Revenue,Units\n"
        "North,Laptop,1200,5\n"
        "South,Phone,800,10\n"
        "North,Phone,600,8\n"
        "East,Laptop,1500,6\n"
        "South,Laptop,900,4\n"
        "East,Phone,700,9\n"
    )
    return content.encode("utf-8")


@pytest.fixture
def registered_client(api_client):
    """Register a user and return an authenticated client + user info."""
    credentials = {"name": "Test User", "email": "test@example.com", "password": "strongpass123"}
    api_client.post("/api/auth/register/", credentials, format="json")
    return api_client, credentials


# -------------------------------------------------------------------
# Auth Tests
# -------------------------------------------------------------------

@pytest.mark.django_db
class TestRegisterView:
    def test_register_success(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"name": "Jane Doe", "email": "jane@example.com", "password": "securepass123"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["email"] == "jane@example.com"
        assert User.objects.filter(username="jane@example.com").exists()

    def test_register_missing_email(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"password": "securepass123"},
            format="json",
        )
        assert response.status_code == 400
        assert "error" in response.data

    def test_register_missing_password(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"email": "test2@example.com"},
            format="json",
        )
        assert response.status_code == 400

    def test_register_duplicate_email(self, api_client):
        payload = {"name": "User", "email": "dup@example.com", "password": "pass12345"}
        api_client.post("/api/auth/register/", payload, format="json")
        response = api_client.post("/api/auth/register/", payload, format="json")
        assert response.status_code == 400
        assert "already exists" in response.data["error"]


@pytest.mark.django_db
class TestLoginView:
    def test_login_success(self, registered_client):
        client, creds = registered_client
        response = client.post(
            "/api/auth/login/",
            {"email": creds["email"], "password": creds["password"]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["email"] == creds["email"]

    def test_login_wrong_password(self, registered_client):
        client, creds = registered_client
        response = client.post(
            "/api/auth/login/",
            {"email": creds["email"], "password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(
            "/api/auth/login/",
            {"email": "nobody@example.com", "password": "nope"},
            format="json",
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestLogoutView:
    def test_logout_success(self, registered_client):
        client, _ = registered_client
        response = client.post("/api/auth/logout/", format="json")
        assert response.status_code == 200
        assert response.data["message"] == "Logged out successfully"


# -------------------------------------------------------------------
# Dataset Upload Tests
# -------------------------------------------------------------------

@pytest.mark.django_db
class TestUploadDatasetView:
    def _get_authenticated_client(self, api_client):
        creds = {"name": "Uploader", "email": "uploader@example.com", "password": "pass123456"}
        res = api_client.post("/api/auth/register/", creds, format="json")
        # Inject auth cookie manually
        token = res.cookies.get("access_token")
        if token:
            api_client.cookies["access_token"] = token.value
        return api_client

    def test_upload_valid_csv(self, api_client, sample_csv_bytes):
        client = self._get_authenticated_client(api_client)
        csv_file = SimpleUploadedFile("sales.csv", sample_csv_bytes, content_type="text/csv")
        response = client.post("/api/upload/", {"file": csv_file}, format="multipart")
        assert response.status_code == 200
        assert response.data["rows_processed"] == 6
        assert response.data["total_columns"] == 4
        # Backend should detect correct column types
        assert "Region" in response.data["columns_metadata"]["categorical"]
        assert "Revenue" in response.data["columns_metadata"]["numeric"]

    def test_upload_wrong_format(self, api_client):
        client = self._get_authenticated_client(api_client)
        bad_file = SimpleUploadedFile("data.txt", b"not a csv", content_type="text/plain")
        response = client.post("/api/upload/", {"file": bad_file}, format="multipart")
        assert response.status_code == 400
        assert "error" in response.data

    def test_upload_no_file(self, api_client):
        client = self._get_authenticated_client(api_client)
        response = client.post("/api/upload/", {}, format="multipart")
        assert response.status_code == 400

    def test_upload_requires_auth(self, api_client):
        csv_file = SimpleUploadedFile("sales.csv", b"a,b\n1,2", content_type="text/csv")
        response = api_client.post("/api/upload/", {"file": csv_file}, format="multipart")
        # Should be 401 since no auth cookie
        assert response.status_code == 401


# -------------------------------------------------------------------
# Analysis Tests
# -------------------------------------------------------------------

@pytest.mark.django_db
class TestAnalyzeDatasetView:
    def _upload_dataset(self, api_client, sample_csv_bytes):
        creds = {"name": "Analyst", "email": "analyst@example.com", "password": "pass123456"}
        res = api_client.post("/api/auth/register/", creds, format="json")
        token = res.cookies.get("access_token")
        if token:
            api_client.cookies["access_token"] = token.value

        csv_file = SimpleUploadedFile("sales.csv", sample_csv_bytes, content_type="text/csv")
        upload_res = api_client.post("/api/upload/", {"file": csv_file}, format="multipart")
        assert upload_res.status_code == 200
        return api_client, upload_res.data["dataset_id"]

    def test_analyze_sum(self, api_client, sample_csv_bytes):
        client, dataset_id = self._upload_dataset(api_client, sample_csv_bytes)
        response = client.post(
            "/api/analyze/",
            {"dataset_id": dataset_id, "x_col": "Region", "y_col": "Revenue", "agg_func": "sum"},
            format="json",
        )
        assert response.status_code == 200
        chart = {row["name"]: row["value"] for row in response.data["chart_data"]}
        # North: 1200+600=1800, South: 800+900=1700, East: 1500+700=2200
        assert chart["North"] == 1800
        assert chart["South"] == 1700
        assert chart["East"] == 2200

    def test_analyze_mean(self, api_client, sample_csv_bytes):
        client, dataset_id = self._upload_dataset(api_client, sample_csv_bytes)
        response = client.post(
            "/api/analyze/",
            {"dataset_id": dataset_id, "x_col": "Product", "y_col": "Units", "agg_func": "mean"},
            format="json",
        )
        assert response.status_code == 200
        chart = {row["name"]: row["value"] for row in response.data["chart_data"]}
        # Laptop: (5+6+4)/3=5.0, Phone: (10+8+9)/3=9.0
        assert chart["Laptop"] == 5.0
        assert chart["Phone"] == 9.0

    def test_analyze_invalid_column(self, api_client, sample_csv_bytes):
        client, dataset_id = self._upload_dataset(api_client, sample_csv_bytes)
        response = client.post(
            "/api/analyze/",
            {"dataset_id": dataset_id, "x_col": "NonExistentCol", "y_col": "Revenue", "agg_func": "sum"},
            format="json",
        )
        assert response.status_code == 400

    def test_analyze_missing_params(self, api_client, sample_csv_bytes):
        client, dataset_id = self._upload_dataset(api_client, sample_csv_bytes)
        response = client.post(
            "/api/analyze/",
            {"dataset_id": dataset_id},
            format="json",
        )
        assert response.status_code == 400


# -------------------------------------------------------------------
# Dataset CRUD Tests
# -------------------------------------------------------------------

@pytest.mark.django_db
class TestDatasetCRUD:
    def _setup(self, api_client, sample_csv_bytes):
        creds = {"name": "CRUD User", "email": "crud@example.com", "password": "pass123456"}
        res = api_client.post("/api/auth/register/", creds, format="json")
        token = res.cookies.get("access_token")
        if token:
            api_client.cookies["access_token"] = token.value
        csv_file = SimpleUploadedFile("sales.csv", sample_csv_bytes, content_type="text/csv")
        upload_res = api_client.post("/api/upload/", {"file": csv_file}, format="multipart")
        return api_client, upload_res.data["dataset_id"]

    def test_list_datasets(self, api_client, sample_csv_bytes):
        client, _ = self._setup(api_client, sample_csv_bytes)
        response = client.get("/api/datasets/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == "sales.csv"

    def test_dataset_data_preview(self, api_client, sample_csv_bytes):
        client, dataset_id = self._setup(api_client, sample_csv_bytes)
        response = client.get(f"/api/datasets/{dataset_id}/data/")
        assert response.status_code == 200
        assert response.data["total_rows"] == 6
        assert "Region" in response.data["columns"]
        assert len(response.data["rows"]) == 6

    def test_delete_dataset(self, api_client, sample_csv_bytes):
        client, dataset_id = self._setup(api_client, sample_csv_bytes)
        del_response = client.delete(f"/api/datasets/{dataset_id}/")
        assert del_response.status_code == 200
        # Confirm it's gone
        list_response = client.get("/api/datasets/")
        assert len(list_response.data) == 0

    def test_delete_other_users_dataset(self, api_client, sample_csv_bytes):
        """A user should not be able to delete another user's dataset."""
        client, dataset_id = self._setup(api_client, sample_csv_bytes)
        # Log in as a different user
        other_client = APIClient()
        other_creds = {"name": "Other", "email": "other@example.com", "password": "pass123456"}
        res2 = other_client.post("/api/auth/register/", other_creds, format="json")
        token2 = res2.cookies.get("access_token")
        if token2:
            other_client.cookies["access_token"] = token2.value
        del_response = other_client.delete(f"/api/datasets/{dataset_id}/")
        assert del_response.status_code == 404
