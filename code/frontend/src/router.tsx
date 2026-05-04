import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OrganizationsPage = lazy(() => import("@/pages/OrganizationsPage"));
const ForbiddenPage = lazy(() => import("@/pages/ForbiddenPage"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "admin/driver-checkin",
        element: <SettingsPage />,
      },
      {
        path: "admin/organizations",
        element: <OrganizationsPage />,
      },
      {
        path: "403",
        element: <ForbiddenPage />,
      },
    ],
  },
]);
