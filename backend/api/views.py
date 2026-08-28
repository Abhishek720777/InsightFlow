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
    authentication_classes = []
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
    authentication_classes = []
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
    authentication_classes = []
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
            # Save to dataset model
            dataset = Dataset.objects.create(
                user=request.user,
                name=file_obj.name,
                file=file_obj
            )
            
            # Read file with pandas
            df = pd.read_csv(dataset.file.path)
            rows = len(df)
            cols = len(df.columns)
            
            # Determine column types
            numeric_cols = df.select_dtypes(include='number').columns.tolist()
            categorical_cols = df.select_dtypes(exclude='number').columns.tolist()
            
            columns_metadata = {
                'numeric': numeric_cols,
                'categorical': categorical_cols
            }
            
            dataset.rows_processed = rows
            dataset.total_columns = cols
            dataset.columns_metadata = columns_metadata
            dataset.save()

            return Response({
                "dataset_id": dataset.id,
                "rows_processed": rows,
                "total_columns": cols,
                "columns_metadata": columns_metadata,
                "data_quality": f"{round((1 - df.isnull().values.mean()) * 100, 1)}%",
            })

        except Exception as e:
            return Response(
                {"error": f"Failed to parse CSV: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class AnalyzeDatasetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        dataset_id = request.data.get('dataset_id')
        x_col = request.data.get('x_col')
        y_col = request.data.get('y_col')
        agg_func = request.data.get('agg_func', 'sum')

        if not all([dataset_id, x_col, y_col]):
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dataset = Dataset.objects.get(id=dataset_id, user=request.user)
            df = pd.read_csv(dataset.file.path)
            
            if x_col not in df.columns or y_col not in df.columns:
                return Response({"error": "Invalid column names"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Aggregate data
            if agg_func == 'sum':
                agg_df = df.groupby(x_col)[y_col].sum().reset_index()
            elif agg_func == 'mean':
                agg_df = df.groupby(x_col)[y_col].mean().reset_index()
            elif agg_func == 'count':
                agg_df = df.groupby(x_col)[y_col].count().reset_index()
            else:
                return Response({"error": "Invalid aggregation function"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Limit to top 20 for charting to avoid overflowing the UI
            agg_df = agg_df.head(20)
            
            chart_data = []
            for _, row in agg_df.iterrows():
                chart_data.append({
                    'name': str(row[x_col]),
                    'value': round(float(row[y_col]), 2) if pd.notnull(row[y_col]) else 0
                })
                
            return Response({"chart_data": chart_data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ListDatasetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        datasets = Dataset.objects.filter(user=request.user).order_by('-uploaded_at')
        data = []
        for ds in datasets:
            data.append({
                "id": ds.id,
                "name": ds.name,
                "uploaded_at": ds.uploaded_at,
                "rows_processed": ds.rows_processed,
                "total_columns": ds.total_columns,
            })
        return Response(data)

class DeleteDatasetView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk, user=request.user)
            if dataset.file:
                dataset.file.delete()
            dataset.delete()
            return Response({"message": "Dataset deleted successfully"})
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)

class DatasetDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk, user=request.user)
            if not dataset.file:
                return Response({"error": "No file associated with this dataset"}, status=status.HTTP_400_BAD_REQUEST)
                
            df = pd.read_csv(dataset.file.path)
            # Replace NaN with None so it serializes cleanly to JSON null
            df = df.where(pd.notnull(df), None)
            
            # Get first 100 rows
            preview_df = df.head(100)
            
            columns = list(df.columns)
            rows = preview_df.to_dict(orient='records')
            
            return Response({
                "columns": columns,
                "rows": rows,
                "total_rows": len(df)
            })
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
