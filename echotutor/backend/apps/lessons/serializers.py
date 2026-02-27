from rest_framework import serializers
from .models import LessonSession, Subject, LearningProgress


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ('id', 'name', 'icon', 'description', 'color')


class LessonSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = LessonSession
        fields = (
            'id', 'user_name', 'topic', 'subject', 'status',
            'lesson_blocks', 'conversation',
            'duration_seconds', 'duration_minutes',
            'blocks_completed', 'interruptions_count',
            'started_at', 'ended_at',
        )
        read_only_fields = ('id', 'user_name', 'started_at', 'duration_minutes')

    def get_user_name(self, obj):
        return obj.user.full_name

    def get_duration_minutes(self, obj):
        return round(obj.duration_seconds / 60, 1)


class LessonSessionSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for history lists."""
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = LessonSession
        fields = (
            'id', 'topic', 'subject', 'status',
            'duration_minutes', 'blocks_completed',
            'interruptions_count', 'started_at',
        )

    def get_duration_minutes(self, obj):
        return round(obj.duration_seconds / 60, 1)


class LearningProgressSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    mastery_percent = serializers.SerializerMethodField()

    class Meta:
        model = LearningProgress
        fields = (
            'subject', 'sessions_count', 'total_minutes',
            'last_session', 'mastery_level', 'mastery_percent',
        )

    def get_mastery_percent(self, obj):
        return round(obj.mastery_level * 100)
