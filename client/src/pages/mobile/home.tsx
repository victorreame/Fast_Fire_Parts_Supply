import { useState } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaList, FaSearch, FaHardHat, FaFireExtinguisher, FaListAlt, FaTint } from "react-icons/fa";

const MobileHome = () => {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <MobileLayout>
      <div className="p-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search parts..."
              className="w-full p-3 pl-10 rounded-md shadow-sm border-gray-300 focus:border-red-500 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3.5 text-red-600" />
            <Button 
              type="submit" 
              className="absolute right-1 top-1 h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
              disabled={!searchQuery.trim()}
            >
              <FaSearch className="mr-1" />
              <span>Search</span>
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/jobs")}
              className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition-all duration-300 w-full h-28"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/15 mb-3">
                <FaHardHat className="text-3xl text-white" />
              </div>
              <span className="text-xl font-semibold">Search Parts by Job Number</span>
            </Button>
            <div className="p-4 text-sm text-gray-600">
              Click to see all parts used on a particular job.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/parts/popular")}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition-all duration-300 w-full h-28"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/15 mb-3">
                <FaFireExtinguisher className="text-3xl text-white" />
              </div>
              <span className="text-xl font-semibold">Top 50 Parts</span>
            </Button>
            <div className="p-4 text-sm text-gray-600">
              Browse our most popular parts used in fire sprinkler systems. Quick access to commonly ordered items.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/parts")}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition-all duration-300 w-full h-28"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/15 mb-3">
                <FaListAlt className="text-3xl text-white" />
              </div>
              <span className="text-xl font-semibold">Full Parts List</span>
            </Button>
            <div className="p-4 text-sm text-gray-600">
              View our complete catalog of fire sprinkler system parts with detailed specifications and availability.
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileHome;
