import { Button } from "@/components/ui/button";
import type { UserRole, User } from "@/types";
import CustomAlert from "@/components/global/CustomAlert";
import Search from "@/components/global/Search";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import UserTable from "@/components/users/UserTable";
import UserDialog from "@/components/users/UserDialog";
import {
  useGetAllUsersQuery,
  useDeleteUserMutation,
} from "@/redux/features/user/userApi";

interface Props {
  role: UserRole;
  title: string;
  description: string;
}

export default function UserManagementPage({
  role,
  title,
  description,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Delete States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // RTK Query — fetch users
  // getAllUsers query expects { page, pageSize } but your backend uses
  // page, limit, role, search — we pass what the endpoint supports.
  // If your apiSlice base query appends extra params, adjust here.
  const { data, isLoading, isFetching, refetch } = useGetAllUsersQuery(
    { page, pageSize: 10, role, search: debouncedSearch },
    { refetchOnMountOrArgChange: true },
  );

  const users = data?.users ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  // RTK Mutation — delete user
  const [deleteUserMutation] = useDeleteUserMutation();

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUserMutation(deleteId).unwrap();
      toast.success("User deleted");
      refetch();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Search search={search} setSearch={setSearch} title={`${role}s`} />
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add {role.charAt(0).toUpperCase() + role.slice(1)}
          </Button>
        </div>
      </div>

      {/* Table */}
      <UserTable
        role={role}
        loading={isLoading || isFetching}
        setDeleteId={setDeleteId}
        setIsDeleteOpen={setIsDeleteOpen}
        setEditingUser={setEditingUser}
        setIsFormOpen={setIsFormOpen}
        users={users}
        setPageNum={setPage}
        pageNum={page}
        totalPages={totalPages}
      />

      {/* Create / Edit Dialog */}
      <UserDialog
        editingUser={editingUser}
        role={role}
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onSuccess={refetch}
      />

      {/* Delete Confirmation */}
      <CustomAlert
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        handleDelete={handleDelete}
        title="Delete User?"
        description="This will permanently delete this user from the system."
      />
    </div>
  );
}
