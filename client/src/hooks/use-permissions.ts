import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";

export interface UserPermissions {
  canViewPricing: boolean;
  canPlaceOrders: boolean;
  canViewCompanyJobs: boolean;
  canSearchByJobNumber: boolean;
  canAccessCart: boolean;
  canManageCompany: boolean;
  accessLevel: 'independent' | 'approved' | 'limited' | 'pm';
  companyId?: number;
}

export const usePermissions = () => {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery<UserPermissions>({
    queryKey: ['/api/user/permissions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/permissions');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Default permissions for non-authenticated users
  const defaultPermissions: UserPermissions = {
    canViewPricing: false,
    canPlaceOrders: false,
    canViewCompanyJobs: false,
    canSearchByJobNumber: false,
    canAccessCart: false,
    canManageCompany: false,
    accessLevel: 'independent'
  };

  return {
    permissions: permissions || defaultPermissions,
    isLoading,
    // Helper functions for common permission checks
    canViewPricing: permissions?.canViewPricing || false,
    canPlaceOrders: permissions?.canPlaceOrders || false,
    canViewCompanyJobs: permissions?.canViewCompanyJobs || false,
    canSearchByJobNumber: permissions?.canSearchByJobNumber || false,
    canAccessCart: permissions?.canAccessCart || false,
    canManageCompany: permissions?.canManageCompany || false,
    accessLevel: permissions?.accessLevel || 'independent',
    companyId: permissions?.companyId,
    
    // Access level checks
    isIndependent: permissions?.accessLevel === 'independent',
    isApproved: permissions?.accessLevel === 'approved',
    isLimited: permissions?.accessLevel === 'limited',
    isPM: permissions?.accessLevel === 'pm',
    
    // Status messages for UI
    getAccessMessage: () => {
      switch (permissions?.accessLevel) {
        case 'independent':
          return 'Join a company to access advanced features and place orders';
        case 'limited':
          return 'Your company access has been limited to browse-only';
        case 'approved':
          return 'You have full access to your company features';
        case 'pm':
          return 'You have project manager access to all company features';
        default:
          return 'Loading access level...';
      }
    },
    
    getAccessColor: () => {
      switch (permissions?.accessLevel) {
        case 'independent':
          return 'text-blue-600';
        case 'limited':
          return 'text-orange-600';
        case 'approved':
          return 'text-green-600';
        case 'pm':
          return 'text-purple-600';
        default:
          return 'text-gray-600';
      }
    }
  };
};