import io
import pandas as pd
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Dataset


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def set_auth_cookie(response, token):
    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        value=token,
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        max_age=60 * 60,  # 1 hour
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({"error": "An account with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email, email=email, password=password, first_name=name
        )
        tokens = get_tokens_for_user(user)
        response = Response({"message": "Registration successful", "email": email})
        set_auth_cookie(response, tokens['access'])
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        from django.contrib.auth import authenticate
        user = authenticate(username=email, password=password)

        if user is not None:
            tokens = get_tokens_for_user(user)
            response = Response({"message": "Login successful", "email": email})
            set_auth_cookie(response, tokens['access'])
            return response

        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        return response


class UploadDatasetView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {"error": "No file provided. Please attach a CSV file with key 'file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not file_obj.name.endswith('.csv'):
            return Response(
                {"error": "Invalid file type. Please upload a .csv file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Read file bytes into memory buffer then parse with pandas
            content = file_obj.read()
            df = pd.read_csv(io.BytesIO(content))

            rows = len(df)
            cols = len(df.columns)

            # Save metadata to database
            Dataset.objects.create(
                user=request.user,
                name=file_obj.name,
                rows_processed=rows,
                total_columns=cols,
            )

            # Build chart data based on real column stats
            numeric_cols = df.select_dtypes(include='number').columns.tolist()
            chart_data = []
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            chunk = max(1, rows // 7)
            for i, day in enumerate(days):
                start = i * chunk
                end = min(start + chunk, rows)
                slice_df = df.iloc[start:end]
                uploads = len(slice_df)
                errors = int(slice_df.isnull().any(axis=1).sum()) if uploads > 0 else 0
                chart_data.append({'name': day, 'uploads': uploads, 'errors': errors})

            return Response({
                "rows_processed": rows,
                "total_columns": cols,
                "columns": list(df.columns),
                "data_quality": f"{round((1 - df.isnull().values.mean()) * 100, 1)}%",
                "chart_data": chart_data,
            })

        except Exception as e:
            return Response(
                {"error": f"Failed to parse CSV: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
