import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  Progress,
  TextInput
} from "@patternfly/react-core";
import { useState } from "react";
import { listApiKeys, revokeApiKey } from "../api/adminApiKeys";
import type { ApiKeyFiltersState } from "../types";

type BulkRevokeDialogProps = {
  isOpen: boolean;
  defaultUserId?: string;
  onClose: () => void;
  onRevoked: () => void;
};

export const BulkRevokeDialog = ({
  isOpen,
  defaultUserId,
  onClose,
  onRevoked
}: BulkRevokeDialogProps) => {
  const [userId, setUserId] = useState(defaultUserId ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ total: number; current: number }>(
    {
      total: 0,
      current: 0
    }
  );

  const reset = () => {
    setUserId(defaultUserId ?? "");
    setIsLoading(false);
    setError(null);
    setProgress({ total: 0, current: 0 });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRevoke = async () => {
    if (!userId) {
      setError("User ID is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const filters: ApiKeyFiltersState = {
      userId,
      clientId: "",
      status: ""
    };

    try {
      const response = await listApiKeys(filters);
      const keys = response.keys;
      setProgress({ total: keys.length, current: 0 });

      for (const [index, key] of keys.entries()) {
        await revokeApiKey(key.id);
        setProgress({ total: keys.length, current: index + 1 });
      }

      onRevoked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke keys");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Bulk revoke API keys"
      isOpen={isOpen}
      onClose={handleClose}
      variant="medium"
      actions={[
        <Button
          key="revoke"
          variant="danger"
          onClick={handleRevoke}
          isLoading={isLoading}
        >
          Revoke all
        </Button>,
        <Button key="cancel" variant="link" onClick={handleClose}>
          Cancel
        </Button>
      ]}
    >
      {error && (
        <Alert isInline variant="danger" title="Error">
          {error}
        </Alert>
      )}
      <Form>
        <FormGroup label="User ID" isRequired fieldId="bulk-revoke-user">
          <TextInput
            id="bulk-revoke-user"
            value={userId}
            onChange={(_event, value) => setUserId(value)}
          />
        </FormGroup>
      </Form>
      {progress.total > 0 && (
        <Progress
          title="Revoking keys"
          value={progress.current}
          max={progress.total}
        />
      )}
    </Modal>
  );
};
