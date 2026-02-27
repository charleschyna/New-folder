from django.urls import path
from .views import GreetingView, TeachView, InterruptView, CommandView

urlpatterns = [
    path('greeting/', GreetingView.as_view(), name='ai-greeting'),
    path('teach/', TeachView.as_view(), name='ai-teach'),
    path('interrupt/', InterruptView.as_view(), name='ai-interrupt'),
    path('command/', CommandView.as_view(), name='ai-command'),
]
