import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { type Class, type UserRole, type Subject, type User, type ServerError } from "@/types";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/global/CustomInput";
import { CustomSelect } from "@/components/global/CustomSelect";
import { CustomMultiSelect } from "@/components/global/CustomMultiSelect";

import { useGetAllClassesQuery } from "../../redux/features/class/classApi";
import { useGetAllSubjectsQuery } from "../../redux/features/subject/subjectApi";
import {
  useLoginMutation,
  useRegisterMutation,
} from "../../redux/features/auth/authApi";
import { useUpdateUserMutation } from "../../redux/features/user/userApi";

import { useEffect, useState } from "react";

export type FormType = "login" | "create" | "update";

interface Props {
  type: FormType;
  initialData?: User | null;
  onSuccess?: () => void;
  role?: UserRole;
}

const createSchema = (type: FormType) => {
  return z
    .object({
      name:
        type === "login"
          ? z.string().optional()
          : z.string().min(2, "Name is required"),
      classId: z.string().optional(),
      subjectIds: z.array(z.string()).optional(),
      email: z.string().email("Invalid email address"),
      role: z.string().optional(),
      password:
        type === "update"
          ? z
              .string()
              .optional()
              .refine((val) => !val || val.length >= 6, {
                message: "Password must be at least 6 characters",
              })
          : z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword:
        type === "create"
          ? z.string().min(6, "Confirm your password")
          : z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (type === "create" && data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });
      }
    });
};

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const UniversalUserForm = ({ type, initialData, onSuccess, role }: Props) => {
  const isUpdate = type === "update";
  const isLogin = type === "login";
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const { data: classData, isLoading: loadingClasses } = useGetAllClassesQuery({
    page: 1,
    pageSize: 100,
  });

  const { data: subjectData, isLoading: loadingSubjects } =
    useGetAllSubjectsQuery({ page: 1, pageSize: 100 });

  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [updateUser] = useUpdateUserMutation();

  const classes: Class[] = classData?.classes || [];
  const subjects: Subject[] = subjectData?.subjects || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema(type)),
    defaultValues: {
      name: "",
      email: "",
      role: role,
      password: "",
      classId: undefined,
      subjectIds: [],
    },
  });

  useEffect(() => {
    if (initialData && isUpdate) {
      const existingClassId =
        typeof initialData.studentClass === "object"
          ? initialData.studentClass?._id
          : initialData.studentClass;

      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        role: initialData.role || "student",
        password: "",
        classId: existingClassId || "",
        subjectIds: initialData.teacherSubjects?.map((s) => s._id) || [],
      });
    }
  }, [initialData, isUpdate, form]);

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect]);

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        studentClass: data.classId || undefined,
        teacherSubjects: data.subjectIds || [],
        ...data,
      };

      if (isLogin) {
        await login({
          email: data.email,
          password: data.password,
        }).unwrap();

        toast.success("Logged in successfully");
        setShouldRedirect(true);
      } else if (type === "create") {
        await register(payload).unwrap();
        toast.success("Account created successfully!");
        onSuccess?.();
      } else if (type === "update" && initialData?._id) {
        await updateUser({
          id: initialData._id,
          data: payload,
        }).unwrap();

        toast.success("User updated successfully");
        onSuccess?.();
      }
    } catch (err: unknown) {
      const serverError = err as ServerError;
      const errorMessage =
        serverError?.data?.message ||
        serverError?.message ||
        "Failed to update profile";
      toast.error(errorMessage);
    }
  }

  const classOptions = classes.map((c) => ({
    label: c.name,
    value: c._id,
  }));

  const subjectOptions = subjects.map((s) => ({
    label: s.name,
    value: s._id,
  }));

  const roleOptions = role
    ? [{ label: role, value: role }]
    : [
        { label: "Student", value: "student" },
        { label: "Teacher", value: "teacher" },
        { label: "Admin", value: "admin" },
      ];

  const pending = form.formState.isSubmitting;

  const showRoleSelector = !isLogin;
  const showClassSelector = !isLogin && role === "student";
  const showSubjectSelector = !isLogin && role === "teacher";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4 w-full">
          {!isLogin && (
            <CustomInput
              control={form.control}
              name="name"
              label="Full Name"
              placeholder="Jane Doe"
              disabled={pending}
            />
          )}

          {showRoleSelector && (
            <CustomSelect
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select role"
              options={roleOptions}
              disabled={pending}
            />
          )}

          <div className="col-span-2 space-y-2">
            {showClassSelector && (
              <CustomSelect
                control={form.control}
                name="classId"
                label="Class"
                placeholder="Select Class"
                options={classOptions}
                loading={loadingClasses}
                disabled={pending}
              />
            )}

            {showSubjectSelector && (
              <CustomMultiSelect
                control={form.control}
                name="subjectIds"
                label="Subjects"
                placeholder="Select subjects..."
                options={subjectOptions}
                loading={loadingSubjects}
                disabled={pending}
              />
            )}

            <CustomInput
              control={form.control}
              name="email"
              label="Email Address"
              type="email"
              placeholder="m@example.com"
              disabled={pending}
            />
          </div>

          <div className="col-span-2">
            <CustomInput
              control={form.control}
              name="password"
              label="Password"
              type="password"
              placeholder={isUpdate ? "New Password (Optional)" : "Password"}
              disabled={pending}
            />
          </div>

          {type === "create" && (
            <div className="col-span-2">
              <CustomInput
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm Password"
                disabled={pending}
              />
            </div>
          )}

          <div className="col-span-2 mt-2">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Processing..."
                : type === "login"
                  ? "Sign In"
                  : type === "create"
                    ? "Create Account"
                    : "Save Changes"}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
};

export default UniversalUserForm;
