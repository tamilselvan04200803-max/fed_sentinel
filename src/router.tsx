import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/src/components/layout/AppShell";
import { CommandCenter } from "@/src/features/command-center/CommandCenter";
import { FederationPage } from "@/src/features/federation/FederationPage";
import { IncidentList } from "@/src/features/incidents/IncidentList";
import { IncidentInvestigation } from "@/src/features/incidents/IncidentInvestigation";
import { TrustCenter } from "@/src/features/trust/TrustCenter";
import { ModelCenter } from "@/src/features/models/ModelCenter";
import { HospitalWorkstation } from "@/src/features/hospital/HospitalWorkstation";
import { AuditWorkspace } from "@/src/features/audit/AuditWorkspace";
import { SystemHealth } from "@/src/features/health/SystemHealth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <CommandCenter />,
      },
      {
        path: "federation",
        element: <FederationPage />,
      },
      {
        path: "incidents",
        element: <IncidentList />,
      },
      {
        path: "incidents/:incidentId",
        element: <IncidentInvestigation />,
      },
      {
        path: "trust",
        element: <TrustCenter />,
      },
      {
        path: "models",
        element: <ModelCenter />,
      },
      {
        path: "hospital",
        element: <HospitalWorkstation />,
      },
      {
        path: "hospital/:hospitalId",
        element: <HospitalWorkstation />,
      },
      {
        path: "audit",
        element: <AuditWorkspace />,
      },
      {
        path: "health",
        element: <SystemHealth />,
      },
      {
        path: "security",
        element: <SystemHealth />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
