import Image from 'next/image'
import { LoginForm } from "@/components/login-form"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SelesaikanPendaftaranForm } from '@/components/selesaikan-pendaftaran'

export default function SelesaikanPendaftaranPage() {
  return (
    // <div className="grid min-h-svh lg:grid-cols-2">
    <div className="grid min-h-svh">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-white text-primary-foreground flex size-6 items-center justify-center rounded-md">
              
              <div className="border-4 border-gray-200 rounded-lg">
                <Avatar className="h-8 w-8 ">
                <AvatarImage src="/logo.png" alt="logo" />
                <AvatarFallback className="">SIG</AvatarFallback>
                </Avatar>
              {/* <Image
                src="/logo.png"
                width={40}
                height={40}
                alt="Picture of the author"
              /> */}
            </div>
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SelesaikanPendaftaranForm />
          </div>
        </div>
      </div>
      {/* <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div> */}
    </div>
  )
}
