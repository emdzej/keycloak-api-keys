import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  Spinner
} from "@patternfly/react-core";
import type { ApiKeyStats } from "../types";

type ApiKeyStatsProps = {
  isOpen: boolean;
  onClose: () => void;
  stats?: ApiKeyStats | null;
  isLoading?: boolean;
  keyName?: string;
};

export const ApiKeyStatsModal = ({
  isOpen,
  onClose,
  stats,
  isLoading = false,
  keyName
}: ApiKeyStatsProps) => (
  <Modal
    title={keyName ? `Usage statistics for ${keyName}` : "Usage statistics"}
    isOpen={isOpen}
    onClose={onClose}
    variant="small"
  >
    {isLoading && <Spinner />}
    {!isLoading && stats && (
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Usage count</DescriptionListTerm>
          <DescriptionListDescription>
            {stats.usageCount}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Last used</DescriptionListTerm>
          <DescriptionListDescription>
            {stats.lastUsedAt ?? "Never"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Last IP</DescriptionListTerm>
          <DescriptionListDescription>
            {stats.lastUsedIp ?? "-"}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    )}
  </Modal>
);
