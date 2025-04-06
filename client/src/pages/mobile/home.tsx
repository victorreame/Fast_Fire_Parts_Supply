import { useState } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaList, FaSearch, FaHardHat, FaFireExtinguisher, FaListAlt, FaTint, FaHeart } from "react-icons/fa";

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
      <div className="p-4 flex flex-col h-[calc(100vh-80px)]">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search parts..."
              className="w-full p-4 pl-12 rounded-md shadow-sm border-gray-300 focus:border-red-500 focus:ring focus:ring-red-200 focus:ring-opacity-50 text-lg h-14"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-4.5 text-red-600 text-lg" />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 h-10 px-4 bg-red-600 hover:bg-red-700 text-white"
              disabled={!searchQuery.trim()}
            >
              <FaSearch className="mr-1" />
              <span>Search</span>
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-6 flex-1 my-auto">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/jobs")}
              className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                <FaHardHat className="text-2xl text-white" />
              </div>
              <span className="text-lg font-semibold">Job Number</span>
            </Button>
          </div>

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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Button
              onClick={() => navigate("/favorites")}
              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 w-full h-32"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-2">
                <FaHeart className="text-2xl text-white" />
              </div>
              <span className="text-lg font-semibold">Favorites</span>
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileHome;
