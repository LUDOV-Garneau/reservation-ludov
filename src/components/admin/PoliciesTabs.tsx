"use client";

import { TabsContent } from "@radix-ui/react-tabs";
import PoliciesContent from "./policies/PoliciesContent";

export default function PoliciesTab() {
    return (
        <TabsContent value="policies">
            <PoliciesContent />
        </TabsContent>
    );
}