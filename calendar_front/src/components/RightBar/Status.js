import React, { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentEdit from './CommentEdit';
import { eventDetailEditApi, eventDetailDeleteApi } from '../../api';
import { styled } from 'styled-components';

const StatusContent = styled.div`
  white-space: nowrap;
  text-align: center;
  width: 100%;
  color: grey;
  font-size: 10px;
  font-weight: 600;
  margin-top: 200px;
`;

const ScheduleDetailBox = styled.div`
  /* border: 2px solid black; */
  width: 100%;
  height: auto;
  margin-top: 15px;
  padding-left: 5px;
  padding-right: 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 2;
`;

const ScheduleDetailTitle = styled.div`
  white-space: nowrap;
  word-wrap: break-word;
  text-align: center;
  width: 100%;
  color: grey;
  font-size: 13px;
  font-weight: 900;
`;
const ButtonBox = styled.div`
  margin-top: -5px;

  display: flex;
  justify-content: end;
  margin-bottom: 10px;
`;
const ScheduleEditBtn = styled.button`
  transform: scale(0.6);
  background-color: transparent;
  border: none;
  margin-right: -20px;
  color: grey;
`;
const ScheduleDeleteBtn = styled.button`
  transform: scale(0.6);
  background-color: transparent;
  border: none;
  color: grey;
  margin-right: -10px;
`;

export default function Status({ selectedEvent }) {
  const [comments, setComments] = useState([]);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedIsAllday, setEditedIsAllday] = useState(false);
  const [editedState, setEditedState] = useState('To do');
  const [isEditMode, setIsEditMode] = useState(false);

  console.log(selectedEvent, '냐냐냐');

  useEffect(() => {
    const eventComments = comments.filter(
      (comment) => comment.schedule === selectedEvent?.id,
    );
    setComments(eventComments);
  }, [selectedEvent]);

  // // Set initial values for editedStartTime and editedEndTime
  // useEffect(() => {
  //   setEditedStartTime(
  //     startDate.toLocaleTimeString('ko-KR', {
  //       hour: 'numeric',
  //       minute: 'numeric',
  //       hour12: true,
  //     }),
  //   );
  //   setEditedEndTime(
  //     endDate.toLocaleTimeString('ko-KR', {
  //       hour: 'numeric',
  //       minute: 'numeric',
  //       hour12: true,
  //     }),
  //   );
  // }, [selectedEvent]);

  const addComment = (newComment) => {
    setComments([...comments, newComment]);
  };

  if (!selectedEvent) {
    return <StatusContent>일정 없음</StatusContent>;
  }

  // const toggleEditMode = () => {
  //   setIsEditMode(!isEditMode);
  // };

  const { calendarName, title, location, start, end, isAllday, state } =
    selectedEvent;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const removeComment = (commentId) => {
    setComments(comments.filter((comment) => comment.id !== commentId));
  };

  const editComment = (commentId, updatedDescription) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, description: updatedDescription }
          : comment,
      ),
    );
  };

  const handleEditEvent = () => {
    if (isEditMode) {
      const updatedEvent = {
        ...selectedEvent,
        title: editedTitle,
        location: editedLocation,
        start: editedStartTime,
        end: editedEndTime,
        isAllday: editedIsAllday,
        state: editedState,
      };

      eventDetailEditApi(selectedEvent.id, updatedEvent)
        .then((response) => {
          console.log('일정 수정 성공:', response);
          setIsEditMode(false); // Save 버튼 누른 후에는 편집 모드 종료
        })
        .catch((error) => {
          console.error('일정 수정 실패:', error);
        });
    } else {
      setIsEditMode(true); // 편집 버튼 누르면 편집 모드 시작
    }
  };

  const startTime = isEditMode
    ? editedStartTime
    : startDate.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });

  const endTime = isEditMode
    ? editedEndTime
    : endDate.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });

  const handleDeleteEvent = () => {
    eventDetailDeleteApi(selectedEvent.id)
      .then((response) => {
        console.log('일정 삭제 성공:', response);
        window.location.reload();
      })
      .catch((error) => {
        console.error('일정 삭제 실패:', error);
      });
  };

  return (
    <ScheduleDetailBox>
      <ScheduleDetailTitle>📌 일정 상세 정보 📌</ScheduleDetailTitle>
      <ButtonBox>
        <ScheduleEditBtn onClick={handleEditEvent}>
          {isEditMode ? '저장' : '편집'}
        </ScheduleEditBtn>
        <ScheduleDeleteBtn onClick={handleDeleteEvent}>삭제</ScheduleDeleteBtn>
      </ButtonBox>
      <div>
        <input value={`♦️ ${calendarName}`} readOnly />
        <input
          value={isEditMode ? editedTitle : title}
          onChange={(e) => setEditedTitle(e.target.value)}
          readOnly={!isEditMode}
        />
        <input
          value={isEditMode ? editedLocation : location ? location : ''}
          onChange={(e) => setEditedLocation(e.target.value)}
          readOnly={!isEditMode}
        />
        ⏰ 시작일시 ⏰
        <input
          value={isEditMode ? editedStartTime : startTime}
          onChange={(e) => setEditedStartTime(e.target.value)}
          style={{ whiteSpace: 'pre-line' }}
          readOnly={!isEditMode}
        />
        ⏰ 종료일시 ⏰
        <input
          value={isEditMode ? editedEndTime : endTime}
          onChange={(e) => setEditedEndTime(e.target.value)}
          style={{ whiteSpace: 'pre-line' }}
          readOnly={!isEditMode}
        />
        <label>
          <input
            type="checkbox"
            checked={editedIsAllday}
            onChange={() => setEditedIsAllday(!editedIsAllday)}
            disabled={!isEditMode}
          />
          하루종일
        </label>
        <label>
          <input
            type="checkbox"
            checked={editedState === 'Done'}
            onChange={() =>
              setEditedState(editedState === 'To do' ? 'Done' : 'To do')
            }
          />
          {editedState === 'Done' ? 'Done' : 'To do'}
        </label>
      </div>

      {comments.map((comment) => (
        <CommentList
          key={comment.id}
          comment={comment}
          removeComment={removeComment}
          editComment={editComment}
        />
      ))}
      {selectedEvent && (
        <CommentEdit
          schedule={selectedEvent.id}
          author="nickname"
          addComment={addComment}
        />
      )}
    </ScheduleDetailBox>
  );
}
