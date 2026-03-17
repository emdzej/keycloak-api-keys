import {
  Alert,
  Button,
  ClipboardCopy,
  Modal,
  ModalVariant
} from "@patternfly/react-core";

type KeyCreatedDialogProps = {
  apiKey: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export const KeyCreatedDialog = ({
  apiKey,
  isOpen,
  onClose
}: KeyCreatedDialogProps) => (
  <Modal
    title="API key created"
    variant={ModalVariant.medium}
    isOpen={isOpen}
    onClose={onClose}
    actions={[
      <Button key="close" variant="primary" onClick={onClose}>
        Done
      </Button>
    ]}
  >
    <Alert isInline variant="warning" title="Copy this key now">
      For security reasons you will not be able to see it again.
    </Alert>
    <ClipboardCopy isReadOnly isCode variant="expansion">
      {apiKey ?? ""}
    </ClipboardCopy>
  </Modal>
);
