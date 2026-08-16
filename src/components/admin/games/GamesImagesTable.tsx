"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Gamepad2,
  ImageIcon,
  ImagePlus,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import PaginationControls from "@/components/admin/reservations/list/Pagination";
import ImageUploadField from "@/components/admin/ImageUploadField";

const PAGE_SIZE = 12;

type GameRow = {
  id: number;
  titre: string;
  author: string | null;
  platform: string | null;
  picture: string | null;
  biblioId: number;
};

type HasImageFilter = "all" | "yes" | "no";

type AlertState = {
  type: "success" | "destructive";
  message: string;
} | null;

export default function GamesImagesTable() {
  const t = useTranslations("admin.gamesImages");
  const [gamesList, setGamesList] = useState<GameRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasImage, setHasImage] = useState<HasImageFilter>("all");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState>(null);
  const [editingGame, setEditingGame] = useState<GameRow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((next: NonNullable<AlertState>) => {
    setAlert(next);
    setTimeout(() => setAlert(null), 3500);
  }, []);

  // Recherche débouncée (350 ms) → repart à la page 1.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        hasImage,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/games?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

      setGamesList(data.games);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      showAlert({ type: "destructive", message: t("alerts.fetchError") });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, hasImage, showAlert, t]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleImageUploaded = useCallback(
    async (game: GameRow, path: string) => {
      try {
        const res = await fetch(`/api/admin/games/${game.id}/image`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setGamesList((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, picture: path } : g)),
        );
        setEditingGame(null);
        showAlert({ type: "success", message: t("alerts.updateSuccess") });
      } catch (err) {
        console.error(err);
        showAlert({ type: "destructive", message: t("alerts.updateError") });
      }
    },
    [showAlert, t],
  );

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type === "destructive" ? "destructive" : "default"}
          className={
            alert.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : ""
          }
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle className="font-semibold">
            {alert.type === "success" ? t("alerts.successTitle") : t("alerts.errorTitle")}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <Select
              value={hasImage}
              onValueChange={(value) => {
                setHasImage(value as HasImageFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                <SelectItem value="yes">{t("filter.withImage")}</SelectItem>
                <SelectItem value="no">{t("filter.withoutImage")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-3">
            <Gamepad2 className="h-4 w-4" />
            {t("count", { count: total })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : gamesList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <>
              <div className="px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{t("table.image")}</TableHead>
                      <TableHead>{t("table.title")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.platform")}
                      </TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        {t("table.status")}
                      </TableHead>
                      <TableHead className="text-end">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gamesList.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          {game.picture ? (
                            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted/30">
                              <Image
                                src={game.picture}
                                alt={game.titre}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted/40">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium max-w-[280px]">
                          <span className="line-clamp-2">{game.titre}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {game.platform || "—"}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {game.picture ? (
                            <Badge className="bg-green-100 text-green-800 border-0">
                              {t("status.withImage")}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-0">
                              {t("status.withoutImage")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingGame(game)}
                            className="gap-2"
                          >
                            <ImagePlus className="h-4 w-4" />
                            {t("importImage")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {total > PAGE_SIZE && (
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  <PaginationControls
                    page={page}
                    totalItems={total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    siblingCount={1}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingGame !== null}
        onOpenChange={(open) => !open && setEditingGame(null)}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">
              {t("importDialogTitle", { title: editingGame?.titre ?? "" })}
            </DialogTitle>
          </DialogHeader>
          {editingGame && (
            <ImageUploadField
              category="games"
              currentImage={editingGame.picture}
              allowUrlImport
              onUploaded={(path) => handleImageUploaded(editingGame, path)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
