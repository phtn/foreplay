import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkSquare01Icon } from "@hugeicons/core-free-icons"

export function Pattern() {
  return (
    <Card className="w-full max-w-xs gap-2 pt-5">
      <CardHeader>
        <CardTitle>Need a help in Claim?</CardTitle>
      </CardHeader>
      <CardContent className="mb-2">
        <p>
          Go to this step by step guideline process on how to certify for your
          weekly benefits:
        </p>
      </CardContent>
      <CardFooter className="py-2">
        <Button variant="link" className="px-0">
          See our guideline
          <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  )
}