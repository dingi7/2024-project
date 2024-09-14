"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getLeaderboard } from "../api/requests";
import { useEffect, useState } from "react";

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  useEffect(() => {
    const fetchLeaderboard = async () => {
        const fetchedData = await getLeaderboard();
        setLeaderboardData(fetchedData);
    };
    fetchLeaderboard();
}, []);

  console.log(leaderboardData);
  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-6 flex flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle>1. jaredpalmer</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 text-foreground">
                <span className="font-bold text-2xl">1,234</span>
                <TrophyIcon className="w-6 h-6" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-primary-foreground/80">
              Total Contests Attended
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardHeader className="pb-2">
            <CardTitle>2. shadcn</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl">987</span>
                <TrophyIcon className="w-6 h-6" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-secondary-foreground/80">
              Total Contests Attended
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted text-muted-foreground">
          <CardHeader className="pb-2">
            <CardTitle>3. maxleiter</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl">789</span>
                <TrophyIcon className="w-6 h-6" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground/80">
              Total Contests Attended
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Contests</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell className="font-medium">jaredpalmer</TableCell>
              <TableCell className="text-right">1,234</TableCell>
              <TableCell className="text-right">98,765</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell className="font-medium">shadcn</TableCell>
              <TableCell className="text-right">987</TableCell>
              <TableCell className="text-right">87,654</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>3</TableCell>
              <TableCell className="font-medium">maxleiter</TableCell>
              <TableCell className="text-right">789</TableCell>
              <TableCell className="text-right">76,543</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>4</TableCell>
              <TableCell className="font-medium">shuding_</TableCell>
              <TableCell className="text-right">654</TableCell>
              <TableCell className="text-right">65,432</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>5</TableCell>
              <TableCell className="font-medium">lee_robinson</TableCell>
              <TableCell className="text-right">543</TableCell>
              <TableCell className="text-right">54,321</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>6</TableCell>
              <TableCell className="font-medium">delba</TableCell>
              <TableCell className="text-right">432</TableCell>
              <TableCell className="text-right">43,210</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>7</TableCell>
              <TableCell className="font-medium">vercel</TableCell>
              <TableCell className="text-right">321</TableCell>
              <TableCell className="text-right">32,109</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>8</TableCell>
              <TableCell className="font-medium">nextjs</TableCell>
              <TableCell className="text-right">210</TableCell>
              <TableCell className="text-right">21,098</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>9</TableCell>
              <TableCell className="font-medium">tailwindcss</TableCell>
              <TableCell className="text-right">189</TableCell>
              <TableCell className="text-right">18,987</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>10</TableCell>
              <TableCell className="font-medium">react</TableCell>
              <TableCell className="text-right">167</TableCell>
              <TableCell className="text-right">16,876</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export default Leaderboard;
