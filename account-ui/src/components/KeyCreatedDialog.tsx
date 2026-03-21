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

import {
  Alert,
  Button,
  ClipboardCopy,
  Modal,
  ModalVariant
} from "@patternfly/react-core";

type KeyCreatedDialogProps = {
  apiKey: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export const KeyCreatedDialog = ({
  apiKey,
  isOpen,
  onClose
}: KeyCreatedDialogProps) => (
  <Modal
    title="API key created"
    variant={ModalVariant.medium}
    isOpen={isOpen}
    onClose={onClose}
    actions={[
      <Button key="close" variant="primary" onClick={onClose}>
        Done
      </Button>
    ]}
  >
    <Alert isInline variant="warning" title="Copy this key now">
      For security reasons you will not be able to see it again.
    </Alert>
    <ClipboardCopy isReadOnly isCode variant="expansion">
      {apiKey ?? ""}
    </ClipboardCopy>
  </Modal>
);
