import { useState } from "react";
import SupplierLayout from "@/components/supplier/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import JobForm from "@/components/supplier/job-form";

const SupplierJobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const { toast } = useToast();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Filter jobs based on search and status
  const filteredJobs = jobs
    ? jobs.filter(job => {
        const matchesSearch = searchQuery
          ? (job.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesStatus = statusFilter !== "all" 
          ? job.status === statusFilter
          : true;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const handleAddJob = () => {
    setJobToEdit(null);
    setShowAddJobDialog(true);
  };

  const handleEditJob = (job: Job) => {
    setJobToEdit(job);
    setShowAddJobDialog(true);
  };

  const toggleJobPublicStatus = useMutation({
    mutationFn: async ({ id, isPublic }: { id: number; isPublic: boolean }) => {
      return apiRequest("PUT", `/api/jobs/${id}`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job updated",
        description: "Job public status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Job Management</h2>
        <div className="flex">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search jobs..."
              className="py-2 pl-10 pr-4 rounded-lg w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-3 text-neutral-400"></i>
          </div>
          <Button 
            className="ml-4 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
            onClick={handleAddJob}
          >
            <i className="fas fa-plus mr-2"></i>
            Add New Job
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="font-medium text-neutral-800">Jobs</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500">Filter by status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Job Title
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Job Number
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date Created
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Public
                  </TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-neutral-200">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {job.description || job.name || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {job.jobNumber}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.status === "active"
                              ? "bg-green-100 text-green-800"
                              : job.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <Button
                          variant={job.isPublic ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleJobPublicStatus.mutate({ id: job.id, isPublic: !job.isPublic })}
                        >
                          {job.isPublic ? "Public" : "Private"}
                        </Button>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary-900 mr-2"
                            onClick={() => handleEditJob(job)}
                          >
                            <i className="fas fa-edit mr-1"></i> Edit
                          </Button>
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => window.location.href = `/job/${job.id}`}
                          >
                            <i className="fas fa-tools mr-1"></i> Parts
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                      No jobs found. {searchQuery && "Try adjusting your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{jobToEdit ? "Edit Job" : "Add New Job"}</DialogTitle>
          </DialogHeader>
          <JobForm
            job={jobToEdit}
            onSuccess={() => setShowAddJobDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </SupplierLayout>
  );
};

export default SupplierJobs;