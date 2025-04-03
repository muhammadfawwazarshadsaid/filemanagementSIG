"use client"

import { useRouter } from 'next/navigation';
import { useUser } from "@stackframe/stack"; // Pastikan path ini benar

import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  Loader2
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar" // Sesuaikan path jika perlu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Sesuaikan path jika perlu
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar" // Sesuaikan path jika perlu
import { cn } from '@/lib/utils'; // Sesuaikan path jika perlu

export function NavUser() {
  const { isMobile } = useSidebar();
  const user = useUser(); // Panggil hook useUser
  const router = useRouter();

  // Handler Navigasi & Logout (Tetap sama)
  const handleAccountClick = () => {
    router.push('/app/settings/account'); // Sesuaikan path akun
  };

  const handleLogoutClick = async () => {
    if (user?.signOut) {
      try {
        await user.signOut();
        // Mungkin tidak perlu push, StackFrame/library auth akan handle redirect
        // router.push('/login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  // === KOREKSI BAGIAN INI ===
  // isLoading bernilai true jika objek user belum ada (null atau undefined)
  // Ini mencakup state awal loading DAN state ketika user sudah logout
  const isLoading = !user;

  // Ambil data user, gunakan optional chaining (?) dan fallback
  // Sesuaikan properti ini dengan struktur user object dari StackFrame Anda
  const userName = user?.displayName || 'Guest'; // Atau nama default lain
  const userEmail = user?.primaryEmail || ''; // Email bisa kosong jika tidak login
  const userAvatarUrl = "/profile.svg"; // Ambil URL avatar, bisa undefined
  const avatarFallback = userName?.substring(0, 1).toUpperCase() || '?';
  // ==========================

  return (
    <SidebarMenu className="items-center">
      <SidebarMenuItem className="justify-end">
        <DropdownMenu>
          {/* Trigger hanya aktif jika user sudah ada (sudah login) */}
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                // Style disabled/loading tetap bisa dipakai jika user null/undefined
                isLoading && "cursor-not-allowed opacity-60"
              )}
              aria-label="User menu" // Tambah aria-label
            >
                 {/* Tampilkan Loader jika user belum ada (loading/logout) */}
                 {/* Tampilkan Avatar jika user sudah ada */}
                 {isLoading ? (
                     // Mungkin tampilkan ikon user generik jika logout, bukan loader?
                     // Atau biarkan loader jika state awal
                     <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        {/* Alternatif jika sudah dipastikan logout: <UserIcon className="h-5 w-5 text-muted-foreground" /> */}
                     </div>
                 ) : (
                     <Avatar className="h-8 w-8 rounded-md">
                         <AvatarImage src={userAvatarUrl} alt={userName} />
                         <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                             {avatarFallback}
                         </AvatarFallback>
                     </Avatar>
                 )}

              {/* Tampilkan nama hanya jika tidak mobile DAN user sudah ada */}
              {/* {!isMobile && !isLoading && (
                 <span className="ml-2 text-sm font-medium truncate">{userName}</span>
              )} */}
              {/* Tampilkan chevron hanya jika user sudah ada */}
              {!isLoading && <ChevronDown className="ml-auto size-4" />}

            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Konten dropdown hanya ditampilkan jika user sudah ada */}
            {!isLoading && user && ( // Tambahkan check `user` di sini untuk kepastian
                 <>
                     <DropdownMenuLabel className="p-0 font-normal">
                         <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                             <Avatar className="h-8 w-8 rounded-md">
                                 <AvatarImage src={userAvatarUrl} alt={userName} />
                                 <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                                     {avatarFallback}
                                 </AvatarFallback>
                             </Avatar>
                             <div className="grid flex-1 text-left text-sm leading-tight">
                                 <span className="truncate font-medium">{userName}</span>
                                 <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                             </div>
                         </div>
                     </DropdownMenuLabel>
                     {/* <DropdownMenuSeparator />
                     <DropdownMenuGroup>
                         <DropdownMenuItem onSelect={handleAccountClick} className="cursor-pointer">
                             <UserIcon className="mr-2 size-4" />
                             <span>Account</span>
                         </DropdownMenuItem>
                     </DropdownMenuGroup> */}
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onSelect={handleLogoutClick} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                         <LogOut className="mr-2 size-4"/>
                         <span>Log out</span>
                     </DropdownMenuItem>
                 </>
             )}
             {/* Jika isLoading true, bisa tampilkan pesan loading di dropdown */}
             {isLoading && (
                 <DropdownMenuLabel className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" /> Checking session...
                 </DropdownMenuLabel>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}