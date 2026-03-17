import {
  Button,
  Label,
  Spinner,
  Tooltip
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import type { AdminApiKey, ApiKeyStatus } from "../types";

type ApiKeyTableProps = {
  keys: AdminApiKey[];
  isLoading: boolean;
  onRevoke: (apiKey: AdminApiKey) => void;
  onStats: (apiKey: AdminApiKey) => void;
};

const resolveStatus = (apiKey: AdminApiKey): ApiKeyStatus => {
  if (apiKey.revokedAt) {
    return "revoked";
  }
  if (apiKey.expiresAt) {
    const expiresAt = new Date(apiKey.expiresAt).getTime();
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      return "expired";
    }
  }
  return "active";
};

const statusLabel = (status: ApiKeyStatus) => {
  switch (status) {
    case "active":
      return <Label color="green">Active</Label>;
    case "revoked":
      return <Label color="red">Revoked</Label>;
    case "expired":
      return <Label color="orange">Expired</Label>;
    default:
      return <Label>Unknown</Label>;
  }
};

export const ApiKeyTable = ({
  keys,
  isLoading,
  onRevoke,
  onStats
}: ApiKeyTableProps) => (
  <Table aria-label="API keys table" variant="compact">
    <Thead>
      <Tr>
        <Th>Name</Th>
        <Th>Prefix</Th>
        <Th>User ID</Th>
        <Th>Client ID</Th>
        <Th>Status</Th>
        <Th>Created</Th>
        <Th>Expires</Th>
        <Th>Last used</Th>
        <Th>Actions</Th>
      </Tr>
    </Thead>
    <Tbody>
      {isLoading && (
        <Tr>
          <Td colSpan={9}>
            <Spinner /> Loading API keys...
          </Td>
        </Tr>
      )}
      {!isLoading && keys.length === 0 && (
        <Tr>
          <Td colSpan={9}>No API keys found.</Td>
        </Tr>
      )}
      {!isLoading &&
        keys.map((apiKey) => {
          const status = resolveStatus(apiKey);
          return (
            <Tr key={apiKey.id}>
              <Td dataLabel="Name">{apiKey.name}</Td>
              <Td dataLabel="Prefix">{apiKey.keyPrefix ?? "-"}</Td>
              <Td dataLabel="User ID">
                <Tooltip content={apiKey.userId}>
                  <span>{apiKey.userId}</span>
                </Tooltip>
              </Td>
              <Td dataLabel="Client ID">{apiKey.clientId}</Td>
              <Td dataLabel="Status">{statusLabel(status)}</Td>
              <Td dataLabel="Created">{apiKey.createdAt ?? "-"}</Td>
              <Td dataLabel="Expires">{apiKey.expiresAt ?? "-"}</Td>
              <Td dataLabel="Last used">{apiKey.lastUsedAt ?? "-"}</Td>
              <Td dataLabel="Actions">
                <Button variant="link" onClick={() => onStats(apiKey)}>
                  Stats
                </Button>
                <Button
                  variant="link"
                  isDanger
                  onClick={() => onRevoke(apiKey)}
                >
                  Revoke
                </Button>
              </Td>
            </Tr>
          );
        })}
    </Tbody>
  </Table>
);
