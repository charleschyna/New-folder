from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'preferred_pace', 'learning_style', 'created_at')
    list_filter = ('preferred_pace', 'learning_style', 'high_contrast', 'dyslexia_font')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Learning Preferences', {
            'fields': ('preferred_pace', 'learning_style', 'favorite_subjects'),
        }),
        ('Accessibility', {
            'fields': ('high_contrast', 'large_text', 'dyslexia_font', 'voice_only_mode', 'reduce_motion'),
        }),
        ('Avatar', {
            'fields': ('avatar_id', 'tutor_name'),
        }),
    )
