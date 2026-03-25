import { apiSlice } from "../api/apiSlice";

export const academicYearApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAcademicYear: builder.mutation({
      query: ({ data }) => ({
        url: "create-academic-year",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Academic Year", id: "LIST" }],
    }),
    getAllAcademicYears: builder.query({
      query: () => ({
        url: "academic-years",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: [{ type: "Academic Year", id: "LIST" }],
    }),
    getCurrentAcademicYear: builder.query({
      query: () => ({
        url: "current-academic-year",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: [{ type: "Academic Year", id: "LIST" }],
    }),
    deleteAcademicYear: builder.mutation({
      query: (id) => ({
        url: `delete-academic-year/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Academic Year", id: "LIST" }],
    }),
    updateAcademicYear: builder.mutation({
      query: ({ data, id }) => ({
        url: `update-academic-year/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Academic Year", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateAcademicYearMutation,
  useGetAllAcademicYearsQuery,
  useDeleteAcademicYearMutation,
  useGetCurrentAcademicYearQuery,
  useUpdateAcademicYearMutation,
} = academicYearApi;
