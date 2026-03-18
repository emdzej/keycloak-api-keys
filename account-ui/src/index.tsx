import "@patternfly/react-core/dist/styles/base.css";
import { ApiKeysPage } from "./ApiKeysPage";

type KcInstance = {
  token?: string;
  updateToken?: (minValidity: number) => Promise<boolean>;
  login?: () => void;
};

// Walk the React fiber tree downward (child/sibling) looking for a
// Context.Provider node whose memoizedProps.value has a `keycloak` property.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findKeycloakInFiber(fiber: any): KcInstance | undefined {
  if (!fiber) return undefined;

  // Context.Provider stores its value in memoizedProps.value
  const val = fiber.memoizedProps?.value;
  if (val && typeof val === "object" && "keycloak" in val && val.keycloak) {
    return val.keycloak as KcInstance;
  }

  // Walk child first, then sibling
  return findKeycloakInFiber(fiber.child) ?? findKeycloakInFiber(fiber.sibling);
}

function getKeycloakInstance(): KcInstance | undefined {
  try {
    const appEl = document.getElementById("app");
    if (!appEl) return undefined;

    const fiberKey = Object.keys(appEl).find(
      (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")
    );
    if (!fiberKey) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootFiber = (appEl as unknown as Record<string, any>)[fiberKey];
    return findKeycloakInFiber(rootFiber);
  } catch {
    return undefined;
  }
}

async function getToken(): Promise<string> {
  const kc = getKeycloakInstance();
  if (!kc) {
    console.warn("[api-keys] Could not find Keycloak instance in React fiber tree");
    return "";
  }
  if (kc.updateToken) {
    try {
      await kc.updateToken(5);
    } catch {
      kc.login?.();
    }
  }
  return kc.token ?? "";
}

const ApiKeysPageWithToken = () => <ApiKeysPage getToken={getToken} />;

export default ApiKeysPageWithToken;
