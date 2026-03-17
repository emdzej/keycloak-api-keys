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
import { listApiKeys, getApiKeyStats, revokeApiKey } from "./api/adminApiKeys";
import { ApiKeyFilters } from "./components/ApiKeyFilters";
import { ApiKeyStatsModal } from "./components/ApiKeyStats";
import { ApiKeyTable } from "./components/ApiKeyTable";
import { BulkRevokeDialog } from "./components/BulkRevokeDialog";
import { CreateKeyForUserDialog } from "./components/CreateKeyForUserDialog";
import { RevokeConfirmDialog } from "./components/RevokeConfirmDialog";
import type { AdminApiKey, ApiKeyFiltersState, ApiKeyStats } from "./types";

const defaultFilters: ApiKeyFiltersState = {
  userId: "",
  clientId: "",
  status: ""
};

export const ApiKeysSection = () => {
  const [filters, setFilters] = useState<ApiKeyFiltersState>(defaultFilters);
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

  const loadKeys = useCallback(
    async (nextFilters: ApiKeyFiltersState = filters) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listApiKeys(nextFilters);
        setKeys(response.keys);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load API keys");
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

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
        <Title headingLevel="h1">API Keys</Title>
      </PageSection>
      <PageSection>
        {error && (
          <Alert isInline variant="danger" title="Error">
            {error}
          </Alert>
        )}
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create key
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
                Bulk revoke
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="tertiary" onClick={loadKeys}>
                Refresh
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <ApiKeyFilters
          filters={filters}
          onChange={setFilters}
          onApply={loadKeys}
          onReset={() => {
            setFilters(defaultFilters);
            void loadKeys(defaultFilters);
          }}
        />
        <ApiKeyTable
          keys={keys}
          isLoading={isLoading}
          onRevoke={(apiKey) => setRevokeKey(apiKey)}
          onStats={handleStats}
        />
      </PageSection>
      <CreateKeyForUserDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadKeys}
      />
      <BulkRevokeDialog
        isOpen={isBulkOpen}
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
