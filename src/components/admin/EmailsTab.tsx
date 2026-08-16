"use client";

import { TabsContent } from "@/components/ui/tabs";
import EmailTemplatesEditor from "@/components/admin/emails/EmailTemplatesEditor";

export default function EmailsTab() {
  return (
    <TabsContent value="emails">
      <EmailTemplatesEditor />
    </TabsContent>
  );
}
