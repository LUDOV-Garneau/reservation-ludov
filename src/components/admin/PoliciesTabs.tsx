"use client";

import { TabsContent } from "@radix-ui/react-tabs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PoliciesContent from "./policies/PoliciesContent";

export default function PoliciesTab() {
  return (
    <TabsContent value="policies">
      <Tabs defaultValue="privacy" className="mt-2 sm:mt-4 px-2 sm:px-0">
        <TabsList>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
        </TabsList>
        <TabsContent value="privacy">
          <PoliciesContent type="privacy" />
        </TabsContent>
        <TabsContent value="usage">
          <PoliciesContent type="usage" />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
}
