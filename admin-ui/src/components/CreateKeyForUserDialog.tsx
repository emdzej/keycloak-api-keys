import {
  Alert,
  Button,
  ClipboardCopy,
  Form,
  FormGroup,
  Modal,
  TextInput
} from "@patternfly/react-core";
import { useState } from "react";
import { createApiKeyForUser } from "../api/adminApiKeys";
import type { CreateApiKeyResponse } from "../types";

type CreateKeyForUserDialogProps = {
  isOpen: boolean;
  defaultUserId?: string;
  onClose: () => void;
  onCreated: () => void;
};

const emptyForm = {
  userId: "",
  name: "",
  clientId: "",
  expiresAt: ""
};

export const CreateKeyForUserDialog = ({
  isOpen,
  defaultUserId,
  onClose,
  onCreated
}: CreateKeyForUserDialogProps) => {
  const [form, setForm] = useState({
    ...emptyForm,
    userId: defaultUserId ?? ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null
  );

  const reset = () => {
    setForm({ ...emptyForm, userId: defaultUserId ?? "" });
    setError(null);
    setCreatedKey(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.userId || !form.clientId || !form.name) {
      setError("User ID, client ID, and name are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const created = await createApiKeyForUser(form.userId, {
        name: form.name,
        clientId: form.clientId,
        expiresAt: form.expiresAt || null
      });
      setCreatedKey(created);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Create API key"
      isOpen={isOpen}
      onClose={handleClose}
      variant="medium"
      actions={
        createdKey
          ? [
              <Button key="close" variant="primary" onClick={handleClose}>
                Close
              </Button>
            ]
          : [
              <Button
                key="create"
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Create
              </Button>,
              <Button key="cancel" variant="link" onClick={handleClose}>
                Cancel
              </Button>
            ]
      }
    >
      {error && (
        <Alert isInline variant="danger" title="Error">
          {error}
        </Alert>
      )}
      {createdKey ? (
        <>
          <p>API key created successfully. Copy it now:</p>
          <ClipboardCopy isReadOnly>{createdKey.key}</ClipboardCopy>
        </>
      ) : (
        <Form>
          <FormGroup label="User ID" isRequired fieldId="create-api-key-user">
            <TextInput
              id="create-api-key-user"
              value={form.userId}
              onChange={(_event, value) =>
                setForm((prev) => ({ ...prev, userId: value }))
              }
            />
          </FormGroup>
          <FormGroup
            label="Client ID"
            isRequired
            fieldId="create-api-key-client"
          >
            <TextInput
              id="create-api-key-client"
              value={form.clientId}
              onChange={(_event, value) =>
                setForm((prev) => ({ ...prev, clientId: value }))
              }
            />
          </FormGroup>
          <FormGroup label="Name" isRequired fieldId="create-api-key-name">
            <TextInput
              id="create-api-key-name"
              value={form.name}
              onChange={(_event, value) =>
                setForm((prev) => ({ ...prev, name: value }))
              }
            />
          </FormGroup>
          <FormGroup label="Expires at (ISO)" fieldId="create-api-key-expires">
            <TextInput
              id="create-api-key-expires"
              value={form.expiresAt}
              placeholder="2027-01-01T00:00:00Z"
              onChange={(_event, value) =>
                setForm((prev) => ({ ...prev, expiresAt: value }))
              }
            />
          </FormGroup>
        </Form>
      )}
    </Modal>
  );
};
