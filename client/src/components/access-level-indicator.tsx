import { Shield, ShieldCheck, ShieldAlert, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";

const AccessLevelIndicator = ({ showDetails = false }: { showDetails?: boolean }) => {
  const { permissions, accessLevel, getAccessMessage, getAccessColor } = usePermissions();

  const getAccessIcon = () => {
    switch (accessLevel) {
      case 'independent':
        return <Shield className="h-4 w-4" />;
      case 'limited':
        return <ShieldAlert className="h-4 w-4" />;
      case 'approved':
        return <ShieldCheck className="h-4 w-4" />;
      case 'pm':
        return <Crown className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAccessBadge = () => {
    switch (accessLevel) {
      case 'independent':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Independent</Badge>;
      case 'limited':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">Limited Access</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-200">Company Member</Badge>;
      case 'pm':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Project Manager</Badge>;
      default:
        return <Badge variant="outline">Loading...</Badge>;
    }
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {getAccessIcon()}
        {getAccessBadge()}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getAccessIcon()}
          Access Level: {getAccessBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className={getAccessColor()}>
          {getAccessMessage()}
        </CardDescription>
        
        {showDetails && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Your Permissions:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${permissions.canPlaceOrders ? 'text-green-600' : 'text-gray-400'}`}>
                {permissions.canPlaceOrders ? '✓' : '✗'} Place Orders
              </div>
              <div className={`flex items-center gap-1 ${permissions.canViewCompanyJobs ? 'text-green-600' : 'text-gray-400'}`}>
                {permissions.canViewCompanyJobs ? '✓' : '✗'} View Company Jobs
              </div>
              <div className={`flex items-center gap-1 ${permissions.canAccessCart ? 'text-green-600' : 'text-gray-400'}`}>
                {permissions.canAccessCart ? '✓' : '✗'} Shopping Cart
              </div>
              <div className={`flex items-center gap-1 ${permissions.canViewPricing ? 'text-green-600' : 'text-gray-400'}`}>
                {permissions.canViewPricing ? '✓' : '✗'} View Pricing
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessLevelIndicator;