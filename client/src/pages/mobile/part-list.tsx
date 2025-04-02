import { useState, useEffect } from "react";
import MobileLayout from "@/components/mobile/layout";
import PartCard from "@/components/mobile/part-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Part } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const PartListPage = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isPopular = params.get("popular") === "true";
  const searchQuery = params.get("q") || "";
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("itemCode");

  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: [isPopular ? '/api/parts/popular' : '/api/parts'],
  });

  // Filter and sort parts
  const filteredAndSortedParts = parts
    ? parts
        .filter((part) => {
          // Filter by search query
          const matchesSearch = localSearchQuery
            ? part.description.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
              part.itemCode.toLowerCase().includes(localSearchQuery.toLowerCase())
            : true;
          
          // Filter by type
          const matchesType = filterType && filterType !== 'all_types' ? part.type === filterType : true;
          
          return matchesSearch && matchesType;
        })
        .sort((a, b) => {
          // Sort by selected field
          if (sortBy === "itemCode") {
            return a.itemCode.localeCompare(b.itemCode);
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

  const pageTitle = isPopular ? "Top 50 Parts" : searchQuery ? "Search Results" : "Full Parts List";

  return (
    <MobileLayout title={pageTitle} showBackButton={true}>
      <div className="p-4 bg-neutral-100 border-b border-neutral-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search within list..."
            className="w-full p-3 pl-10 rounded-md"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-3.5 text-neutral-400"></i>
        </div>
        <div className="mt-2 flex">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="mr-2 flex-1">
              <SelectValue placeholder="Filter by Type" />
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
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="itemCode">Sort by Item Code</SelectItem>
              <SelectItem value="description">Sort by Description</SelectItem>
              <SelectItem value="type">Sort by Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          <div className="p-8 text-center">
            <p className="text-neutral-500">No parts found matching your criteria.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default PartListPage;
