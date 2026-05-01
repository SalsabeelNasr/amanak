"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewPatientDialog } from "./new-patient-dialog";

export function PatientsPageToolbar() {
  const t = useTranslations("crm.patientsPage");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" aria-hidden />
        {t("newPatient")}
      </Button>
      <NewPatientDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
