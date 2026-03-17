import type { ReactNode } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm
} from "@patternfly/react-core";
import type { ApiKey } from "../types";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

type ApiKeyCardProps = {
  apiKey: ApiKey;
  actions?: ReactNode;
};

export const ApiKeyCard = ({ apiKey, actions }: ApiKeyCardProps) => (
  <Card isCompact isFullHeight>
    <CardTitle>{apiKey.name}</CardTitle>
    <CardBody>
      <DescriptionList isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Client</DescriptionListTerm>
          <DescriptionListDescription>{apiKey.clientId}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Expires</DescriptionListTerm>
          <DescriptionListDescription>
            {formatDate(apiKey.expiresAt ?? null)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Last used</DescriptionListTerm>
          <DescriptionListDescription>
            {formatDate(apiKey.lastUsedAt ?? null)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Usage count</DescriptionListTerm>
          <DescriptionListDescription>
            {apiKey.usageCount ?? "-"}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      {actions}
    </CardBody>
  </Card>
);
