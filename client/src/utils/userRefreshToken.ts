import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useRefreshTokenMutation } from "../redux/features/api/apiSlice";
import type { RootState } from "../types";

export const useTokenRefresh = () => {
  const [refreshToken] = useRefreshTokenMutation();
  const { user } = useSelector((state: RootState) => state.auth);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only set up auto-refresh if user is logged in
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    const refreshInterval = 14 * 60 * 1000; // 14 minutes in milliseconds

    intervalRef.current = setInterval(() => {
      console.log("Auto-refreshing token...");
      refreshToken({})
        .unwrap()
        .then(() => console.log("Token refreshed successfully"))
        .catch((error) => console.error("Token refresh failed:", error));
    }, refreshInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshToken]);
};
