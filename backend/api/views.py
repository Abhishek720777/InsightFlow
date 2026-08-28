import pandas as pd
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Dataset

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def set_cookie(response, key, value):
    response.set_cookie(
        key=key,
        value=value,
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
    )

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        tokens = get_tokens_for_user(user)
        
        response = Response({"message": "Registration successful"})
        set_cookie(response, settings.SIMPLE_JWT['AUTH_COOKIE'], tokens['access'])
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
            response = Response({"message": "Login successful"})
            set_cookie(response, settings.SIMPLE_JWT['AUTH_COOKIE'], tokens['access'])
            return response
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        return response

class UploadDatasetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
            
        dataset = Dataset.objects.create(
            user=request.user,
            name=file.name,
            file=file
        )
        
        try:
            df = pd.read_csv(file)
            dataset.rows_processed = len(df)
            dataset.total_columns = len(df.columns)
            dataset.save()
            
            # Simple trend simulation for MVP based on rows
            mock_chart = [
                { 'name': 'Mon', 'uploads': len(df) % 10 + 2, 'errors': 0 },
                { 'name': 'Tue', 'uploads': len(df) % 8 + 4, 'errors': 1 },
                { 'name': 'Wed', 'uploads': len(df) % 15 + 1, 'errors': 0 },
                { 'name': 'Thu', 'uploads': len(df) % 12 + 3, 'errors': 2 },
                { 'name': 'Fri', 'uploads': len(df) % 20 + 2, 'errors': 0 },
            ]
            
            return Response({
                "rows_processed": dataset.rows_processed,
                "total_columns": dataset.total_columns,
                "data_quality": "99.9%", # Mock quality metric
                "chart_data": mock_chart
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
