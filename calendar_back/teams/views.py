from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
    ParseError,
    ValidationError,
)

from .serializers import TeamSerializer
from users.models import User
from nicknames.models import Nickname
from .models import Team
from nicknames.serializers import AddNicknameSerializer


class NewTeam(APIView):
    permission_classes = [IsAuthenticated]

    def get_team(self, team_id):
        try:
            return Team.objects.get(id=team_id)
        except:
            raise NotFound("존재하지 않는 팀입니다.")

    def post(self, request):  # 팀 생성
        team_serializer = TeamSerializer(data=request.data["team"])

        if request.data["team"]["teamname"] == "My":
            return Response(
                {"message": "사용할 수 없는 팀명입니다."}, status=status.HTTP_400_BAD_REQUEST
            )

        if team_serializer.is_valid():
            team = team_serializer.save(team_leader=request.user)
            team.members.add(request.user)
        else:
            return Response(team_serializer.errors)

        nickname_serializer = AddNicknameSerializer(data=request.data["nickname"])

        if nickname_serializer.is_valid():
            nickname = nickname_serializer.save(
                user=request.user,
                team=team,
            )
        else:
            return Response(nickname_serializer.errors)

        return Response(
            {
                "nickname": AddNicknameSerializer(nickname).data,
                "team": TeamSerializer(team).data,
            },
            status=status.HTTP_201_CREATED,
        )


class Teams(APIView):
    permission_classes = [IsAuthenticated]

    def get_team(self, team_id):
        try:
            return Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            raise NotFound("해당 팀이 없습니다.")

    def get_user(self, user):
        try:
            return User.objects.get(username=user)
        except User.DoesNotExist:
            raise NotFound("해당 사용자가 없습니다.")

    def post(self, request, team_id):  # 팀 탈퇴
        team = self.get_team(team_id)
        user = self.get_user(request.user)

        if not team.members.filter(id=user.id).exists():
            return Response(
                {"errors": "해당 팀에 소속된 사용자가 아닙니다."}, status=status.HTTP_400_BAD_REQUEST
            )

        team.members.remove(user)

        return Response(status=status.HTTP_200_OK)

    def put(self, request, team_id):  # 팀정보 수정
        team = self.get_team(team_id)

        serializer = TeamSerializer(
            team,
            data=request.data,
            partial=True,
        )

        if team.team_leader != request.user:
            raise PermissionDenied("팀 정보수정은 팀장만 가능합니다.")

        if serializer.is_valid():
            updated_team = serializer.save()
            return Response(
                TeamSerializer(updated_team).data, status=status.HTTP_200_OK
            )

        else:
            return Response(serializer.errors)

    def delete(self, request, team_id):  # 팀삭제
        team = self.get_team(team_id)

        if team.teamname == "My":
            return Response(
                {"message": "개인 캘린더는 삭제할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST
            )

        if team.team_leader != request.user:
            raise PermissionDenied("팀 삭제는 팀장만 가능합니다.")

        team.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


# 팀원 추가
class AddMembers(APIView):
    permission_classes = [IsAuthenticated]

    def get_team(self, team_id):
        try:
            return Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            raise NotFound("해당 팀이 없습니다.")

    def post(self, request, team_id):
        team = self.get_team(team_id)

        try:
            nickname = request.data["nickname"]
        except:
            raise ParseError("닉네임을 입력해주세요")

        if team.members.filter(id=request.user.id).exists():
            raise ParseError("이미 가입한 팀입니다.")

        if Nickname.objects.filter(
            team=team,
            nickname=nickname,
        ).exists():
            raise ParseError("중복된 닉네임입니다.")

        nickname_serializer = AddNicknameSerializer(data=request.data)

        if nickname_serializer.is_valid():
            nickname = nickname_serializer.save(
                user=request.user,
                team=team,
            )
        else:
            return Response(nickname_serializer.errors)

        team.members.add(request.user.id)

        return Response(
            {
                "team": TeamSerializer(team).data,
                "nickname": AddNicknameSerializer(nickname).data,
            },
            status=status.HTTP_202_ACCEPTED,
        )
