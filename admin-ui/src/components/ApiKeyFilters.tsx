import {
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput
} from "@patternfly/react-core";
import type { ApiKeyFiltersState } from "../types";

type ApiKeyFiltersProps = {
  filters: ApiKeyFiltersState;
  onChange: (filters: ApiKeyFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
};

export const ApiKeyFilters = ({
  filters,
  onChange,
  onApply,
  onReset
}: ApiKeyFiltersProps) => (
  <Form isHorizontal>
    <FormGroup label="User ID" fieldId="api-keys-filter-user">
      <TextInput
        id="api-keys-filter-user"
        value={filters.userId}
        onChange={(_event, value) => onChange({ ...filters, userId: value })}
      />
    </FormGroup>
    <FormGroup label="Client ID" fieldId="api-keys-filter-client">
      <TextInput
        id="api-keys-filter-client"
        value={filters.clientId}
        onChange={(_event, value) =>
          onChange({ ...filters, clientId: value })
        }
      />
    </FormGroup>
    <FormGroup label="Status" fieldId="api-keys-filter-status">
      <FormSelect
        id="api-keys-filter-status"
        value={filters.status}
        onChange={(_event, value) =>
          onChange({ ...filters, status: value as ApiKeyFiltersState["status"] })
        }
      >
        <FormSelectOption value="" label="All" />
        <FormSelectOption value="active" label="Active" />
        <FormSelectOption value="revoked" label="Revoked" />
        <FormSelectOption value="expired" label="Expired" />
      </FormSelect>
    </FormGroup>
    <FormGroup fieldId="api-keys-filter-actions">
      <Button variant="primary" onClick={onApply}>
        Apply
      </Button>
      <Button variant="link" onClick={onReset}>
        Reset
      </Button>
    </FormGroup>
  </Form>
);
