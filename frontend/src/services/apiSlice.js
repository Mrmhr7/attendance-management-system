import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Wraps the base query so an expired/invalid token logs the user out automatically.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Attendance', 'Overtime', 'User', 'DashboardStats'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data.data));
      },
    }),
    register: builder.mutation({
      query: (payload) => ({ url: '/auth/register', method: 'POST', body: payload }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data.data));
      },
    }),
    getMe: builder.query({ query: () => '/auth/me' }),

    getTodayAttendance: builder.query({
      query: () => '/attendance/today',
      providesTags: ['Attendance'],
    }),
    punchIn: builder.mutation({
      query: (body) => ({ url: '/attendance/punch-in', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'DashboardStats'],
    }),
    punchOut: builder.mutation({
      query: (body) => ({ url: '/attendance/punch-out', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'DashboardStats'],
    }),
    getMyAttendance: builder.query({
      query: (params) => ({ url: '/attendance/my', params }),
      providesTags: ['Attendance'],
    }),
    getTeamAttendance: builder.query({
      query: (params) => ({ url: '/attendance/team', params }),
      providesTags: ['Attendance'],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({ url: '/attendance/all', params }),
      providesTags: ['Attendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}/validate`, method: 'PATCH', body }),
      invalidatesTags: ['Attendance', 'DashboardStats'],
    }),

    createOvertime: builder.mutation({
      query: (body) => ({ url: '/overtime', method: 'POST', body }),
      invalidatesTags: ['Overtime', 'Attendance', 'DashboardStats'],
    }),
    getMyOvertime: builder.query({
      query: (params) => ({ url: '/overtime/my', params }),
      providesTags: ['Overtime'],
    }),
    getPendingOvertime: builder.query({
      query: (params) => ({ url: '/overtime/pending', params }),
      providesTags: ['Overtime'],
    }),
    reviewOvertime: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/overtime/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: ['Overtime', 'Attendance', 'DashboardStats'],
    }),

    getDailyReport: builder.query({ query: (params) => ({ url: '/reports/daily', params }) }),
    getDashboardStats: builder.query({ query: () => '/dashboard/stats', providesTags: ['DashboardStats'] }),

    getUsers: builder.query({ query: (params) => ({ url: '/users', params }), providesTags: ['User'] }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, isActive }) => ({ url: `/users/${id}/status`, method: 'PATCH', body: { isActive } }),
      invalidatesTags: ['User'],
    }),
    assignManager: builder.mutation({
      query: ({ id, managerId }) => ({ url: `/users/${id}/assign-manager`, method: 'PATCH', body: { managerId } }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetTodayAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useValidateAttendanceMutation,
  useCreateOvertimeMutation,
  useGetMyOvertimeQuery,
  useGetPendingOvertimeQuery,
  useReviewOvertimeMutation,
  useGetDailyReportQuery,
  useGetDashboardStatsQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useAssignManagerMutation,
} = apiSlice;