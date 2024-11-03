"use client";

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
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createContest, createRepo } from "@/app/api/requests";
import { getSession, useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GithubRepos from "../[id]/github/repoList";

const ContestScheme = z.object({
  title: z.string().min(3).max(32),
  description: z.string().min(3).max(255),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  language: z.enum([
    "python",
    "java",
    "javascript",
    "c++",
    "c#",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "go",
    "rust",
    "typescript",
  ]),
  prize: z.string(),
  rulesFile: z.any().optional(),
  contestStructure: z.string().optional(),
  testFile: z.any().optional(),
  testFramework: z.enum(['jest', 'unittest', 'pytest']).optional(),
});

type ContestType = z.infer<typeof ContestScheme>;

export default function Component() {
  const { toast } = useToast();
  let { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGithubRepos = async () => {
    if (!session?.githubAccessToken) {
      toast({
        title: "Error",
        description:
          "GitHub access token not found. Please reconnect your GitHub account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${session.githubAccessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch GitHub repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user.id) {
      getSession().then((updatedSession) => {
        session = updatedSession;
      });
    }
    if (status === "unauthenticated" || !session || !session.user.id) return;

    fetchGithubRepos();
  }, [status]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContestType>({ resolver: zodResolver(ContestScheme) });

  const handleCreateContest: SubmitHandler<ContestType> = async (data) => {
    if (!session!.user.id || !session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a contest",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      title: data.title,
      description: data.description,
      language: data.language,
      startDate: data.dateRange.from,
      endDate: data.dateRange.to,
      prize: parseInt(data.prize),
      ownerId: session.user.id,
      testCases: [],
      contestRules: data.rulesFile,
      contestStructure: repos.find((repo) => repo.name === data.contestStructure)?.clone_url || null,
      testFramework: data.contestStructure ? data.testFramework : null,
      testFile: data.contestStructure ? data.testFile : null,
    };
    
    try {
      await createContest(payload);
      toast({
        title: "Contest created successfully",
        description: "Contest created successfully",
        variant: "success",
      });
      reset();
      setValue("language", "python");
      router.push("/contests");
    } catch (error) {
      toast({
        title: "Failed to create contest",
        description: "Failed to create contest",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
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
            onSubmit={(e) => {
              handleSubmit(handleCreateContest)(e);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="title">
                Contest Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter contest title"
                required
                {...register("title")}
              />
              {errors.title && (
                <p className="text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter contest description"
                required
                {...register("description")}
              />
              {errors.description && (
                <p className="text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">
                Programming Language <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    required
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select programming language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="c++">C++</SelectItem>
                      <SelectItem value="c#">C#</SelectItem>
                      <SelectItem value="ruby">Ruby</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="swift">Swift</SelectItem>
                      <SelectItem value="kotlin">Kotlin</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && (
                <p className="text-red-500">{errors.language.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>
                Contest Duration <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="dateRange"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y HH:mm")} -{" "}
                              {format(field.value.to, "LLL dd, y HH:mm")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y HH:mm")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={field.value}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                      />
                      <div className="grid grid-cols-2 gap-2 p-3 border-t border-border">
                        <div>
                          <Label>Start Time</Label>
                          <div className="flex items-center mt-1">
                            <Select
                              onValueChange={(value) => {
                                const [hours, minutes] = value.split(":");
                                const newFrom = setMinutes(
                                  setHours(
                                    field.value?.from || new Date(),
                                    parseInt(hours)
                                  ),
                                  parseInt(minutes)
                                );
                                field.onChange({
                                  ...field.value,
                                  from: newFrom,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Start time" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({
                                  length: 24 * 4,
                                }).map((_, index) => {
                                  const hours = Math.floor(index / 4);
                                  const minutes = (index % 4) * 15;
                                  return (
                                    <SelectItem
                                      key={index}
                                      value={`${hours
                                        .toString()
                                        .padStart(2, "0")}:${minutes
                                        .toString()
                                        .padStart(2, "0")}`}
                                    >
                                      {`${hours
                                        .toString()
                                        .padStart(2, "0")}:${minutes
                                        .toString()
                                        .padStart(2, "0")}`}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <div className="flex items-center mt-1">
                            <Select
                              onValueChange={(value) => {
                                const [hours, minutes] = value.split(":");
                                const newTo = setMinutes(
                                  setHours(
                                    field.value?.to || new Date(),
                                    parseInt(hours)
                                  ),
                                  parseInt(minutes)
                                );
                                field.onChange({
                                  ...field.value,
                                  to: newTo,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="End time" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({
                                  length: 24 * 4,
                                }).map((_, index) => {
                                  const hours = Math.floor(index / 4);
                                  const minutes = (index % 4) * 15;
                                  return (
                                    <SelectItem
                                      key={index}
                                      value={`${hours
                                        .toString()
                                        .padStart(2, "0")}:${minutes
                                        .toString()
                                        .padStart(2, "0")}`}
                                    >
                                      {`${hours
                                        .toString()
                                        .padStart(2, "0")}:${minutes
                                        .toString()
                                        .padStart(2, "0")}`}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateRange && (
                <p className="text-red-500">{errors.dateRange.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize">
                Prize <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prize"
                placeholder="Enter prize"
                type="number"
                required
                min={0}
                {...register("prize")}
              />
              {errors.prize && (
                <p className="text-red-500">{errors.prize.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="github-repo-url">
                  Contest Structure Template{" "}
                  <span className="text-gray-500">(Optional)</span>
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchGithubRepos}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLoading && "animate-spin")}
                  />
                </Button>
              </div>
              <GithubRepos
                repos={repos}
                selectedRepo={watch("contestStructure") || ""}
                setSelectedRepo={(repo) => setValue("contestStructure", repo)}
              />
              {errors.contestStructure?.message && (
                <p className="text-red-500">
                  {errors.contestStructure.message as string}
                </p>
              )}

              {watch("contestStructure") && (
                <>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="testFramework">
                      Test Framework <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="testFramework"
                      control={control}
                      rules={{ required: "Test framework is required when using a template" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger id="testFramework">
                            <SelectValue placeholder="Select test framework" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jest">Jest</SelectItem>
                            <SelectItem value="unittest">Unittest</SelectItem>
                            <SelectItem value="pytest">Pytest</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.testFramework && (
                      <p className="text-red-500">{errors.testFramework.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2 mt-2">
                    <Label htmlFor="test-file">
                      Test File <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="test-file"
                      type="file"
                      accept=".js,.py"
                      {...register("testFile", {
                        required: "Test file is required when using a template",
                      })}
                    />
                    {errors.testFile && (
                      <p className="text-red-500">{errors.testFile.message as string}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rules-files">
                Contest Rules <span className="text-gray-500">(Optional)</span>
              </Label>
              <Input
                id="rules-files"
                type="file"
                accept=".pdf"
                multiple={false}
                {...register("rulesFile")}
              />
              {errors.rulesFile?.message && (
                <p className="text-red-500">
                  {errors.rulesFile.message as string}
                </p>
              )}
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
