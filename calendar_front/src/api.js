import axios from 'axios';

const instance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  baseURL: process.env.API_URL, //장고 서버 주소
  // baseURL: 'http://localhost:8000', //로컬
  withCredentials: true, // 쿠키를 포함시키기 위한 설정 추가
});

// request interceptor
instance.interceptors.request.use((config) => {
  const access_token = localStorage.getItem('access_token');
  if (access_token) {
    config.headers['Authorization'] = `Bearer ${access_token}`;
  } else {
    return config;
  }
  return config;
});

// response interceptor
let refresh = false;

instance.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (error.response.status === 401 && !refresh) {
      refresh = true;
      const refresh_token = localStorage.getItem('refresh_token');
      const response = await instance.post(
        '/api/v1/token/refresh/',
        {
          refresh: refresh_token,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        axios.defaults.headers.common['Authorization'] = `Bearer
       ${response.data['access']}`;

        return axios(error.config);
      }
    }

    refresh = false;

    return error;
  },
);

export default instance;

// 로그인 API 함수
export const loginApi = (data) => {
  return instance.post('/api/v1/users/login/', data);
};

// 회원가입 API 함수
export const signupApi = (data) => {
  return instance.post('/api/v1/users/signup/', data);
};

// 아이디 중복 확인 API 함수
export const checkIdAvailabilityApi = (data) => {
  return instance.post('/api/v1/users/idcheck/', data);
};

// 팀 생성 API 함수
export const createTeamApi = (data) => {
  return instance.post('/api/v1/teams/', data);
};

// 팀 생성 시 닉네임 중복 확인 API 함수
export const nicknameCheckApi = (data) => {
  return instance.post(`/api/v1/nicknames/${data.team_id}/`, {
    nickname: data.nickname,
  });
};

// 상세 일정 수정
export const eventDetailEditApi = (data) => {
  return instance.put(`/api/v1/schedules/${data.id}/`, data);
};

// 일정명 검색
export const scheduleSearchApi = (data) => {
  return instance.post(`/api/v1/schedules/search/`, data);
};

//로그아웃 API
export const logoutApi = (data) => {
  return instance.post(`/api/v1/users/logout/`, data);
};
