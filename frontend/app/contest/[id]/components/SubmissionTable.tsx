import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PlaceholderSubmission, Submission } from "@/lib/types";

type FilterOptions = {
  status: string;
  sortBy: string;
  order: string;
};

type Props = {
  submissions: Submission[] | PlaceholderSubmission[];
  filterOptions: FilterOptions;
  onFilterChange: (filter: FilterOptions) => void;
};

const SubmissionTable = ({
  submissions,
  filterOptions,
  onFilterChange,
}: Props) => {
  console.log(filterOptions);
  console.log(submissions);

  const filteredSubmissions = submissions.filter((submission) => {
    if (filterOptions.status === "all") {
      return true;
    }
    if (filterOptions.status === "pending") {
      return submission.status === "pending";
    }
    if (filterOptions.status === "Passed") {
      return submission.status === true;
    }
    if (filterOptions.status === "Failed") {
      return submission.status === false;
    }
    return true;
  });

  const getStatusBadgeVariant = (status: string | boolean | undefined) => {
    if (status === undefined) return "destructive";
    if (status === "pending") return "secondary";
    if (status === false) return "destructive";
    return status === true ? "success" : "destructive";
  };

  const getStatusText = (status: string | boolean | undefined, error?: string) => {
    if (error) return "Error";
    if (!status) return "Failed";
    if (status === "pending") return "Pending";
    return status === true ? "Passed" : "Failed";
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Your Submissions</h2>
      <div className="mb-4 flex flex-col gap-4">
        <Label htmlFor="status" className="mr-2">
          Filter by status:
        </Label>
        <Select
          value={filterOptions.status}
          onValueChange={(value) =>
            onFilterChange({ ...filterOptions, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Passed">Passed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 flex flex-col gap-4">
        <Label htmlFor="sortBy" className="mr-2">
          Sort by:
        </Label>
        <Select
          value={filterOptions.sortBy}
          onValueChange={(value) =>
            onFilterChange({ ...filterOptions, sortBy: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="score">Score</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterOptions.order}
          onValueChange={(value) =>
            onFilterChange({ ...filterOptions, order: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Descending" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSubmissions
            .filter(submission => submission !== undefined)
            .sort((a, b) => {
              if (filterOptions.sortBy === "date") {
                const comparison =
                  new Date(b?.createdAt || 0).getTime() -
                  new Date(a?.createdAt || 0).getTime();
                return filterOptions.order === "asc" ? -comparison : comparison;
              } else {
                const scoreA = a?.score ?? -1;
                const scoreB = b?.score ?? -1;
                const comparison = scoreB - scoreA;
                return filterOptions.order === "asc" ? -comparison : comparison;
              }
            })
            .map((submission) => (
              <TableRow key={submission?.createdAt || Math.random()}>
                <TableCell>
                  {submission?.createdAt 
                    ? new Date(submission.createdAt).toISOString().split("T")[0]
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge 
                      className={`inline-flex w-fit ${
                        submission?.error ? 'bg-destructive text-destructive-foreground' : ''
                      }`} 
                      variant={getStatusBadgeVariant(submission?.status)}
                    >
                      {getStatusText(submission?.status, submission?.error)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {submission?.score !== null ? submission.score : "-"}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubmissionTable;
