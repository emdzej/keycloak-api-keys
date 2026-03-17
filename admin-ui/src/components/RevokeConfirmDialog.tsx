import { Button, Modal } from "@patternfly/react-core";

type RevokeConfirmDialogProps = {
  isOpen: boolean;
  keyName?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
};

export const RevokeConfirmDialog = ({
  isOpen,
  keyName,
  onConfirm,
  onClose,
  isLoading = false
}: RevokeConfirmDialogProps) => (
  <Modal
    title="Revoke API key"
    isOpen={isOpen}
    onClose={onClose}
    variant="small"
    actions={[
      <Button
        key="confirm"
        variant="danger"
        onClick={onConfirm}
        isLoading={isLoading}
      >
        Revoke
      </Button>,
      <Button key="cancel" variant="link" onClick={onClose}>
        Cancel
      </Button>
    ]}
  >
    Are you sure you want to revoke
    {keyName ? ` "${keyName}"` : " this key"}? This action cannot be undone.
  </Modal>
);
