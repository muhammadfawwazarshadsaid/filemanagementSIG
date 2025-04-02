// src/components/SelesaikanPendaftaranForm.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Info, InfoIcon, CheckCheck, LayoutDashboard, CheckCheckIcon, CheckIcon } from "lucide-react";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import WorkspaceSelector from "./workspace-selector";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface SelesaikanPendaftaranFormProps extends React.ComponentProps<"div"> {}

const TOTAL_STEPS = 3;
const METADATA_SYARAT_KEY = 'syarat_disetujui';

export function SelesaikanPendaftaranForm({
    className,
    ...props
}: SelesaikanPendaftaranFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const app = useStackApp();
    const user = useUser();
    const router = useRouter();

    const [userData, setUserData] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingStep, setIsSavingStep] = useState(false);
    const [isWorkspaceSelected, setIsWorkspaceSelected] = useState(false); // State baru

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [setujuSyarat, setSetujuSyarat] = useState(false);

    const [stepError, setStepError] = useState('');
    const [errorName, setErrorName] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorSyarat, setErrorSyarat] = useState('');
    const [finalSuccessMessage, setFinalSuccessMessage] = useState('');

    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

    const determineInitialStep = useCallback((currentUser: CurrentUser | null) => {
        if (!currentUser) return 1;

        const isStep1Complete = !!(currentUser.displayName && currentUser.hasPassword);
        if (!isStep1Complete) return 1;

        const isStep2Complete = isWorkspaceSelected; // Gunakan state
        if (!isStep2Complete) return 2;

        const isStep3Complete = !!currentUser.metadata?.[METADATA_SYARAT_KEY];
        if (!isStep3Complete) return 3;

        return TOTAL_STEPS + 1;

    }, [isWorkspaceSelected]); // Tambahkan isWorkspaceSelected sebagai dependensi

    useEffect(() => {
        let isMounted = true;

        async function fetchAndInitialize() {
            setIsLoading(true);
            setStepError('');
            setFinalSuccessMessage('');
            try {
                const currentUser = await app.getUser();
                if (!isMounted) return;

                setUserData(currentUser);

                if (currentUser) {
                    if (currentUser.primaryEmail) setEmail(currentUser.primaryEmail);
                    if (currentUser.displayName) setName(currentUser.displayName);

                    if (currentUser.metadata?.[METADATA_SYARAT_KEY]) {
                        setSetujuSyarat(true);
                    }

                    const initialStep = determineInitialStep(currentUser);

                    if (initialStep > TOTAL_STEPS) {
                        setFinalSuccessMessage("Pendaftaran Anda sudah lengkap.");
                    } else {
                        setCurrentStep(initialStep);
                    }

                } else {
                    console.error("Pengguna tidak ditemukan.");
                    setCurrentStep(1);
                }
            } catch (error) {
                console.error("Error getting user:", error);
                if (isMounted) {
                    setStepError("Gagal memuat data pengguna.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchAndInitialize();

        return () => {
            isMounted = false;
        };
    }, [app, determineInitialStep]);

    const saveCurrentStepData = async (): Promise<boolean> => {
        if (!user) {
            setStepError("Sesi pengguna tidak valid untuk menyimpan data.");
            return false;
        }

        setIsSavingStep(true);
        setStepError('');
        let success = false;
        const currentMetadata = userData?.metadata || {};

        try {
            const tasks = [];
            if (currentStep === 1) {
                const shouldUpdateName = name && name !== userData?.displayName;
                const shouldUpdatePassword = password && !userData?.hasPassword;

                if (shouldUpdateName) {
                    console.log("Menyimpan Nama:", name);
                    tasks.push(user.setDisplayName(name));
                }
                if (shouldUpdatePassword) {
                    console.log("Menyimpan Password...");
                    tasks.push(user.setPassword({ password }));
                }
            }
            // Step 2 tidak menyimpan data di sini, WorkspaceSelector menanganinya
            else if (currentStep === 3) {
                if (setujuSyarat && !currentMetadata[METADATA_SYARAT_KEY]) {
                    console.log("Menyimpan Persetujuan Syarat...");
                    const newMetadata = { ...currentMetadata, [METADATA_SYARAT_KEY]: true };
                    tasks.push(user.setMetadata(newMetadata));
                }
            }

            if (tasks.length > 0) {
                await Promise.all(tasks);
                const updatedUser = await app.getUser();
                setUserData(updatedUser);
                if (updatedUser) {
                    if (updatedUser.displayName && !name) setName(updatedUser.displayName);
                    if (updatedUser.metadata?.[METADATA_SYARAT_KEY] && !setujuSyarat) setSetujuSyarat(true);
                }
                console.log(`Data untuk Step ${currentStep} berhasil disimpan.`);
                success = true;
            } else {
                console.log(`Tidak ada data baru untuk disimpan di Step ${currentStep}.`);
                success = true;
            }

        } catch (err: any) {
            console.error(`Error saving data for step ${currentStep}:`, err);
            setStepError(err.message || `Gagal menyimpan data untuk langkah ${currentStep}.`);
            success = false;
        } finally {
            setIsSavingStep(false);
        }
        return success;
    };

    const handleNextStep = async () => {
        setStepError('');
        setErrorName('');
        setErrorPassword('');
        setErrorSyarat('');

        let isValid = true;

        if (currentStep === 1) {
            if (!name && !userData?.displayName) {
                setErrorName('Nama tidak boleh kosong.');
                isValid = false;
            }
            if (!password && !userData?.hasPassword) {
                setErrorPassword('Password tidak boleh kosong.');
                isValid = false;
            }
        }

        if (currentStep === 3) {
            if (!setujuSyarat) {
                setErrorSyarat('Anda harus menyetujui syarat dan ketentuan.');
                isValid = false;
            }
        }

        if (!isValid) {
            setStepError("Mohon periksa kembali isian pada langkah ini.");
            return;
        }

        const saveSuccess = await saveCurrentStepData();

        if (saveSuccess) {
            if (currentStep < TOTAL_STEPS) {
                setCurrentStep(currentStep + 1);
                if (currentStep === 1 && password) {
                    setPassword('');
                }
            } else {
                console.log("Semua langkah selesai dan disimpan.");
                setFinalSuccessMessage('Pendaftaran berhasil diselesaikan!');
            }
        }
    };

    const handlePreviousStep = () => {
        setStepError('');
        setErrorName('');
        setErrorPassword('');
        setErrorSyarat('');
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const StepProgress = () => (
        <div className="flex justify-center items-center space-x-4 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                const stepNumber = index + 1;
                let isCompleted = false;
                if (stepNumber === 1) isCompleted = !!(userData?.displayName && userData?.hasPassword);
                else if (stepNumber === 2) isCompleted = isWorkspaceSelected;
                else if (stepNumber === 3) isCompleted = !!userData?.metadata?.[METADATA_SYARAT_KEY];
                const isActive = stepNumber === currentStep && !isCompleted;
                const isTrulyCompleted = stepNumber < currentStep || isCompleted;

                return (
                    <React.Fragment key={stepNumber}>
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold transition-colors duration-300",
                                    isActive ? "bg-blue-600 border-blue-600 text-white" : "",
                                    isTrulyCompleted ? "bg-green-500 border-green-500 text-white" : "",
                                    !isActive && !isTrulyCompleted ? "border-gray-300 text-gray-500" : ""
                                )}
                            >
                                {isTrulyCompleted ? <Check size={16} /> : stepNumber}
                            </div>
                            <span className={cn("text-xs mt-1", isActive ? "font-bold text-blue-700" : "text-gray-500", isTrulyCompleted ? "text-green-600" : "")}>
                                {stepNumber === 1 && "Profil"}
                                {stepNumber === 2 && "Workspace"}
                                {stepNumber === 3 && "Konfirmasi"}
                            </span>
                        </div>
                        {stepNumber < TOTAL_STEPS && (
                            <div
                                className={cn(
                                    "flex-1 h-1 transition-colors duration-300",
                                    isTrulyCompleted ? "bg-green-500" : "bg-gray-300"
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    if (isLoading) {
        return <div className="flex justify-center items-center p-10 text-sm font-medium"> <Loader2 className="mr-2 text-gray-400 h-8 w-8 animate-spin" />Memuat data & status pendaftaran...</div>;
    }

    if (finalSuccessMessage) {
        return (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
                <Check className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">Pendaftaran Selesai!</h2>
                <p className="text-green-600">{finalSuccessMessage}</p>
                <Button
                    onClick={() => router.push('/')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                    Lanjutkan ke Beranda
                </Button>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-6 bg-background", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center bg-background">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Selesaikan Pendaftaran
                </h1>
            </div>

            <StepProgress />

            {stepError && <p className="text-red-500 text-center text-sm mb-4 font-semibold bg-red-100 p-2 rounded">{stepError}</p>}

            <div className="">
                {currentStep === 1 && (
                    <div className="grid gap-6 animate-fadeIn">
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center text-gray-700">
                                {email || "Memuat..."}
                            </p>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="name">Nama</Label>
                            {userData?.displayName ? (
                                <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center">
                                    {userData.displayName}
                                </p>
                            ) : (
                                <>
                                    <Input className="h-12" id="name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Nama Lengkap Anda" disabled={isSavingStep} aria-describedby="name-error" />
                                    {errorName && <p id="name-error" className="text-red-600 font-bold text-xs">{errorName}</p>}
                                </>
                            )}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="password">Password</Label>
                            {userData?.hasPassword ? (
                                <p className="font-bold flex items-center gap-2 text-green-600">Password sudah diatur <span className="p-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white"><Check size={16} /></span></p>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type={isPasswordVisible ? "text" : "password"} placeholder="Buat Password Baru" className="h-12 pr-10" disabled={isSavingStep} aria-describedby="password-error" />
                                        <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900" aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}>
                                            {isPasswordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                    {errorPassword && <p id="password-error" className="text-red-600 font-bold text-xs">{errorPassword}</p>}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div >
                      <h2 className="text-xl font-semibold mb-6 text-center">Buat Workspace Pertama Kalinya</h2>
                      {/* <div className="flex  text-xs p-2 outline-1 outline-gray-200 items-center rounded-lg justify-start">
                        <LayoutDashboard size={36} className="text-blue-500"></LayoutDashboard>
                        <p className="ml-2 text-black-500 text-black/70 font-medium">Untuk kelola unit/satuan kerja/holding. Misal: Semen Tonasa</p>
                      </div> */}
                        <WorkspaceSelector onWorkspaceSelected={() => setIsWorkspaceSelected(true)} />
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="grid gap-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold mb-2 text-center">Konfirmasi & Persetujuan</h2>
                        <div className="space-y-2 border p-4 rounded-md bg-gray-50 text-sm">
                            <p><strong>Nama:</strong> {name || userData?.displayName || '-'}</p>
                            <p><strong>Email:</strong> {email || '-'}</p>
                            <p><strong>Password:</strong> {userData?.hasPassword || password ? <span className="text-green-600">Akan diatur / Sudah diatur</span> : <span className="text-gray-500">Belum diatur</span>}</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <input
                                type="checkbox"
                                id="syarat"
                                checked={setujuSyarat}
                                onChange={(e) => setSetujuSyarat(e.target.checked)}
                                disabled={isSavingStep}
                                className="mt-1"
                                aria-describedby="syarat-error"
                            />
                            <Label htmlFor="syarat" className="text-sm font-normal text-gray-700">
                                Saya menyetujui <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">syarat dan ketentuan</a> yang berlaku.
                            </Label>
                        </div>
                        {errorSyarat && <p id="syarat-error" className="text-red-600 font-bold text-xs">{errorSyarat}</p>}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-8">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1 || isSavingStep}
                    className={cn(currentStep === 1 ? "invisible" : "")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSavingStep}
                    className={cn(
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        currentStep === TOTAL_STEPS ? "bg-green-600 hover:bg-green-700" : ""
                    )}
                >
                    {isSavingStep ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                        </>
                    ) : currentStep === TOTAL_STEPS ? (
                        "Selesaikan Pendaftaran"
                    ) : (
                        <>Lanjutkan <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </div>

        </div>
    );
}