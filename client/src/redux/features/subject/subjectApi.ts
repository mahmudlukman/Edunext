import { apiSlice } from "../api/apiSlice";

export const subjectApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSubject: builder.mutation({
      query: (data) => ({
        url: "create-subject",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),
    // GET /subjects?page=&limit=&search=
    getAllSubjects: builder.query({
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
          url: `subjects?${params.toString()}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
      providesTags: [{ type: "Subject", id: "LIST" }],
    }),

    // GET /subjects/:id
    getSubject: builder.query({
      query: (id: string) => ({
        url: `subject/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, id) => [{ type: "Class", id }],
    }),

    // DELETE /subjects/delete/:id
    deleteSubject: builder.mutation({
      query: (id: string) => ({
        url: `delete-subject/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),

    // PUT /update-subject/:id  (admin update)
    updateSubject: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `update-subject/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Subject", id },
        { type: "Subject", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateSubjectMutation,
  useGetAllSubjectsQuery,
  useGetSubjectQuery,
  useDeleteSubjectMutation,
  useUpdateSubjectMutation,
} = subjectApi;
