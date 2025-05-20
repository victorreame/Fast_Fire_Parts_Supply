import { useState, useEffect } from "react";
import MobileLayout from "@/components/mobile/layout";
import PartCard from "@/components/mobile/part-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FaSearch, FaFilter, FaSortAmountDown, FaThList, FaExclamationTriangle } from "react-icons/fa";
import { Parts } from "@/types/parts";

const SearchPage = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialQuery = params.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("itemCode");

  const { data: parts, isLoading } = useQuery<Parts[]>({
    queryKey: ['/api/parts'],
  });

  // Update URL when search changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) {
        const newParams = new URLSearchParams();
        newParams.set("q", searchQuery);
        window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Filter and sort parts
  const filteredAndSortedParts = parts
    ? parts
        .filter((part) => {
          // Filter by search query
          const matchesSearch = searchQuery
            ? part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              part.item_code.toLowerCase().includes(searchQuery.toLowerCase())
            : false; // Only show results if there's a search query
          
          // Filter by type
          const matchesType = filterType && filterType !== 'all_types' ? part.type === filterType : true;
          
          return matchesSearch && matchesType;
        })
        .sort((a, b) => {
          // Sort by selected field
          if (sortBy === "itemCode") {
            return a.item_code.localeCompare(b.item_code);
          } else if (sortBy === "description") {
            return a.description.localeCompare(b.description);
          } else if (sortBy === "type") {
            return a.type.localeCompare(b.type);
          }
          return 0;
        })
    : [];

  // Extract unique types for filter dropdown
  const partTypes = parts
    ? Array.from(new Set(parts.map((part) => part.type))).sort()
    : [];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <MobileLayout title="Search Results" showBackButton={true}>
      <div className="p-4 bg-gradient-to-b from-neutral-50 to-neutral-100 border-b border-neutral-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative mb-3">
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
              <FaSearch size={18} />
            </div>
            <Input
              type="text"
              placeholder="Search parts..."
              className="w-full py-3 pl-10 pr-20 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 px-4 bg-primary-500 hover:bg-primary-600 rounded-md flex items-center justify-center"
              disabled={!searchQuery.trim()}
            >
              <FaSearch className="mr-1" size={14} />
              <span className="text-sm">Search</span>
            </Button>
          </div>
        </form>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center px-1 text-sm font-medium text-gray-600">
            <FaFilter className="mr-2 text-primary-500" />
            <span>Filter & Sort Options</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-md shadow-sm border border-gray-200">
              <div className="px-2 py-1 bg-primary-50 border-b border-gray-200 flex items-center">
                <FaFilter size={12} className="mr-1 text-primary-500" />
                <span className="text-xs font-medium">Filter Type</span>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-0 shadow-none bg-transparent text-sm h-9 py-0">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All Types</SelectItem>
                  {partTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border border-gray-200">
              <div className="px-2 py-1 bg-primary-50 border-b border-gray-200 flex items-center">
                <FaSortAmountDown size={12} className="mr-1 text-primary-500" />
                <span className="text-xs font-medium">Sort By</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-0 shadow-none bg-transparent text-sm h-9 py-0">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="itemCode">Item Code</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {filteredAndSortedParts.length > 0 && (
          <div className="mt-3 px-2 py-1 bg-white rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaThList className="mr-2 text-primary-500" />
                <span className="text-sm font-medium">{filteredAndSortedParts.length} Results</span>
              </div>
              <span className="text-xs text-gray-500">
                {filterType && filterType !== 'all_types' ? `Filtered by: ${filterType}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <div className="w-full">
                    <div className="flex items-start">
                      <Skeleton className="h-6 w-16 rounded mr-2" />
                      <Skeleton className="h-6 w-10 rounded" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mt-2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
        ) : filteredAndSortedParts.length > 0 ? (
          filteredAndSortedParts.map((part) => <PartCard key={part.id} part={part} />)
        ) : (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="bg-neutral-50 rounded-full p-6 mb-4 text-primary-400">
              {searchQuery 
                ? <FaExclamationTriangle size={48} />
                : <FaSearch size={48} />
              }
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {searchQuery 
                ? "No Results Found"
                : "Search for Parts"
              }
            </h3>
            <p className="text-neutral-500 max-w-xs text-center">
              {searchQuery 
                ? "No parts match your current search and filter criteria. Try adjusting your search terms or filters."
                : "Enter keywords, item codes, or part descriptions to find what you're looking for."
              }
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SearchPage;
