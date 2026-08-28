from django.urls import path
from .views import RegisterView, LoginView, LogoutView, UploadDatasetView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('upload/', UploadDatasetView.as_view(), name='upload'),
]
