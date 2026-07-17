import { Suspense } from "react"
import { Pagination } from "@/components/pagination"

export function PaginationWrapper(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Suspense>
      <Pagination {...props} />
    </Suspense>
  )
}
