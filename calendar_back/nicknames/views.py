from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, ParseError, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Nickname
from .serializers import AddNicknameSerializer
from teams.models import Team


class Nicknames(APIView):
    # permission_classes = [IsAuthenticated]

    def get_team(self, team_id):
        try:
            return Team.objects.get(id=team_id)
        except:
            raise NotFound("존재하지 않는 팀입니다.")

    def post(self, request, team_id):
        serializer = AddNicknameSerializer(data=request.data)
        team = self.get_team(team_id)

        if Nickname.objects.filter(
            team=team,
            nickname=request.data["nickname"],
        ).exists():
            raise ValidationError("중복된 닉네임입니다.")

        # if serializer.is_valid():
        #     serializer.save(
        #         user=request.user,
        #         team=team,
        #     )
        #     return Response(status=status.HTTP_200_OK)

        # start for testing
        from users.models import User

        user = User.objects.get(id=1)
        if serializer.is_valid():
            serializer.save(
                user=user,
                team=team,
            )
            return Response(status=status.HTTP_200_OK)
        # end for testing
        raise ParseError("잘못된 요청입니다.")

    def put(self, request, team_id):
        team = self.get_team(team_id)
        try:
            nickname = request.data["nickname"]
        except:
            raise ParseError("닉네임을 입력해주세요")

        if Nickname.objects.filter(
            team=team,
            nickname=nickname,
        ).exists():
            raise ValidationError("중복된 닉네임입니다.")

        return Response(status=status.HTTP_200_OK)
