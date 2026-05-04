import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}
