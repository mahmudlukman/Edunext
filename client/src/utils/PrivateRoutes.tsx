import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import type { RootState } from "../types";
import { useSelector } from "react-redux";
import { useGetCurrentAcademicYearQuery } from "../redux/features/academicYear/academicYearApi";
// Import the hook from your API slice
// import { useGetCurrentAcademicYearQuery } from "../api/academicYearApi"; 

const PrivateRoutes = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  // RTK Query hook handles fetching the current academic year
  const { 
    data: yearData, 
    isLoading: yearLoading,
  } = useGetCurrentAcademicYearQuery(undefined, {
    skip: !user, // Don't run this query if we don't even have a user yet
  });

  const activeYear = yearData?.academicYear; // Adjust based on your API response structure

  // Combined loading state
  if (yearLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Authenticated check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Academic Year existence check
  if (!activeYear) {
    // Scenario A: Admin needs to create a year
    if (user.role === "admin") {
      const settingsPath = "/settings/academic-years";
      
      // Prevent infinite redirect loop
      if (location.pathname !== settingsPath) {
        return <Navigate to={settingsPath} replace />;
      }
    } 
    // Scenario B: Non-admins cannot proceed without an active year
    else {
      // You might want a specific "No Active Year" landing page for students/teachers
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PrivateRoutes;