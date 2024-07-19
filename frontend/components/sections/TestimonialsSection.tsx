import React from 'react'
import { Card } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

type Props = {}

function TestimonialsSection({}: Props) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Participants Say</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from the coders who have conquered our programming contests and transformed their careers.
                </p>
              </div>
              <div className="grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <Card className="flex flex-col items-start gap-4 rounded-lg bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-sm text-muted-foreground">Software Engineer</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    &quot;Participating in the coding contest was a game-changer\n for me. It not only challenged my
                    skills but also\n connected me with a vibrant community of coders. The experience was
                    invaluable.&quot;
                  </p>
                </Card>
                <Card className="flex flex-col items-start gap-4 rounded-lg bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">Sarah Miller</p>
                      <p className="text-sm text-muted-foreground">Software Developer</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                  &quot;The coding contest was an incredible opportunity to\n showcase my skills and learn from the
                    best\n\n in\n the\n industry. The challenges were engaging and the prizes\n were truly motivating.&quot;
                  </p>
                </Card>
                <Card className="flex flex-col items-start gap-4 rounded-lg bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">Michael Roth</p>
                      <p className="text-sm text-muted-foreground">Software Architect</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                  &quot;The coding contest was a fantastic opportunity to\n challenge myself and push the boundaries of\n\n
                    my\n coding\n skills. The experience has been invaluable in my\n career.&quot;
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
  )
}

export default TestimonialsSection