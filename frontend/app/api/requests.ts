import { Contest, ContestSolution, Invitation, TestCase, User } from "@/lib/types";
import * as api from "./api";

export const endpoints = {
  userSingIn: "/auth/signIn",
  getContests: "/contest",
  createContest: "/contest",
  codeSubmit: (id: string) => `/codeSubmit/${id}`,
  addTestCase: (id: string) => `/contest/${id}/TestCases`,
  editTestCase: (id: string) => `/contest/${id}/TestCases`,
  deleteTestCase: (contestId: string, testCaseId: string) =>
    `/contest/${contestId}/TestCases/${testCaseId}`,
  getContestById: (id: string) => `/contest/${id}`,
  deleteContest: (id: string) => `/contest/${id}`,
  getSubmissionsByContestID: (contestId: string) => `/submissions/${contestId}`,
  getSubmissionsByOwnerID: (contestId: string, ownerId: string) =>
    `/submissions/${contestId}/${ownerId}`,
  getLeaderboard: "/leaderboard",
  editContest: (id: string) => `/contest/${id}`,
  getUserAttendedContests: (userId: string) => `/users/${userId}/contests`,
  createRepo: "/contest/github/createRepo",
  createInvitation: (contestId: string) => `/contest/${contestId}/invitations`,
  getContestInvitations: (contestId: string) => `/contest/${contestId}/invitations`,
  getUserInvitations: "/invitations",
  respondToInvitation: (invitationId: string) => `/invitation/${invitationId}/respond`,
  cancelInvitation: (invitationId: string) => `/invitation/${invitationId}`,
};

export const userSignIn = async (payload: User) => {
  return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (
  payload: ContestSolution,
  id: string,
  isRepo: boolean
) => {
  return api.post(endpoints.codeSubmit(id), { ...payload, isRepo });
};

export const getContests = async () => {
  return api.get(endpoints.getContests);
};

export const createContest = async (payload: {
  title: string;
  description: string;
  language: string;
  startDate: Date;
  endDate: Date;
  prize: number;
  ownerId: string;
  contestStructure: string | null | undefined;
  testFramework: string | null | undefined;
  testCases: TestCase[] | null | undefined;
  contestRules: any;
}) => {
  return api.post(endpoints.createContest, payload, true);
};

export const editContest = async (payload: Contest, id: string) => {
  return api.put(endpoints.editContest(id), payload, true);
};

export const getContestById = async (id: string) => {
  return api.get(endpoints.getContestById(id));
};

export const deleteContest = async (id: string) => {
  return api.del(endpoints.deleteContest(id));
};

export const addTestCase = async (id: string, payload: any) => {
  return api.post(endpoints.addTestCase(id), payload);
};

export const editTestCase = async (id: string, payload: TestCase) => {
  return api.put(endpoints.editTestCase(id), payload);
};

export const getSubmissionsByContestID = async (contestId: string) => {
  return api.get(endpoints.getSubmissionsByContestID(contestId));
};

export const getSubmissionsByOwnerID = async (
  contestId: string,
  ownerId: string
) => {
  return api.get(endpoints.getSubmissionsByOwnerID(contestId, ownerId));
};

export const getSubmissionById = async (id: string) => {
  return api.get(`/submission/${id}`);
};

export const deleteTestCase = async (contestId: string, testCaseId: string) => {
  return api.del(endpoints.deleteTestCase(contestId, testCaseId));
};

export const getLeaderboard = async () => {
  return api.get(endpoints.getLeaderboard);
};

export const getUserAttendedContests = async (
  userId: string
): Promise<Contest[]> => {
  return api.get(endpoints.getUserAttendedContests(userId));
};

export const createRepo = async (payload: {
  templateCloneURL: string;
  newRepoName: string;
}) => {
  return api.post(endpoints.createRepo, payload);
};

export const getGithubUserInfoById = async (id: string) => {
  const response = await fetch(`https://api.github.com/user/${id}`);
  return response.json();
};

export const createInvitation = async (contestId: string, payload: { userEmail: string }) => {
  return api.post(endpoints.createInvitation(contestId), { ...payload, contestId });
};

export const getContestInvitations = async (contestId: string) => {
  return api.get(endpoints.getContestInvitations(contestId));
};

export const getUserInvitations = async () => {
  return api.get(endpoints.getUserInvitations);
};

export const respondToInvitation = async (invitationId: string, payload: { accept: boolean }) => {
  return api.put(endpoints.respondToInvitation(invitationId), payload);
};

export const cancelInvitation = async (invitationId: string) => {
  return api.del(endpoints.cancelInvitation(invitationId));
};