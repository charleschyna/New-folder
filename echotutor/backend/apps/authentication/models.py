from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Extended user model that stores EchoTutor learning preferences,
    accessibility settings, and avatar configuration.
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    # ── Learning preferences ──────────────────────────────────────────
    preferred_pace = models.CharField(
        max_length=20,
        choices=[('slow', 'Slow'), ('normal', 'Normal'), ('fast', 'Fast')],
        default='normal',
    )
    learning_style = models.CharField(
        max_length=20,
        choices=[
            ('visual', 'Visual'),
            ('auditory', 'Auditory'),
            ('reading', 'Reading'),
            ('kinesthetic', 'Kinesthetic'),
        ],
        default='auditory',
    )
    favorite_subjects = models.JSONField(default=list, blank=True)

    # ── Accessibility ─────────────────────────────────────────────────
    high_contrast = models.BooleanField(default=False)
    large_text = models.BooleanField(default=False)
    dyslexia_font = models.BooleanField(default=False)
    voice_only_mode = models.BooleanField(default=False)
    reduce_motion = models.BooleanField(default=False)

    # ── Avatar config ─────────────────────────────────────────────────
    avatar_id = models.CharField(max_length=100, default='amy-jOIioTgQkXA')
    tutor_name = models.CharField(max_length=50, default='Echo')

    # ── Meta ──────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_accessibility_settings(self):
        return {
            'high_contrast': self.high_contrast,
            'large_text': self.large_text,
            'dyslexia_font': self.dyslexia_font,
            'voice_only_mode': self.voice_only_mode,
            'reduce_motion': self.reduce_motion,
        }
