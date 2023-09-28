from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied, ParseError
from rest_framework.response import Response
from rest_framework import status

from .serializers import CommentSerializer, ScheduleCommentSerializer
from schedules.models import Schedule
from .models import Comment


# 댓글 작성
class NewComment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        try:
            schedule = Schedule.objects.get(id=request.data.get("schedule_id"))
        except Schedule.DoesNotExist:
            raise NotFound("해당하는 일정이 없습니다.")

        if serializer.is_valid():
            new_comment = serializer.save(author=request.user, schedule=schedule)
            return Response(
                CommentSerializer(new_comment).data,
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(serializer.errors)


# 특정 일정 댓글 조회
class GetComments(APIView):
    permission_classes = [IsAuthenticated]

    def get_schedule(self, schedule_id):
        try:
            return Schedule.objects.get(id=schedule_id)
        except Schedule.DoesNotExist:
            raise NotFound("존재하지 않는 일정입니다.")

    def get(self, request, schedule_id):
        schedule = self.get_schedule(schedule_id)
        comments = schedule.comments.all()

        if not (schedule.team.members.filter(id=request.user.id).exists()):
            raise PermissionDenied("소속된 팀 또는 본인 일정의 comments만 조회 가능합니다.")

        if comments.count() == 0:
            return Response(
                {"message": "작성된 댓글이 없습니다."},
                status=status.HTTP_204_NO_CONTENT,
            )

        serializer = ScheduleCommentSerializer(
            comments,
            context={"request": request},
            many=True,
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class Comments(APIView):
    permission_classes = [IsAuthenticated]

    def get_comment(self, pk):
        try:
            return Comment.objects.get(id=pk)
        except Comment.DoesNotExist:
            raise NotFound("존재하지 않는 댓글입니다.")

    def delete(self, request, comment_id):  # 댓글 삭제
        comment = self.get_comment(comment_id)

        if (comment.author != request.user) and (
            comment.schedule.team.team_leader != request.user
        ):
            raise PermissionDenied("삭제권한이 없습니다.")

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def put(self, request, comment_id):  # 댓글 수정
        comment = self.get_comment(comment_id)

        serializer = CommentSerializer(
            comment,
            data=request.data,
            partial=True,
        )

        if (comment.author != request.user) and (
            comment.schedule.team.team_leader != request.user
        ):
            raise PermissionDenied("수정권한이 없습니다.")

        if serializer.is_valid():
            updated_data = serializer.save()
            return Response(
                CommentSerializer(updated_data).data, status=status.HTTP_200_OK
            )
        else:
            return Response(serializer.errors)
