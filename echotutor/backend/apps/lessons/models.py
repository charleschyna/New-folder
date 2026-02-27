from django.db import models
from django.conf import settings


class LessonSession(models.Model):
    """
    Represents a single tutoring session between a user and EchoTutor.
    Stores the topic, generated lesson blocks, conversation history,
    and session metadata.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    topic = models.CharField(max_length=500)
    subject = models.CharField(max_length=100, default='General')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # AI-generated lesson stored as structured JSON blocks
    lesson_blocks = models.JSONField(default=list)

    # Full conversation transcript
    conversation = models.JSONField(default=list)

    # Learning stats
    duration_seconds = models.IntegerField(default=0)
    blocks_completed = models.IntegerField(default=0)
    interruptions_count = models.IntegerField(default=0)
    comprehension_score = models.FloatField(null=True, blank=True)

    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.full_name} — {self.topic[:50]} ({self.status})"

    def add_message(self, role, content):
        """Append a message to the conversation transcript."""
        self.conversation.append({'role': role, 'content': content})
        self.save(update_fields=['conversation', 'updated_at'])


class Subject(models.Model):
    """Predefined subjects available in EchoTutor."""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=10, default='📚')
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#6C63FF')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'subjects'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.icon} {self.name}"


class LearningProgress(models.Model):
    """Tracks per-user progress on each subject over time."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress',
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    sessions_count = models.IntegerField(default=0)
    total_minutes = models.IntegerField(default=0)
    last_session = models.DateTimeField(null=True, blank=True)
    mastery_level = models.FloatField(default=0.0)  # 0.0 – 1.0

    class Meta:
        db_table = 'learning_progress'
        unique_together = ('user', 'subject')

    def __str__(self):
        return f"{self.user.full_name} — {self.subject.name}"
