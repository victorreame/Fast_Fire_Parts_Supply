import { useState } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaList, FaSearch, FaHardHat, FaFireExtinguisher, FaListAlt, FaTint, FaHeart, FaBell, FaLock } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ShieldAlert } from "lucide-react";
import { User } from "@/App";

const MobileHome = () => {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Check if user is a tradie with restricted access
  const isRestrictedTradie = user?.role === 'tradie' && 
    (user?.status === 'unassigned' || user?.status === 'pending_invitation');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Function to handle restricted feature access attempt
  const handleRestrictedAccess = () => {
    toast({
      title: "Access Restricted",
      description: "You need to accept a Project Manager invitation to access this feature.",
      variant: "destructive",
    });
  };

  return (
    <MobileLayout>
      <div className="p-4 flex flex-col h-[calc(100vh-80px)]">
        {isRestrictedTradie && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Limited Access Mode</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your account has restricted access. You can only search for parts until a Project Manager sends you an invitation.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search parts..."
              className="w-full p-3 pl-10 h-14 rounded-md shadow-sm border-gray-300 focus:border-red-500 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-5 text-red-600" />
            <Button 
              type="submit" 
              className="absolute right-1 top-2 h-10 px-3 bg-red-600 hover:bg-red-700 text-white"
              disabled={!searchQuery.trim()}
            >
              <FaSearch className="mr-1" />
              <span>Search</span>
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-4 mt-auto mb-auto">
          {/* Job Number Button */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={isRestrictedTradie ? handleRestrictedAccess : () => navigate("/jobs")}
              className={`bg-gradient-to-r ${
                isRestrictedTradie 
                  ? "from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700" 
                  : "from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
              } text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                {isRestrictedTradie ? (
                  <FaLock className="text-2xl text-white" />
                ) : (
                  <FaHardHat className="text-2xl text-white" />
                )}
              </div>
              <span className="text-lg font-semibold">Job Number</span>
              {isRestrictedTradie && <span className="text-xs mt-1">Restricted</span>}
            </Button>
          </div>

          {/* Best Sellers Button */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/parts/popular")}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                <FaFireExtinguisher className="text-2xl text-white" />
              </div>
              <span className="text-lg font-semibold">Best Sellers</span>
            </Button>
          </div>

          {/* Full Parts List Button */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/parts")}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                <FaListAlt className="text-2xl text-white" />
              </div>
              <span className="text-lg font-semibold">Full Parts List</span>
            </Button>
          </div>

          {/* Favorites or Notifications Button depending on user status */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {isRestrictedTradie ? (
              <Button
                onClick={() => navigate("/notifications")}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                  <FaBell className="text-2xl text-white" />
                </div>
                <span className="text-lg font-semibold">Invitations</span>
                <span className="text-xs mt-1">Check for PM invitations</span>
              </Button>
            ) : (
              <Button
                onClick={isRestrictedTradie ? handleRestrictedAccess : () => navigate("/favorites")}
                className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                  <FaHeart className="text-2xl text-white" />
                </div>
                <span className="text-lg font-semibold">Favorites</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileHome;
