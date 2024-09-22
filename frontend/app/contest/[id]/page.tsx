"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon } from "lucide-react";
import ContestDetails from "./components/ContestDetails";
import SubmissionForm from "./components/SubmissionForm";
import SubmissionTable from "./components/SubmissionTable";
import { getSession, useSession } from "next-auth/react";
import {
  codeSubmit,
  editContest,
  getContestById,
  getSubmissionsByOwnerID,
} from "@/app/api/requests";
import { useParams } from "next/navigation";
import {
  Contest,
  ContestSolution,
  PlaceholderSubmission,
  Submission,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { decodeBase64ToBlobUrl } from "@/lib/utils";
import Link from "next/link";

type FilterOptions = {
  status: "all" | "pending" | "completed" | string;
  sortBy: "date" | "score" | string;
  order: "asc" | "desc";
};

export default function ContestPage() {
  let { data: session, status } = useSession();
  console.log(session);
  const params = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditEnabled, setIsEditEnabled] = useState(false);

  const [contest, setContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<
    Submission[] | PlaceholderSubmission[]
  >([]);
  const [contestRulesBlobURL, setContestRulesBlobURL] = useState<string | null>(
    null
  );

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: "all",
    sortBy: "date",
    order: "desc",
  });

  // check user session
  useEffect(() => {
    if (!session?.user.id) {
      getSession().then((updatedSession) => {
        if (updatedSession) {
          session = updatedSession;
        }
      });
    }
    if (status === "unauthenticated" || !session || !session.user.id) return;
  }, [status, session]);

  const fetchContestAndSubmissions = async () => {
    try {
      const contestResponse = await getContestById(params.id);
      const submissionsResponse = await getSubmissionsByOwnerID(
        params.id,
        session?.user?.id ?? ""
      );

      setContest(contestResponse);
      setIsOwner(contestResponse.ownerID === session?.user?.id);
      setContestRulesBlobURL(
        contestResponse.contestRules
          ? decodeBase64ToBlobUrl(contestResponse.contestRules)
          : null
      );
      setSubmissions(submissionsResponse);
    } catch (error) {
      console.error("Failed to fetch contest or submissions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contest or submissions.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchContestAndSubmissions();
  }, [params, session?.user?.id, status,]);

  const handleEditContest = (updatedContest: Contest) => {
    const currentContest = contest;
    setContest(updatedContest);
    try {
      editContest(updatedContest, params.id);
    } catch (error) {
      setContest(currentContest);
      console.error("Failed to edit contest:", error);
      toast({
        title: "Error",
        description: "Failed to edit contest.",
        variant: "destructive",
        duration: 2000,
      });
    }
    setIsEditEnabled(false);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    setFilterOptions(filters);
  };

  const handleSubmit = async (solution: { code: string; language: string }) => {
    const submission = {
      ...solution,
      contestId: params.id,
      ownerId: session!.user!.id,
      _id: "placeholder",
    };

    const placeholderSubmission: PlaceholderSubmission = {
      ...submission,
      status: "pending",
      score: null,
      createdAt: new Date().toISOString(),
    };

    try {
      setSubmissions((prevSubmissions) =>
        Array.isArray(prevSubmissions)
          ? [...prevSubmissions, placeholderSubmission]
          : [placeholderSubmission]
      );

      toast({
        title: "Submission in progress",
        description:
          "Your code is being submitted. Please wait for the results.",
        variant: "default",
        duration: 3000,
      });

      const submissionResponse = await codeSubmit(submission, params.id);

      setSubmissions((prevSubmissions) =>
        Array.isArray(prevSubmissions)
          ? prevSubmissions.map((sub) =>
              sub === placeholderSubmission ? submissionResponse : sub
            )
          : [submissionResponse]
      );

      toast({
        title: "Submission assessed",
        description: "Your code has been successfully assessed.",
        variant: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Submission failed:", error);

      setSubmissions((prevSubmissions) =>
        Array.isArray(prevSubmissions)
          ? prevSubmissions.filter((sub) => sub !== placeholderSubmission)
          : []
      );

      toast({
        title: "Submission failed",
        description:
          "There was an error assessing your code. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return [];
    }

    let filtered = [...submissions];
    if (filterOptions.status !== "all") {
      filtered = filtered.filter((s) => s.status === filterOptions.status);
    }
    if (filterOptions.sortBy === "date") {
      filtered.sort((a, b) =>
        filterOptions.order === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filterOptions.sortBy === "score") {
      filtered.sort((a, b) =>
        filterOptions.order === "asc"
          ? (a.score ?? 0) - (b.score ?? 0)
          : (b.score ?? 0) - (a.score ?? 0)
      );
    }
    return filtered;
  }, [submissions, filterOptions]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchContestAndSubmissions();
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="container mx-auto py-8 px-4 md:px-6 flex-row flex gap-5">
          <Skeleton className="w-[50%] h-[300px] mb-4" />
          <Skeleton className="w-[50%] h-[500px]" />
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-col flex-1">
        <div className="container mx-auto py-8 px-4 md:px-6">
          <h1 className="text-2xl font-bold mb-4">Contest not found</h1>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col flex-1">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Code Challenge</h1>
          <div className="flex gap-2">
            <SubmissionForm onSubmit={handleSubmit} />
            {isOwner && (
              <Button onClick={() => setIsEditEnabled(!isEditEnabled)}>
                Edit Contest
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant={"outline"}>
              <Link href={`/contest/${contest.id}/submissions`}>
                All Results
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ContestDetails
            contest={contest!}
            setContest={setContest}
            isOwner={isOwner}
            isEditEnabled={isEditEnabled}
            setIsEditEnabled={setIsEditEnabled}
            onEdit={handleEditContest}
            contestRules={contestRulesBlobURL}
          />
          <SubmissionTable
            submissions={filteredSubmissions}
            filterOptions={filterOptions as FilterOptions}
            onFilterChange={(filter) =>
              handleFilterChange(filter as FilterOptions)
            }
          />
        </div>
      </div>
    </div>
  );
}
