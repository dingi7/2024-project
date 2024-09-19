import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContestTestCases from "./ContestTestCases";
import { formatDate } from "@/lib/utils";
import { Contest, TestCase } from "@/lib/types";
import { deleteContest } from "@/app/api/requests";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const ContestDetails = ({ contest, isOwner, setContest, isEditEnabled, setIsEditEnabled, onEdit }: {
  contest: Contest;
  setContest: (contest: Contest) => void;
  isOwner: boolean;
  isEditEnabled: boolean;
  setIsEditEnabled: (isEditEnabled: boolean) => void;
  onEdit: (updatedContest: any) => void;
}) => {
  
  const [rulesFile, setRulesFile] = useState<File | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleEditContest = (e: any) => {
    e.preventDefault();
    onEdit({
      ...contest,
      title: e.target.title.value,
      description: e.target.description.value,
      startDate: e.target.startDate.value,
      endDate: e.target.endDate.value,
      prize: e.target.prize.value,
      rulesFile,
    });
  };

  const handleRulesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRulesFile(e.target.files[0]);
    }
  };

  const handleSaveChanges = () => {
    setIsEditEnabled(false);
  };


  const updateTestCases = (testCase: TestCase, action: "delete" | "add") => {
    if (action === "add") {
      setContest({
        ...contest,
        testCases: [...contest.testCases, testCase],
      });
    } else if (action === "delete") {
      setContest({
        ...contest,
        testCases: contest.testCases.filter((tc) => tc.id !== testCase.id),
      });
    }
  };

  const handleDeleteContest = async () => {
    toast({
      title: "Delete Contest",
      description: "Are you sure you want to delete this contest?",
      action: (
        <Button variant="destructive" onClick={confirmDelete}>
          Delete
        </Button>
      ),
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteContest(contest.id);
      toast({
        title: "Contest deleted",
        description: "The contest has been successfully deleted.",
      });
      router.push("/contests");
    } catch (error) {
      console.error("Failed to delete contest:", error);
      toast({
        title: "Error",
        description: "Failed to delete contest. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{contest.title}</h1>
      <p className="text-muted-foreground mb-4">{contest.description}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Start Date</h3>
          <p>{formatDate(contest.startDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">End Date</h3>
          <p>{formatDate(contest.endDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">Prize</h3>
          <p>{contest.prize}</p>
        </div>
      </div>
      {isOwner && (
        <div className="mt-4 flex justify-between">
          <Button onClick={() => setIsEditEnabled(!isEditEnabled)}>
            {isEditEnabled ? "Cancel Edit" : "Edit Contest"}
          </Button>
          <Button variant="destructive" onClick={handleDeleteContest}>
            Delete Contest
          </Button>
        </div>
      )}
      {isOwner && isEditEnabled && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Edit Contest</h2>
          <form onSubmit={handleEditContest}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" defaultValue={contest.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={contest.description}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={new Date(contest.startDate).toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={new Date(contest.endDate).toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prize">Prize</Label>
              <Input id="prize" defaultValue={contest.prize} required />
            </div>
            <div className="mt-4">
              <Label htmlFor="rulesFile">Contest Rules (PDF)</Label>
              <Input
                id="rulesFile"
                type="file"
                onChange={handleRulesFileChange}
              />
            </div>
            <ContestTestCases contestId={contest.id} dbTestCases={contest.testCases} saveContestTestCase={updateTestCases}/>
            <Button type="submit" className="mt-4" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContestDetails;
