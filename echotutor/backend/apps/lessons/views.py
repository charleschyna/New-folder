from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import LessonSession, Subject, LearningProgress
from .serializers import (
    LessonSessionSerializer,
    LessonSessionSummarySerializer,
    SubjectSerializer,
    LearningProgressSerializer,
)


class SubjectListView(generics.ListAPIView):
    """GET /api/lessons/subjects/ — list all available subjects."""
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    queryset = Subject.objects.filter(is_active=True)


class LessonHistoryView(generics.ListAPIView):
    """GET /api/lessons/history/ — paginated lesson history for the user."""
    serializer_class = LessonSessionSummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonSession.objects.filter(
            user=self.request.user
        ).order_by('-started_at')[:50]


class LessonSessionCreateView(APIView):
    """POST /api/lessons/sessions/ — open a new lesson session."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get('topic', '').strip()
        subject = request.data.get('subject', 'General')

        if not topic:
            return Response(
                {'error': 'Please provide a topic to study.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = LessonSession.objects.create(
            user=request.user,
            topic=topic,
            subject=subject,
        )
        session.add_message('user', topic)
        return Response(LessonSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class LessonSessionDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/lessons/sessions/<id>/ — retrieve or update a session."""
    serializer_class = LessonSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonSession.objects.filter(user=self.request.user)


class EndSessionView(APIView):
    """POST /api/lessons/sessions/<id>/end/ — mark a session as completed."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = LessonSession.objects.get(pk=pk, user=request.user)
        except LessonSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        session.status = 'completed'
        session.ended_at = timezone.now()
        duration = request.data.get('duration_seconds', 0)
        session.duration_seconds = duration
        session.save(update_fields=['status', 'ended_at', 'duration_seconds'])

        return Response({'message': 'Session completed. Great work! 🌟'})


class LearningProgressView(generics.ListAPIView):
    """GET /api/lessons/progress/ — learning progress per subject."""
    serializer_class = LearningProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LearningProgress.objects.filter(user=self.request.user).select_related('subject')
