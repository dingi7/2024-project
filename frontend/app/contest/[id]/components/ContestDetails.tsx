import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContestTestCases from "./ContestTestCases";
import { formatDate } from "@/lib/utils";
import { Contest } from "@/lib/types";

const ContestDetails = ({ contest, isOwner, isEditEnabled, onEdit }: {
  contest: Contest;
  isOwner: boolean;
  isEditEnabled: boolean;
  onEdit: (updatedContest: any) => void;
}) => {
  
  const [rulesFile, setRulesFile] = useState<File | null>(null);

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

  console.log(contest);

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
            <ContestTestCases contestId={contest.id} dbTestCases={contest.testCases}/>
            <Button type="submit" className="mt-4">
              Save Changes
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContestDetails;
