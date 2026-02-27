from django.contrib import admin
from .models import LessonSession, Subject, LearningProgress


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('icon', 'name', 'color', 'is_active', 'order')
    list_editable = ('is_active', 'order')
    search_fields = ('name',)


@admin.register(LessonSession)
class LessonSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'subject', 'status', 'duration_seconds', 'started_at')
    list_filter = ('status', 'subject')
    search_fields = ('user__email', 'topic')
    readonly_fields = ('started_at', 'updated_at')


@admin.register(LearningProgress)
class LearningProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'sessions_count', 'total_minutes', 'mastery_level')
    list_filter = ('subject',)
