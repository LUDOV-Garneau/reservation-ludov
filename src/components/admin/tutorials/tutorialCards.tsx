"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TutorialCardsProps } from "@/types/docs";
import Link from "next/link";

export default function TutorialCards(tuto: TutorialCardsProps) {
  const Icon = tuto.icons;
  return (
    <Card className="w-full hover:shadow-xl duration-300 ease-in-out hover:border-cyan-500 transition-all">
      <CardHeader>
        <CardTitle>{tuto.title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="bg-gray-100 p-5 flex justify-center items-center rounded-2xl">
          <Icon className="w-15 h-15 text-cyan-500" />
        </div>
      </CardContent>
      <CardFooter className="w-full mt-auto">
        <Link
          href={
            tuto.isAdminRessource
              ? `/admin/tutorials?page=${tuto.args}&adminRessources=true`
              : `/docs?page=${tuto.args}&adminRessources=false`
          }
          className="w-full"
        >
          <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 w-full">
            Voir la documentation
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
