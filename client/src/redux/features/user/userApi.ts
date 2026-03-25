import { apiSlice } from "../api/apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /users?page=&limit=&role=&search=
    getAllUsers: builder.query({
      query: ({
        page = 1,
        pageSize = 10,
        role,
        search,
      }: {
        page?: number;
        pageSize?: number;
        role?: string;
        search?: string;
      }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (role && role !== "all") params.set("role", role);
        if (search) params.set("search", search);

        return {
          url: `users?${params.toString()}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
      providesTags: [{ type: "User", id: "LIST" }],
    }),

    // GET /users/:id
    getUser: builder.query({
      query: (id: string) => ({
        url: `users/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, id) => [{ type: "User", id }],
    }),

    // DELETE /users/delete/:id
    deleteUser: builder.mutation({
      query: (id: string) => ({
        url: `users/delete/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // PUT /update-user/:id  (admin update)
    updateUser: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `update-user/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // PUT /update-user-password  (authenticated user)
    updateUserPassword: builder.mutation({
      query: ({
        oldPassword,
        newPassword,
      }: {
        oldPassword: string;
        newPassword: string;
      }) => ({
        url: "update-user-password",
        method: "PUT",
        body: { oldPassword, newPassword },
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // PUT /update-user-status  (admin: change role / isActive)
    updateUserStatus: builder.mutation({
      query: (data: {
        id: string;
        role?: string;
        isActive?: boolean;
      }) => ({
        url: "update-user-status",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // PUT /update-user-profile  (authenticated user)
    updateUserProfile: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "update-user-profile",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserQuery,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserStatusMutation,
  useUpdateUserProfileMutation,
} = userApi;