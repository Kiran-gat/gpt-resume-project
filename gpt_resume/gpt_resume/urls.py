"""
URL configuration for gpt_resume project.

The `urlpatterns` list routes URLs to views.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse


def health_check(request):
    """
    Simple health-check endpoint used during development and smoke tests.
    Returns a plain text "OK" response.
    """
    return HttpResponse("OK", content_type="text/plain")


urlpatterns = [
    # Admin dashboard
    path("admin/", admin.site.urls),

    # API routes (all routes inside gpt_resume/api/urls.py)
    path("api/", include("api.urls")),

    # Root health-check endpoint
    path("", health_check, name="health"),
]


# ✅ Serve media files during development
# Django will serve from MEDIA_ROOT when DEBUG=True
# Example: http://localhost:8000/media/resume/<filename>.pdf
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ✅ Optional: serve static files (CSS/JS) if needed in development
# This helps if you ever have a frontend template or static admin files
urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / "static")
