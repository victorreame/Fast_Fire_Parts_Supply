import { useState, useEffect } from "react";
import MobileLayout from "@/components/mobile/layout";
import JobCard from "@/components/mobile/job-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const JobSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Get user data from auth context
  const { user } = useAuth();
  const isRestrictedTradie = user?.role === 'tradie' && !user?.isApproved;

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    enabled: !isRestrictedTradie, // Only fetch if user is not restricted
  });

  // Filter and sort jobs
  const filteredAndSortedJobs = jobs
    ? jobs
        .filter((job) =>
          searchQuery
            ? (job.description || job.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
        .sort((a, b) => {
          if (sortBy === "recent") {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          } else if (sortBy === "name") {
            const textA = (a.description || a.name || '');
            const textB = (b.description || b.name || '');
            return textA.localeCompare(textB);
          } else if (sortBy === "status") {
            return a.status.localeCompare(b.status);
          }
          return 0;
        })
    : [];

  // Use effect to redirect unapproved tradies
  useEffect(() => {
    if (isRestrictedTradie) {
      toast({
        title: "Access Restricted",
        description: "Your account requires Project Manager approval before accessing jobs.",
        variant: "destructive",
      });
      navigate('/mobile');
    }
  }, [isRestrictedTradie, navigate, toast]);

  if (isRestrictedTradie) {
    return null; // Prevent flicker while redirecting
  }

  return (
    <MobileLayout title="Job Search" showBackButton={true}>
      <div className="p-4 bg-neutral-100 border-b border-neutral-200">
        <div className="relative mb-3">
          <Input
            type="text"
            placeholder="Search jobs..."
            className="w-full p-3 pl-10 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-3.5 text-neutral-400"></i>
        </div>
        <div className="flex">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Sort by Recent</SelectItem>
              <SelectItem value="name">Sort by Title</SelectItem>
              <SelectItem value="status">Sort by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28 mt-2" />
                    <div className="flex mt-2">
                      <Skeleton className="h-4 w-16 rounded mr-2" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
        ) : filteredAndSortedJobs.length > 0 ? (
          filteredAndSortedJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No jobs found. Please contact your supervisor.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default JobSearchPage;