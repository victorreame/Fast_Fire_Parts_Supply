import React from "react";
import { Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [_, navigate] = useLocation();

  const statusBadgeVariant = () => {
    switch (job.status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const handleJobClick = () => {
    navigate(`/job/${job.id}`);
  };

  // Format date
  const formattedDate = job.updatedAt 
    ? format(new Date(job.updatedAt), "MM/dd/yyyy")
    : "";

  return (
    <div className="p-4 border-b border-neutral-200">
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium">{job.name}</h3>
          <p className="text-sm text-neutral-500 mt-1">Job #: {job.jobNumber}</p>
          <div className="flex mt-2">
            <Badge variant="outline" className={statusBadgeVariant()}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
            {formattedDate && (
              <span className="text-xs text-neutral-500 ml-2 flex items-center">
                Updated: {formattedDate}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-primary" onClick={handleJobClick}>
          <i className="fas fa-chevron-right"></i>
        </Button>
      </div>
    </div>
  );
};

export default JobCard;
