import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";

type ToastSeverity = "success" | "error" | "info" | "warning";

type ToastState = {
  message: string;
  severity: ToastSeverity;
};

type ToastContextValue = {
  showToast: (message: string, severity?: ToastSeverity) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = "info") => {
      setToast({ message, severity });
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            variant="filled"
            severity={toast.severity}
            onClose={() => setToast(null)}
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast precisa de ToastProvider");
  }

  return context;
}
