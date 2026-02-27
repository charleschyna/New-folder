from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.lessons.models import LessonSession
from .teaching_engine import (
    generate_greeting,
    generate_lesson,
    respond_to_interruption,
    handle_command,
)


class GreetingView(APIView):
    """
    GET /api/ai/greeting/
    Returns a warm personalised spoken greeting for the avatar.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        last_session = (
            LessonSession.objects
            .filter(user=user)
            .order_by('-started_at')
            .first()
        )
        last_topic = last_session.topic if last_session else None
        total_sessions = LessonSession.objects.filter(user=user).count()

        greeting = generate_greeting(
            student_name=user.first_name,
            last_topic=last_topic,
            total_sessions=total_sessions,
        )

        return Response({
            'greeting': greeting,
            'student_name': user.first_name,
            'tutor_name': user.tutor_name,
            'avatar_id': user.avatar_id,
        })


class TeachView(APIView):
    """
    POST /api/ai/teach/
    Generate a full structured lesson for a given topic.

    Request body:
        topic        (str) required
        session_id   (int) optional — attach blocks to an existing session
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get('topic', '').strip()
        session_id = request.data.get('session_id')

        if not topic:
            return Response(
                {'error': 'Please provide a topic to teach.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        conversation_history = []

        if session_id:
            try:
                session = LessonSession.objects.get(pk=session_id, user=user)
                conversation_history = session.conversation or []
                session.add_message('user', topic)
            except LessonSession.DoesNotExist:
                pass

        blocks = generate_lesson(
            topic=topic,
            student_name=user.first_name,
            pace=user.preferred_pace,
            style=user.learning_style,
            conversation_history=conversation_history,
        )

        # Save blocks back to session
        if session_id:
            try:
                session = LessonSession.objects.get(pk=session_id, user=user)
                session.lesson_blocks = blocks
                session.save(update_fields=['lesson_blocks', 'updated_at'])
            except LessonSession.DoesNotExist:
                pass

        return Response({
            'topic': topic,
            'blocks': blocks,
            'total_blocks': len(blocks),
        })


class InterruptView(APIView):
    """
    POST /api/ai/interrupt/
    Respond to a student mid-lesson interruption.

    Request body:
        question     (str) required
        context      (str) optional — current lesson context / last speech block
        session_id   (int) optional
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        context = request.data.get('context', '')
        session_id = request.data.get('session_id')

        if not question:
            return Response(
                {'error': 'Please provide the student question.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        conversation_history = []

        if session_id:
            try:
                session = LessonSession.objects.get(pk=session_id, user=user)
                conversation_history = session.conversation or []
                session.add_message('user', question)
                session.interruptions_count += 1
                session.save(update_fields=['interruptions_count', 'updated_at'])
            except LessonSession.DoesNotExist:
                pass

        blocks = respond_to_interruption(
            question=question,
            context=context,
            student_name=user.first_name,
            conversation_history=conversation_history,
        )

        return Response({
            'question': question,
            'blocks': blocks,
        })


class CommandView(APIView):
    """
    POST /api/ai/command/
    Handle a named voice command: repeat, slower, faster, example, summarize, why, steps.

    Request body:
        command    (str) required
        context    (str) optional
    """
    permission_classes = [IsAuthenticated]

    VALID_COMMANDS = {'repeat', 'slower', 'faster', 'example', 'summarize', 'why', 'steps'}

    def post(self, request):
        command = request.data.get('command', '').strip().lower()
        context = request.data.get('context', '')

        if command not in self.VALID_COMMANDS:
            return Response(
                {'error': f"Unknown command. Valid: {', '.join(self.VALID_COMMANDS)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocks = handle_command(
            command=command,
            context=context,
            student_name=request.user.first_name,
        )

        return Response({'command': command, 'blocks': blocks})
