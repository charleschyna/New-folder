from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/lessons/', include('apps.lessons.urls')),
    path('api/ai/', include('apps.ai_engine.urls')),
]
