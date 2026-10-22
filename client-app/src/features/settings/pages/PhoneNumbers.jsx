/**
 * ============================================================
 * AutoComm — Client Dedicated Phone Numbers Management
 * Displays only phone numbers allocated by the SuperAdmin
 * ============================================================
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/shared/lib/queryClient";
import { Phone, Check, Trash2, CreditCard, Link as LinkIcon, Smartphone, Video } from "lucide-react";
import { useDemoMode } from "@/shared/components/DemoModeBanner";
import { DataPagination, usePagination } from "@/shared/components/ui/data-pagination";
import { useToast } from "@/shared/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";

const DEFAULT_MONTHLY_CREDITS = 50;

function normalizeContactPhone(phone) {
    let cleaned = (phone || "").replace(/[\s\-().]/g, "");
    if (cleaned.startsWith("00"))
        cleaned = `+${cleaned.slice(2)}`;
    if (!cleaned.startsWith("+") && cleaned.length >= 10)
        cleaned = `+${cleaned}`;
    return cleaned;
}

function inferCountryFromPhone(phone) {
    if (!phone) return "—";
    if (phone.startsWith("+91")) return "IN";
    if (phone.startsWith("+44")) return "UK";
    if (phone.startsWith("+61")) return "AU";
    if (phone.startsWith("+49")) return "DE";
    if (phone.startsWith("+33")) return "FR";
    if (phone.startsWith("+971")) return "AE";
    if (phone.startsWith("+65")) return "SG";
    if (phone.startsWith("+81")) return "JP";
    if (phone.startsWith("+55")) return "BR";
    if (phone.startsWith("+1")) return "US";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1")))
        return "US";
    return "—";
}

export default function PhoneNumbers() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { isDemoMode } = useDemoMode();
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [, setLocation] = useLocation();
    const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
    const [numberToRelease, setNumberToRelease] = useState(null);

    // 1. Quota & Public platform settings
    const { data: publicSettings } = useQuery({
        queryKey: ["/api/settings/public"],
    });
    const MONTHLY_CREDITS = publicSettings?.phone_number_monthly_credits || DEFAULT_MONTHLY_CREDITS;

    // 2. Fetch only dedicated phone numbers assigned by Superadmin to this client
    const { data: assignedNumbersResponse, isLoading: numbersLoading } = useQuery({
        queryKey: ["/api/phone-numbers"],
    });

    const phoneNumbers = useMemo(() => {
        const list = Array.isArray(assignedNumbersResponse)
            ? assignedNumbersResponse
            : (assignedNumbersResponse?.data || []);

        return list.map((item) => {
            const rawPhone = item.phoneNumber || item.phone || "";
            const phone = normalizeContactPhone(rawPhone);
            return {
                id: item.id || item._id,
                phone,
                rawPhone,
                country: item.country || inferCountryFromPhone(phone),
                friendlyName: item.friendlyName || "",
                assignedAgentName: item.assignedAgentName,
                assignedAgentId: item.assignedAgentId,
                status: item.status || "ACTIVE",
            };
        }).filter((item) => !!item.phone);
    }, [assignedNumbersResponse]);

    const releaseMutation = useMutation({
        mutationFn: async (number) => {
            await apiRequest("DELETE", `/api/phone-numbers/${number.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/incoming-connections"] });
            setReleaseDialogOpen(false);
            setNumberToRelease(null);
            toast({ title: t("phoneNumbers.toast.releaseSuccess", { defaultValue: "Phone number released successfully" }) });
        },
        onError: (error) => {
            toast({
                title: t("phoneNumbers.toast.releaseFailed", { defaultValue: "Failed to release phone number" }),
                description: error.message || t("common.tryAgain"),
                variant: "destructive",
            });
        },
    });

    const handleReleaseNumber = () => {
        if (isDemoMode) {
            toast({
                title: "Demo Mode Active",
                description: "Releasing phone numbers is disabled in demo mode.",
                variant: "destructive",
            });
            return;
        }
        if (numberToRelease) {
            releaseMutation.mutate(numberToRelease);
        }
    };

    const formatPhoneNumber = (phone) => {
        const cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 11 && cleaned.startsWith("1")) {
            return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
        }
        return phone;
    };

    const formatNationalNumber = (phone) => {
        const cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 11 && cleaned.startsWith("1")) {
            return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
        }
        if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
        }
        return phone;
    };

    const pillButton = "h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer";
    const releaseButton = "w-full h-10 rounded-full bg-[#FF4D6A] hover:bg-[#F43F5E] text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer";
    const totalNumbers = phoneNumbers.length;
    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems: paginatedPhoneNumbers, handlePageChange, handleItemsPerPageChange } = usePagination(phoneNumbers, 9);

    return (
        <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#2F6BFF]">
                            <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-tight">
                                {t("phoneNumbers.title", { defaultValue: "Phone Numbers" })}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {t("phoneNumbers.subtitle", { defaultValue: "Manage your dedicated phone numbers assigned by administrator for inbound and outbound calls" })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {isDemoMode && (
                            <button type="button" onClick={() => setIsVideoOpen(true)} className={pillButton} data-testid="button-watch-demo-phonenumbers">
                                <Video className="h-4 w-4" />
                                Watch Demo Video
                            </button>
                        )}
                        <button type="button" onClick={() => setLocation("/incoming-connections")} className={pillButton} data-testid="button-manage-connections">
                            <LinkIcon className="h-4 w-4" />
                            {t("phoneNumbers.manageConnections", { defaultValue: "Manage Connections" })}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {[
                        { icon: Phone, value: totalNumbers, label: t("phoneNumbers.stats.totalNumbers", { defaultValue: "Total Assigned Numbers" }), testId: "text-total-numbers" },
                        { icon: Check, value: totalNumbers, label: t("common.active", { defaultValue: "Active" }) },
                        { icon: CreditCard, value: MONTHLY_CREDITS, label: t("phoneNumbers.stats.creditsPerMonth", { defaultValue: "Credits / Month" }) },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="rounded-xl bg-white border border-slate-100 px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Icon className="h-4 w-4 text-slate-400" />
                                    <span className="text-lg font-semibold" data-testid={stat.testId}>{stat.value}</span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {numbersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
                            <div className="h-6 bg-slate-100 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                            <div className="h-4 bg-slate-100 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : phoneNumbers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No phone numbers assigned</h3>
                    <p className="text-slate-500 mb-4 max-w-md mx-auto">
                        Dedicated phone numbers assigned to your company by the platform administrator will appear here.
                    </p>
                    <button type="button" onClick={() => setLocation("/incoming-connections")} className={pillButton}>
                        Manage Incoming Connections
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedPhoneNumbers.map((number) => (
                            <div key={number.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid={`card-phone-${number.id}`}>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="min-w-0">
                                        <h3 className="text-[17px] font-semibold text-slate-900 font-mono break-all" data-testid="text-phone-number">
                                            {formatPhoneNumber(number.phone)}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-0.5">
                                            {number.friendlyName || formatNationalNumber(number.phone)}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-blue-600 text-white">
                                        Dedicated
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>{t("phoneNumbers.labels.country", { defaultValue: "Country" })}:</span>
                                        <span className="font-medium text-slate-900">{number.country}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>{t("phoneNumbers.labels.monthlyCost", { defaultValue: "Monthly Cost" })}:</span>
                                        <span className="font-medium text-slate-900">{MONTHLY_CREDITS} {t("phoneNumbers.labels.credits", { defaultValue: "Credits" })}</span>
                                    </div>
                                    {number.assignedAgentName && number.assignedAgentName !== "Unassigned" ? (
                                        <p className="pt-2 text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Connected: {number.assignedAgentName}
                                        </p>
                                    ) : (
                                        <p className="pt-2 text-sm text-slate-400 flex items-center gap-1.5" data-testid={`connection-status-not-connected-${number.id}`}>
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            Not connected to agent
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4 mt-2">
                                    <button
                                        type="button"
                                        className={releaseButton}
                                        onClick={() => {
                                            setNumberToRelease(number);
                                            setReleaseDialogOpen(true);
                                        }}
                                        data-testid={`button-release-${number.id}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {t("phoneNumbers.actions.release", { defaultValue: "Release Number" })}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <DataPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            itemsPerPageOptions={[9, 18, 27, 54]}
                            data-testid="pagination-phone-numbers"
                        />
                    )}
                </div>
            )}

            <AlertDialog open={releaseDialogOpen} onOpenChange={(open) => {
                setReleaseDialogOpen(open);
                if (!open) setNumberToRelease(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("phoneNumbers.dialog.releaseTitle", { defaultValue: "Release Phone Number" })}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to release {numberToRelease ? formatPhoneNumber(numberToRelease.phone) : "this number"}? It will be disconnected from any assigned AI agent and returned to the platform pool.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={releaseMutation.isPending}>{t("common.cancel", { defaultValue: "Cancel" })}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReleaseNumber}
                            disabled={releaseMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                            data-testid="button-confirm-release"
                        >
                            {releaseMutation.isPending ? t("phoneNumbers.actions.releasing", { defaultValue: "Releasing..." }) : t("phoneNumbers.actions.releaseNumber", { defaultValue: "Release Number" })}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isDemoMode && (
                <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                    <DialogContent className="sm:max-w-[850px] p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="relative aspect-video w-full">
                            <iframe
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                title="Demo Video"
                                className="w-full h-full rounded-xl"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
