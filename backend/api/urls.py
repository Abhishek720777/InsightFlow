from django.urls import path
from .views import RegisterView, LoginView, LogoutView, UploadDatasetView, AnalyzeDatasetView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('upload/', UploadDatasetView.as_view(), name='upload'),
    path('analyze/', AnalyzeDatasetView.as_view(), name='analyze'),
]
