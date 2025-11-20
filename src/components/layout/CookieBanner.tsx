"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function CookieBanner() {
    const t = useTranslations();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        console.log(consent);
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (pathname.includes("/auth")) return null;

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
            <Card className="shadow-lg border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("cookie.title")}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                        {t("cookie.description")}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                    <Button onClick={handleAccept} size="sm" className="w-full">
                        {t("cookie.accept")}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
