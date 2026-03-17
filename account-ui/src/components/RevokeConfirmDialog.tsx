import { Button, Modal } from "@patternfly/react-core";
import type { ApiKey } from "../types";

type RevokeConfirmDialogProps = {
  apiKey: ApiKey | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (apiKey: ApiKey) => void;
};

export const RevokeConfirmDialog = ({
  apiKey,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm
}: RevokeConfirmDialogProps) => (
  <Modal
    title="Revoke API key"
    isOpen={isOpen}
    onClose={onClose}
    actions={[
      <Button
        key="confirm"
        variant="danger"
        isDisabled={!apiKey || isSubmitting}
        isLoading={isSubmitting}
        onClick={() => apiKey && onConfirm(apiKey)}
      >
        Revoke
      </Button>,
      <Button key="cancel" variant="link" onClick={onClose}>
        Cancel
      </Button>
    ]}
  >
    Are you sure you want to revoke <strong>{apiKey?.name}</strong>? This
    action cannot be undone.
  </Modal>
);
