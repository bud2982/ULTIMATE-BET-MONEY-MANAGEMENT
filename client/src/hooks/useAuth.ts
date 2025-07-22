import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
    isPremium: (user as any)?.subscriptionStatus === 'active',
    isTrial: (user as any)?.subscriptionStatus === 'trial',
    error,
  };
}