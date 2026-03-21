/*
 * Copyright (c) 2026 Michał Jaskólski and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
