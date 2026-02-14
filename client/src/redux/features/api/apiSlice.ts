import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../auth/authSlice";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { User } from "../../../types";

// Base query
const baseQuery = fetchBaseQuery({
  baseUrl:
    import.meta.env.VITE_PUBLIC_SERVER_URI || "http://localhost:8000/api/v1/",
  credentials: "include",
});

// Custom base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Initial request
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    console.log("Access token expired, attempting refresh...");

    // Try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: "refresh-token",
        method: "POST",
        credentials: "include",
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      console.log("Token refreshed successfully");

      // Type the refresh result data
      const refreshData = refreshResult.data as {
        accessToken: string;
        user: User;
      };

      // Update the Redux state with new token and user
      api.dispatch(
        userLoggedIn({
          accessToken: refreshData.accessToken,
          user: refreshData.user,
        }),
      );

      // Retry the original query with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      console.log("Token refresh failed, logging out user");
      // Refresh failed - log out user
      api.dispatch(userLoggedOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  tagTypes: ["User", "Class", "exam", "TimeTable", "Subject", ],
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Load user endpoint
    loadUser: builder.query({
      query: () => ({
        url: "me",
        method: "GET",
        credentials: "include",
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken || "",
              user: result.data.user,
            }),
          );
        } catch (error) {
          console.error("loadUser error:", error);
        }
      },
      providesTags: ["User"],
    }),

    // Refresh token endpoint (explicit call if needed)
    refreshToken: builder.mutation({
      query: () => ({
        url: "refresh-token",
        method: "POST",
        credentials: "include",
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            }),
          );
        } catch (error) {
          console.error("refreshToken error:", error);
          dispatch(userLoggedOut());
        }
      },
    }),
  }),
});

export const { useLoadUserQuery, useRefreshTokenMutation } = apiSlice;
