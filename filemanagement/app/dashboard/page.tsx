import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Pencil, Search } from "lucide-react"
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
}
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex-1 h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
              <div className="flex">
                <h4 className="scroll-m-20 lg:text-xs text-xs font-bold tracking-tight mr-2 truncate">
                  Genesis
                </h4>
                {/* <Button variant={"secondary"} className="h-6 w-2"><Pencil className="h-2 w-2" size={3}></Pencil></Button> */}
              </div>
              <p className="text-xs text-gray-500 truncate">
                The king, seeing how much happier
              </p>
            </div>
            <div className="flex-1 items-right justify-right md:items-center">
              <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"}>
                <p className="text-gray-600 hidden md:inline">Temukan file di mana saja</p>
                <div className="md:bg-black sm:w-24 w-2 h-8 rounded-full items-center justify-center flex gap-2"><Search className="text-primary"></Search><p className="hidden md:inline text-white text-xs font-bold">Search</p></div>
              </Button>
            </div>
            <NavUser user={data.user} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
