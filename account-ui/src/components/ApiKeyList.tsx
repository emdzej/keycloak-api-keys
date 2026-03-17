import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from "@patternfly/react-table";
import type { ApiKey } from "../types";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

type ApiKeyListProps = {
  apiKeys: ApiKey[];
  onRevoke: (apiKey: ApiKey) => void;
};

export const ApiKeyList = ({ apiKeys, onRevoke }: ApiKeyListProps) => {
  if (apiKeys.length === 0) {
    return (
      <EmptyState>
        <EmptyStateHeader titleText="No API keys yet" headingLevel="h2" />
        <EmptyStateBody>
          Create an API key to access your applications.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="API keys">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Client</Th>
          <Th>Expires</Th>
          <Th>Last used</Th>
          <Th>Usage count</Th>
          <Th screenReaderText="Actions" />
        </Tr>
      </Thead>
      <Tbody>
        {apiKeys.map((apiKey) => (
          <Tr key={apiKey.id}>
            <Td dataLabel="Name">{apiKey.name}</Td>
            <Td dataLabel="Client">{apiKey.clientId}</Td>
            <Td dataLabel="Expires">{formatDate(apiKey.expiresAt ?? null)}</Td>
            <Td dataLabel="Last used">
              {formatDate(apiKey.lastUsedAt ?? null)}
            </Td>
            <Td dataLabel="Usage count">{apiKey.usageCount ?? "-"}</Td>
            <Td dataLabel="Actions" isActionCell>
              <Button
                variant="link"
                isInline
                onClick={() => onRevoke(apiKey)}
              >
                Revoke
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
