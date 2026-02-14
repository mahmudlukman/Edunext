import { apiSlice } from "../api/apiSlice";
import { userLoggedOut, userLoggedIn, userRegistration } from "./authSlice";


export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({
        url: "register",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userRegistration({
              token: result.data.activationToken,
            })
          );
        } catch (error: unknown) {
          console.log(error);
        }
      },
    }),
    activation: builder.mutation({
      query: ({ activation_token }) => ({
        url: "activate-user",
        method: "POST",
        body: {
          activation_token,
        },
      }),
    }),
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "login",
        method: "POST",
        body: {
          email,
          password,
        },
        credentials: "include" as const,
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.activationToken,
              user: result.data.user,
            })
          );
        } catch (error: unknown) {
          console.log(error);
        }
      },
    }),
    forgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: "forgot-password",
        method: "POST",
        body: {
          email,
        },
        credentials: "include",
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ userId, token, newPassword }) => ({
        url: `reset-password?token=${token}&id=${userId}`,
        method: "POST",
        body: {
          newPassword,
        },
        credentials: "include",
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "logout",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error: unknown) {
          console.log(error);
        }
      },
    }),
  }),
});

export const {
  useLogoutMutation,
  useLoginMutation,
  useRegisterMutation,
  useActivationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
