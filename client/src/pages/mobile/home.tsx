import { useState } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { FaBriefcase, FaStar, FaList } from "react-icons/fa";

const MobileHome = () => {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
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
              className="w-full p-3 pl-10 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-3.5 text-neutral-400"></i>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Button
              onClick={() => navigate("/jobs")}
              className="bg-primary-700 hover:bg-primary-800 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition duration-200 w-full h-24"
            >
              <FaBriefcase className="text-3xl mb-2" />
              <span className="text-lg font-semibold">Job Search</span>
            </Button>
            <div className="p-3 text-sm text-gray-600">
              Search for active jobs by job number or name. Add parts to jobs for more organized ordering.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Button
              onClick={() => navigate("/parts/popular")}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition duration-200 w-full h-24"
            >
              <FaStar className="text-3xl mb-2" />
              <span className="text-lg font-semibold">Top 50 Parts</span>
            </Button>
            <div className="p-3 text-sm text-gray-600">
              Browse our most popular parts used in fire sprinkler systems. Quick access to commonly ordered items.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Button
              onClick={() => navigate("/parts")}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-t-lg p-6 flex flex-col items-center justify-center transition duration-200 w-full h-24"
            >
              <FaList className="text-3xl mb-2" />
              <span className="text-lg font-semibold">Full Parts List</span>
            </Button>
            <div className="p-3 text-sm text-gray-600">
              View our complete catalog of fire sprinkler system parts with detailed specifications and availability.
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileHome;
