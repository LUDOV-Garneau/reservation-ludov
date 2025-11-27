"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface TutorialCardsProps {
  tuto: {
    title: string;
    description: string;
    link: string;
    icons: React.ComponentType;
  };
}

export default function TutorialCards({ tuto }: TutorialCardsProps) {
  return (
    <Card className="w-full hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle>{tuto.title}</CardTitle>
        <CardDescription>{tuto.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="bg-gray-100 p-10 flex justify-center items-center rounded-2xl">
          <tuto.icons className="w-10 h-10 text-cyan-500" />
        </div>
      </CardContent>
      <CardFooter className="w-full mt-auto">
        <Link href={tuto.link} className="w-full">
          <Button className="bg-cyan-500 hover:bg-cyan-700 w-full">
            Go to Tutorial
          </Button>
        </Link>{" "}
      </CardFooter>
    </Card>
  );
}
