from django.urls import path
from . import views

urlpatterns = [
    path("signup/", views.Signup.as_view()),
    path("login/", views.Login.as_view()),
    path("logout/", views.Logout.as_view()),
    path("idcheck/", views.CheckUsername.as_view()),
    path("myinfo/<str:username>/", views.UserInfo.as_view()),
]
