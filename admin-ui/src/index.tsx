import "@patternfly/react-core/dist/styles/base.css";
import { ApiKeysSection } from "./ApiKeysSection";
import { UserApiKeysTab } from "./UserApiKeysTab";

const registerRoutes = () => {
  const windowAny = window as {
    kcAdminUi?: {
      register?: (config: unknown) => void;
      registerUserTab?: (config: unknown) => void;
    };
  };

  if (windowAny.kcAdminUi?.register) {
    windowAny.kcAdminUi.register({
      id: "api-keys",
      path: "/api-keys",
      label: "API Keys",
      section: "manage",
      element: <ApiKeysSection />
    });
  }

  if (windowAny.kcAdminUi?.registerUserTab) {
    windowAny.kcAdminUi.registerUserTab({
      id: "user-api-keys",
      path: "api-keys",
      label: "API Keys",
      element: <UserApiKeysTab />
    });
  }
};

registerRoutes();

export { ApiKeysSection, UserApiKeysTab };
export default ApiKeysSection;
