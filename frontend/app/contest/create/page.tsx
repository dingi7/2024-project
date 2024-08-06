import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createContest } from "@/app/actions/createContest";

export default function Component() {
  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Create a New Contest
          </CardTitle>
          <CardDescription>
            Fill out the form below to create a new programming contest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            action={createContest}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Contest Name</Label>
              <Input id="name" name="name" placeholder="Enter contest name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter contest description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" name="start-date" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" name="end-date" type="date" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Prize</Label>
              <Input id="prize" name="prize" placeholder="Enter prize" type="number" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rules-files">Contest Rules</Label>
              <Input id="rules-files" name="rules-file" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="other-files">Other Files</Label>
              <Input id="other-files" name="other-files" type="file" />
            </div>
            <Button type="submit" className="w-full">
              Create Contest
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
