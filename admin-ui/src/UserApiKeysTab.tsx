import {
  Alert,
  Button,
  PageSection,
  PageSectionVariants,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from "@patternfly/react-core";
import { useCallback, useEffect, useState } from "react";
import { getApiKeyStats, listApiKeys, revokeApiKey } from "./api/adminApiKeys";
import { ApiKeyStatsModal } from "./components/ApiKeyStats";
import { ApiKeyTable } from "./components/ApiKeyTable";
import { BulkRevokeDialog } from "./components/BulkRevokeDialog";
import { CreateKeyForUserDialog } from "./components/CreateKeyForUserDialog";
import { RevokeConfirmDialog } from "./components/RevokeConfirmDialog";
import type { AdminApiKey, ApiKeyFiltersState, ApiKeyStats } from "./types";

const getUserIdFromLocation = () => {
  const path = `${window.location.pathname}${window.location.hash}`;
  const match = path.match(/\/users\/([^/]+)/);
  return match?.[1] ?? "";
};

type UserApiKeysTabProps = {
  userId?: string;
};

export const UserApiKeysTab = ({ userId }: UserApiKeysTabProps) => {
  const resolvedUserId = userId || getUserIdFromLocation();
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState<AdminApiKey | null>(null);
  const [stats, setStats] = useState<ApiKeyStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [revokeKey, setRevokeKey] = useState<AdminApiKey | null>(null);
  const [isRevokeLoading, setIsRevokeLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!resolvedUserId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const filters: ApiKeyFiltersState = {
        userId: resolvedUserId,
        clientId: "",
        status: ""
      };
      const response = await listApiKeys(filters);
      setKeys(response.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const handleStats = async (apiKey: AdminApiKey) => {
    setStatsKey(apiKey);
    setIsStatsLoading(true);
    try {
      const statsResponse = await getApiKeyStats(apiKey.id);
      setStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeKey) {
      return;
    }
    setIsRevokeLoading(true);
    try {
      await revokeApiKey(revokeKey.id);
      setRevokeKey(null);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setIsRevokeLoading(false);
    }
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h2">User API Keys</Title>
      </PageSection>
      <PageSection>
        {!resolvedUserId && (
          <Alert isInline variant="warning" title="User ID not found">
            Unable to resolve user ID from the URL. Please open this tab from a
            user details page.
          </Alert>
        )}
        {error && (
          <Alert isInline variant="danger" title="Error">
            {error}
          </Alert>
        )}
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant="primary"
                onClick={() => setIsCreateOpen(true)}
                isDisabled={!resolvedUserId}
              >
                Create key
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button
                variant="secondary"
                onClick={() => setIsBulkOpen(true)}
                isDisabled={!resolvedUserId}
              >
                Bulk revoke
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button
                variant="tertiary"
                onClick={loadKeys}
                isDisabled={!resolvedUserId}
              >
                Refresh
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <ApiKeyTable
          keys={keys}
          isLoading={isLoading}
          onRevoke={(apiKey) => setRevokeKey(apiKey)}
          onStats={handleStats}
        />
      </PageSection>
      <CreateKeyForUserDialog
        isOpen={isCreateOpen}
        defaultUserId={resolvedUserId}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadKeys}
      />
      <BulkRevokeDialog
        isOpen={isBulkOpen}
        defaultUserId={resolvedUserId}
        onClose={() => setIsBulkOpen(false)}
        onRevoked={loadKeys}
      />
      <ApiKeyStatsModal
        isOpen={!!statsKey}
        onClose={() => {
          setStatsKey(null);
          setStats(null);
        }}
        stats={stats}
        isLoading={isStatsLoading}
        keyName={statsKey?.name}
      />
      <RevokeConfirmDialog
        isOpen={!!revokeKey}
        keyName={revokeKey?.name}
        onConfirm={handleRevoke}
        onClose={() => setRevokeKey(null)}
        isLoading={isRevokeLoading}
      />
    </>
  );
};
