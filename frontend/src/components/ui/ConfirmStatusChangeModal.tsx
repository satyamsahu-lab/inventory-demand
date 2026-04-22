import { Button } from "./Button";
import { Modal } from "./Modal";
import { cn } from "../../utils/cn";

interface ConfirmStatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: "active" | "inactive";
  count: number;
  loading?: boolean;
}

export function ConfirmStatusChangeModal({
  open,
  onClose,
  onConfirm,
  status,
  count,
  loading = false,
}: ConfirmStatusChangeModalProps) {
  const isActive = status === "active";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm Status Change"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="px-6"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              "px-8 shadow-sm",
              isActive
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
            )}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : `Confirm`}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-surface-600 text-sm font-medium">
          Are you sure you want to change the status of{" "}
          <span className="font-bold text-surface-900">{count}</span>{" "}
          {count === 1 ? "item" : "items"} to{" "}
          <span
            className={cn(
              "font-bold uppercase tracking-wider",
              isActive ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {status}
          </span>
          ?
        </p>
      </div>
    </Modal>
  );
}
