import { apiSlice } from "../api/apiSlice";

export const classApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createClass: builder.mutation({
      query: (data) => ({
        url: "create-class",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),
    // GET /classes?page=&limit=&role=&search=
    getAllClasses: builder.query({
      query: ({
        page = 1,
        pageSize = 10,
        search,
      }: {
        page?: number;
        pageSize?: number;
        search?: string;
      }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (search) params.set("search", search);

        return {
          url: `classes?${params.toString()}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
      providesTags: [{ type: "Class", id: "LIST" }],
    }),

    // GET /classes/:id
    getClass: builder.query({
      query: (id: string) => ({
        url: `class/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, id) => [{ type: "Class", id }],
    }),

    // DELETE /classes/delete/:id
    deleteClass: builder.mutation({
      query: (id: string) => ({
        url: `delete-class/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),

    // PUT /update-class/:id  (admin update)
    updateClass: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `update-class/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Class", id },
        { type: "Class", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateClassMutation,
  useGetAllClassesQuery,
  useGetClassQuery,
  useDeleteClassMutation,
  useUpdateClassMutation,
} = classApi;
