from django.urls import path
from .views import (
    SubjectListView,
    LessonHistoryView,
    LessonSessionCreateView,
    LessonSessionDetailView,
    EndSessionView,
    LearningProgressView,
)

urlpatterns = [
    path('subjects/', SubjectListView.as_view(), name='lessons-subjects'),
    path('history/', LessonHistoryView.as_view(), name='lessons-history'),
    path('sessions/', LessonSessionCreateView.as_view(), name='lessons-sessions-create'),
    path('sessions/<int:pk>/', LessonSessionDetailView.as_view(), name='lessons-sessions-detail'),
    path('sessions/<int:pk>/end/', EndSessionView.as_view(), name='lessons-sessions-end'),
    path('progress/', LearningProgressView.as_view(), name='lessons-progress'),
]
