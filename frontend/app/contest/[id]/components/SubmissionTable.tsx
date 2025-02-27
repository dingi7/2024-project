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
import { useTranslation } from '@/lib/useTranslation';
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  const { t } = useTranslation();

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
    if (error) return t('contestPage.submissionTable.status.error');
    if (!status) return t('contestPage.submissionTable.status.failed');
    if (status === "pending") return t('contestPage.submissionTable.status.pending');
    return status === true ? t('contestPage.submissionTable.status.passed') : t('contestPage.submissionTable.status.failed');
  };

  const statusOptions = [
    { value: 'all', label: t('contestPage.filters.status.all') },
    { value: 'Passed', label: t('contestPage.filters.status.passed') },
    { value: 'Failed', label: t('contestPage.filters.status.failed') }
  ];

  const sortOptions = [
    { value: 'date', label: t('contestPage.filters.sortBy.date') },
    { value: 'score', label: t('contestPage.filters.sortBy.score') }
  ];

  const orderOptions = [
    { value: 'asc', label: t('contestPage.filters.order.asc') },
    { value: 'desc', label: t('contestPage.filters.order.desc') }
  ];

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('contestPage.submissionTable.title')}</h2>
      <div className="mb-4 flex flex-col gap-4">
        <Label htmlFor="status" className="mr-2">
          {t('contestPage.submissionTable.filters.status')}
        </Label>
        <Select
          value={filterOptions.status}
          onValueChange={(value) => onFilterChange({ ...filterOptions, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('contestPage.filters.status.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contestPage.filters.status.all')}</SelectItem>
            <SelectItem value="Passed">{t('contestPage.filters.status.passed')}</SelectItem>
            <SelectItem value="Failed">{t('contestPage.filters.status.failed')}</SelectItem>
            <SelectItem value="pending">{t('contestPage.submissionTable.filters.pending')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 flex flex-col gap-4">
        <Label htmlFor="sortBy" className="mr-2">
          {t('contestPage.submissionTable.filters.sortBy')}
        </Label>
        <Select
          value={filterOptions.sortBy}
          onValueChange={(value) => onFilterChange({ ...filterOptions, sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('contestPage.filters.sortBy.date')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('contestPage.filters.sortBy.date')}</SelectItem>
            <SelectItem value="score">{t('contestPage.filters.sortBy.score')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterOptions.order}
          onValueChange={(value) => onFilterChange({ ...filterOptions, order: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('contestPage.filters.order.desc')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('contestPage.filters.order.asc')}</SelectItem>
            <SelectItem value="desc">{t('contestPage.filters.order.desc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('contestPage.submissionTable.columns.date')}</TableHead>
            <TableHead>{t('contestPage.submissionTable.columns.status')}</TableHead>
            <TableHead>{t('contestPage.submissionTable.columns.score')}</TableHead>
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
                      className={`inline-flex w-fit ${submission?.error ? 'bg-destructive text-destructive-foreground' : ''
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
                <TableCell
                >
                  <Button variant={"outline"}>
                    <Link href={`/contest/${submission.id}/view`}>
                    View Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubmissionTable;
