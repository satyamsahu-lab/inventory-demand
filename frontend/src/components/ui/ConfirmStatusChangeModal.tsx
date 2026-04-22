import { Button } from "./Button";
import { Modal } from "./Modal";
import { cn } from "../../utils/cn";

interface ConfirmStatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: string;
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
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "active":
      case "delivered":
        return "text-emerald-600";
      case "inactive":
      case "delete":
        return "text-rose-600";
      case "shipped":
        return "text-blue-600";
      case "in-transit":
        return "text-[hsl(var(--primary))]";
      case "pending":
        return "text-amber-600";
      default:
        return "text-surface-600";
    }
  };

  const getButtonColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "active":
      case "delivered":
        return "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white";
      case "inactive":
      case "delete":
        return "bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white";
      case "shipped":
        return "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] shadow-[hsl(var(--secondary)/0.2)] text-white"; // updated
      case "in-transit":
        return "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] shadow-[hsl(var(--primary)/0.2)] text-white"; // updated
      case "pending":
        return "bg-amber-600 hover:bg-amber-700 shadow-amber-200 text-white";
      default:
        return "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] shadow-[hsl(var(--primary)/0.2)] text-white";
    }
  };

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
            className={cn("px-8 shadow-sm", getButtonColor(status))}
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
              getStatusColor(status),
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
