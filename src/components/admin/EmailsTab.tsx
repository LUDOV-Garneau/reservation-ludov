"use client";

import { TabsContent } from "@/components/ui/tabs";
import EmailTemplatesManager from "@/components/admin/emails/EmailTemplatesManager";

export default function EmailsTab() {
  return (
    <TabsContent value="emails">
      <EmailTemplatesManager />
    </TabsContent>
  );
}
