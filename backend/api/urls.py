from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, 
    UploadDatasetView, AnalyzeDatasetView,
    ListDatasetsView, DeleteDatasetView, DatasetDataView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('upload/', UploadDatasetView.as_view(), name='upload'),
    path('analyze/', AnalyzeDatasetView.as_view(), name='analyze'),
    path('datasets/', ListDatasetsView.as_view(), name='list_datasets'),
    path('datasets/<int:pk>/', DeleteDatasetView.as_view(), name='delete_dataset'),
    path('datasets/<int:pk>/data/', DatasetDataView.as_view(), name='dataset_data'),
]
