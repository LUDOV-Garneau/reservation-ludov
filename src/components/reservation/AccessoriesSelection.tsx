"use client";

import { useState, useEffect } from "react";
import AccessorySelectionGrid from "@/components/reservation/components/AccessoriesSelectionGrid";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  XCircle,
  Joystick,
  Cable,
  MoveLeft,
} from "lucide-react";
import { useReservation } from "@/context/ReservationContext";

type Accessory = {
  id: number;
  name: string;
};

export default function AccessoriesSelection() {
  const {
    selectedAccessories,
    setSelectedAccessories,
    updateReservationAccessories,
    setCurrentStep,
    selectedGames,
    selectedConsole,
    currentStep,
  } = useReservation();

  const [allAccessories, setAllAccessories] = useState<Accessory[]>([]);
  const [requiredAccessories, setRequiredAccessories] = useState<number[]>([]);
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  type ApiResponse<T> = { success: boolean; data: T; message?: string };

  useEffect(() => {
    const controller = new AbortController();

    const fetchAccessories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/reservation/accessories", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const payload = (await res.json()) as ApiResponse<Accessory[]>;

        if (!res.ok || !payload.success) {
          throw new Error(payload.message || t("reservation.accessory.error"));
        }

        setAllAccessories(payload.data ?? []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setAllAccessories([]);
        setError(
          err instanceof Error ? err.message : t("reservation.accessory.error")
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRequiredAccessories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        selectedGames.forEach((id) => params.append("gameIds", id));

        const res = await fetch(
          `/api/reservation/required-accessories?${params.toString()}`
        );

        const data = (await res.json()) as { required_accessories: string[] };

        if (!res.ok) {
          throw new Error(t("reservation.accessory.error"));
        }

        const req = data.required_accessories.map(Number);

        setRequiredAccessories(req);

        setSelectedAccessories((prev) => {
          const merged = new Set([...prev, ...req]);
          return Array.from(merged);
        });
      } catch (err: unknown) {
        setRequiredAccessories([]);
        setError(
          err instanceof Error ? err.message : t("reservation.accessory.error")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessories();
    fetchRequiredAccessories();
    return () => controller.abort();
  }, []);

  const handleSelect = (accessory: Accessory) => {
    if (requiredAccessories.includes(accessory.id)) return;

    setSelectedAccessories((prev: number[]) => {
      if (prev.includes(accessory.id)) {
        return prev.filter((id) => id !== accessory.id);
      } else {
        return [...prev, accessory.id];
      }
    });
  };

  const handleRemove = (accessoryId: number) => {
    setSelectedAccessories((prev: number[]) =>
      prev.filter((id) => id !== accessoryId)
    );
  };

  const handleClearAll = () => {
    setSelectedAccessories(requiredAccessories);
  };

  const handleContinue = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateReservationAccessories(selectedAccessories);
      setCurrentStep(4);
    } catch (err) {
      console.error("Erreur sauvegarde accessoires:", err);
      setError(
        err instanceof Error ? err.message : t("reservation.accessory.error")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAccessoriesData = allAccessories.filter((a) =>
    selectedAccessories.includes(a.id)
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {selectedConsole && (
          <div className="bg-[white] rounded-2xl p-4 shadow-md mb-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Joystick className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {t("reservation.accessory.header_info")}
              </p>
              <p className="font-bold text-lg">{selectedConsole.name}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          <div className="col-span-1 xl:col-span-2">
            <div className="bg-[white] rounded-2xl shadow-lg sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <div
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="cursor-pointer flex flex-row items-center mb-8 w-fit"
                >
                  <MoveLeft className="h-6 w-6 mr-2" />
                  <p>{t("reservation.layout.previousStep")}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-cyan-500" />
                    {t("reservation.accessory.selection")}
                  </h2>
                  <div className="bg-cyan-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {selectedAccessories.length}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {t("reservation.accessory.selected_count", {
                    count: selectedAccessories.length,
                  })}
                </p>
              </div>

              {error && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      {t("reservation.accessory.error")}
                    </p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-2" />
                    <p className="text-sm text-gray-500">
                      {t("reservation.accessory.loading_text")}
                    </p>
                  </div>
                ) : selectedAccessoriesData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      {t("reservation.accessory.empty_selection")}
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedAccessoriesData.map((accessory) => (
                      <div
                        key={accessory.id}
                        className="bg-gray-100 rounded-xl p-4 flex items-center gap-3 group hover:bg-gray-200 transition-colors"
                      >
                        <div className="h-14 w-14 bg-[white] rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200">
                            <Cable className="h-6 w-6 text-cyan-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {accessory.name}
                          </p>
                        </div>

                        {!requiredAccessories.includes(accessory.id) && (
                          <button
                            onClick={() => handleRemove(accessory.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border transition-all
      bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50
      group-hover:opacity-100 opacity-0"
                            aria-label={t(
                              "reservation.accessory.remove_aria_label"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {selectedAccessoriesData.some(
                      (a) => !requiredAccessories.includes(a.id)
                    ) && (
                        <button
                          onClick={handleClearAll}
                          className="w-full text-sm text-gray-500 hover:text-red-500 py-2 transition-colors flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-300 bg-gray-50 hover:bg-red-50"
                        >
                          <Trash2 className="inline-block h-4 w-4 mr-1" />
                          {t("reservation.accessory.button_clear_all")}
                        </button>
                      )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 space-y-3">
                <Button
                  onClick={handleContinue}
                  disabled={isSaving || isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white h-12 text-base font-semibold rounded-xl shadow-md transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {t("reservation.accessory.button_state_loading_saving")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {t("reservation.accessory.button_continue")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  {t(
                    "reservation.accessory.help_text_continue_without_accessory"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-1 xl:col-span-4">
            <div className="bg-[white] rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {t("reservation.accessory.title_accessory_selection")}
                </h2>
                <p className="text-gray-600">
                  {t("reservation.accessory.subtitle_accessory")}
                </p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mb-4" />
                  <p className="text-gray-500">
                    {t("reservation.accessory.loading_accessory")}
                  </p>
                </div>
              ) : allAccessories.length === 0 ? (
                <div className="text-center py-20">
                  <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {t("reservation.accessory.title_no_accessory_available")}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    {t("reservation.accessory.no_accessory_available")}
                  </p>
                  <Button
                    onClick={handleContinue}
                    variant="outline"
                    className="mx-auto"
                  >
                    {t("reservation.accessory.skip_step")}
                  </Button>
                </div>
              ) : (
                <AccessorySelectionGrid
                  accessories={allAccessories}
                  selectedIds={selectedAccessories}
                  requiredIds={requiredAccessories}
                  onSelect={handleSelect}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
