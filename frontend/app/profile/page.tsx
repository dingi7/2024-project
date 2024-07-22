"use client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"

export default function Component() {

  const {data: session} = useSession()
  const user = session?.user
  
  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-6 flex flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-background rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback>{user?.name?.split(" ").map(u => u[0]).join("").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <div className="text-lg font-medium">{user?.name}</div>
              <div className="text-sm text-muted-foreground">@{user?.name?.split(" ").join("").toLowerCase()}</div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Rank:</span> 32
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Joined:</span> June 2021
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Rating:</span> 1,234
              </div>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-lg border p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Attended Contests</h2>
            <Link href="#" className="text-sm text-primary hover:underline" prefetch={false}>
              View All
            </Link>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <TrophyIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Global Hackathon 2023</div>
                <div className="text-sm text-muted-foreground">June 1, 2023</div>
              </div>
              <div className="text-sm font-medium text-primary">Rank: 32</div>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <TrophyIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Acme Coding Challenge</div>
                <div className="text-sm text-muted-foreground">April 15, 2023</div>
              </div>
              <div className="text-sm font-medium text-primary">Rank: 18</div>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <TrophyIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Hacktoberfest 2022</div>
                <div className="text-sm text-muted-foreground">October 1, 2022</div>
              </div>
              <div className="text-sm font-medium text-primary">Rank: 45</div>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-lg border p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Created Contests</h2>
            <Link href="#" className="text-sm text-primary hover:underline" prefetch={false}>
              View All
            </Link>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Acme Coding Challenge</div>
                <div className="text-sm text-muted-foreground">A coding challenge for Acme Inc employees.</div>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Hackathon 2023</div>
                <div className="text-sm text-muted-foreground">A 24-hour hackathon for developers.</div>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Coding Competition</div>
                <div className="text-sm text-muted-foreground">A monthly coding competition for students.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Badges</h2>
          <div className="grid grid-cols-3 gap-4">
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Participant
            </Badge>
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Top Scorer
            </Badge>
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Organizer
            </Badge>
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Mentor
            </Badge>
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Contributor
            </Badge>
            <Badge variant="secondary" className="hover:bg-secondary/50">
              Volunteer
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarIcon(props: React.ComponentProps<"svg">) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}


function StarIcon(props: React.ComponentProps<"svg">) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}


function TrophyIcon(props: React.ComponentProps<"svg">) {
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
  )
}