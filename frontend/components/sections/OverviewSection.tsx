import { CodeIcon, TrophyIcon, UserIcon } from 'lucide-react'
import React from 'react'

type Props = {}

const OverviewSection = (props: Props) => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Unleash Your Coding Prowess</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our programming contest offers a thrilling platform for coders of all levels to showcase their skills,
                  compete against the best, and win amazing prizes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary p-2 text-primary-foreground">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Easy Registration</h3>
                </div>
                <p className="text-muted-foreground">
                  Sign up in minutes and get ready to showcase your coding skills.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary p-2 text-primary-foreground">
                    <CodeIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Coding Challenges</h3>
                </div>
                <p className="text-muted-foreground">
                  Tackle a variety of coding challenges that test your problem-solving abilities.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary p-2 text-primary-foreground">
                    <TrophyIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Leaderboards</h3>
                </div>
                <p className="text-muted-foreground">
                  Track your progress and see how you stack up against the competition.
                </p>
              </div>
            </div>
          </div>
        </section>
  )
}

export default OverviewSection