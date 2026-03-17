import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Bullseye,
  Button,
  PageSection,
  Spinner,
  Stack,
  StackItem,
  Title
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { ApiKeyList } from "./components/ApiKeyList";
import { CreateKeyDialog } from "./components/CreateKeyDialog";
import { KeyCreatedDialog } from "./components/KeyCreatedDialog";
import { RevokeConfirmDialog } from "./components/RevokeConfirmDialog";
import { createApiKey, listApiKeys, revokeApiKey } from "./api/apiKeys";
import type { ApiKey, CreateApiKeyRequest } from "./types";

const getClientOptions = (): string[] => {
  const context = (window as {
    kcContext?: {
      clients?: Array<string | { clientId?: string }>;
      clientIds?: string[];
    };
  }).kcContext;

  if (Array.isArray(context?.clients)) {
    return context.clients
      .map((client) => (typeof client === "string" ? client : client.clientId))
      .filter((clientId): clientId is string => Boolean(clientId));
  }

  if (Array.isArray(context?.clientIds)) {
    return context.clientIds;
  }

  return [];
};

export const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const clientOptions = useMemo(() => getClientOptions(), []);

  const refreshKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listApiKeys();
      setApiKeys(response.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshKeys();
  }, [refreshKeys]);

  const handleCreate = async (payload: CreateApiKeyRequest) => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await createApiKey(payload);
      setCreatedKey(response.key);
      setIsCreateOpen(false);
      await refreshKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (apiKey: ApiKey) => {
    setIsRevoking(true);
    setError(null);
    try {
      await revokeApiKey(apiKey.id);
      setRevokeTarget(null);
      await refreshKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <PageSection padding={{ default: "padding" }}>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1">API Keys</Title>
        </StackItem>
        <StackItem>
          <Button
            variant="primary"
            icon={<PlusCircleIcon />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create API key
          </Button>
        </StackItem>
        {error && (
          <StackItem>
            <Alert variant="danger" title="Something went wrong">
              {error}
            </Alert>
          </StackItem>
        )}
        <StackItem>
          {isLoading ? (
            <Bullseye>
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <ApiKeyList apiKeys={apiKeys} onRevoke={setRevokeTarget} />
          )}
        </StackItem>
      </Stack>

      <CreateKeyDialog
        isOpen={isCreateOpen}
        isSubmitting={isCreating}
        clients={clientOptions}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
      <KeyCreatedDialog
        isOpen={Boolean(createdKey)}
        apiKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />
      <RevokeConfirmDialog
        isOpen={Boolean(revokeTarget)}
        apiKey={revokeTarget}
        isSubmitting={isRevoking}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </PageSection>
  );
};
