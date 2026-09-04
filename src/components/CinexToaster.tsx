import { Toaster } from "sonner";

/** Global Sonner host — wishlist toasts use custom CineX styling via `cinexToast`. */
export function CinexToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      expand={false}
      gap={12}
      toastOptions={{
        classNames: {
          toast: "cinex-toast-host",
        },
      }}
    />
  );
}
