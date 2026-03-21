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

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Modal,
  TextInput
} from "@patternfly/react-core";
import type { CreateApiKeyRequest } from "../types";

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

type CreateKeyDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  clients?: string[];
  onClose: () => void;
  onCreate: (request: CreateApiKeyRequest) => void;
};

export const CreateKeyDialog = ({
  isOpen,
  isSubmitting,
  clients,
  onClose,
  onCreate
}: CreateKeyDialogProps) => {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [roles, setRoles] = useState("");
  const [scopes, setScopes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setClientId(clients?.[0] ?? "");
      setRoles("");
      setScopes("");
      setExpiresAt("");
    }
  }, [isOpen, clients]);

  const hasClientList = (clients?.length ?? 0) > 0;

  const isValid = useMemo(() => {
    return name.trim().length > 0 && clientId.trim().length > 0;
  }, [name, clientId]);

  const handleSubmit = () => {
    const payload: CreateApiKeyRequest = {
      name: name.trim(),
      clientId: clientId.trim(),
      roles: parseList(roles),
      scopes: parseList(scopes),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
    };

    if (payload.roles?.length === 0) {
      delete payload.roles;
    }
    if (payload.scopes?.length === 0) {
      delete payload.scopes;
    }
    if (!payload.expiresAt || Number.isNaN(Date.parse(payload.expiresAt))) {
      delete payload.expiresAt;
    }

    onCreate(payload);
  };

  return (
    <Modal
      title="Create API key"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="create"
          variant="primary"
          isDisabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Create
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      <Form isWidthLimited>
        <FormGroup label="Name" isRequired fieldId="api-key-name">
          <TextInput
            id="api-key-name"
            value={name}
            onChange={(_event, value) => setName(value)}
            isRequired
          />
        </FormGroup>
        <FormGroup label="Client" isRequired fieldId="api-key-client">
          {hasClientList ? (
            <FormSelect
              id="api-key-client"
              value={clientId}
              onChange={(_event, value) => setClientId(value)}
              isRequired
            >
              {clients?.map((client) => (
                <FormSelectOption
                  key={client}
                  value={client}
                  label={client}
                />
              ))}
            </FormSelect>
          ) : (
            <TextInput
              id="api-key-client"
              value={clientId}
              onChange={(_event, value) => setClientId(value)}
              isRequired
            />
          )}
        </FormGroup>
        <FormGroup label="Roles" fieldId="api-key-roles">
          <TextInput
            id="api-key-roles"
            value={roles}
            onChange={(_event, value) => setRoles(value)}
            placeholder="role-a, role-b"
          />
          <HelperText>
            <HelperTextItem>
              Optional, comma-separated list of roles.
            </HelperTextItem>
          </HelperText>
        </FormGroup>
        <FormGroup label="Scopes" fieldId="api-key-scopes">
          <TextInput
            id="api-key-scopes"
            value={scopes}
            onChange={(_event, value) => setScopes(value)}
            placeholder="read, write"
          />
          <HelperText>
            <HelperTextItem>
              Optional, comma-separated list of scopes.
            </HelperTextItem>
          </HelperText>
        </FormGroup>
        <FormGroup label="Expires at" fieldId="api-key-expires">
          <TextInput
            id="api-key-expires"
            type="datetime-local"
            value={expiresAt}
            onChange={(_event, value) => setExpiresAt(value)}
          />
          <HelperText>
            <HelperTextItem>Leave empty for no expiry.</HelperTextItem>
          </HelperText>
        </FormGroup>
      </Form>
    </Modal>
  );
};
