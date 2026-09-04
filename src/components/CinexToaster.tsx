import { Toaster } from "sonner";

/** Global Sonner host — wishlist toasts use custom CineX styling via `cinexToast`. */
export function CinexToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      expand={false}
      gap={12}
      offset="calc(var(--cx-header-height) + 1rem)"
      mobileOffset={{
        top: "calc(var(--cx-header-height) + 0.75rem)",
        left: "0.75rem",
        right: "0.75rem",
      }}
      toastOptions={{
        classNames: {
          toast: "cinex-toast-host",
        },
      }}
    />
  );
}
