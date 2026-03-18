import React, { useCallback, useEffect, useState } from "react";

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRealm = () => {
    const path = window.location.pathname;
    const match = path.match(/\/realms\/([^/]+)/);
    return match?.[1] ?? "master";
  };

  const getToken = () => {
    return window.keycloak?.token;
  };

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const realm = getRealm();
      const token = getToken();
      const response = await fetch(
        `${window.location.origin}/realms/${realm}/account/api-keys`,
        {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: "include"
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load API keys (${response.status})`);
      }
      const data = await response.json();
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const e = React.createElement;

  if (isLoading) {
    return e("div", { className: "pf-v5-l-bullseye" },
      e("div", { className: "pf-v5-c-spinner", role: "progressbar" },
        e("span", { className: "pf-v5-c-spinner__clipper" }),
        e("span", { className: "pf-v5-c-spinner__lead-ball" }),
        e("span", { className: "pf-v5-c-spinner__tail-ball" })
      )
    );
  }

  if (error) {
    return e("div", { className: "pf-v5-c-alert pf-m-danger" },
      e("div", { className: "pf-v5-c-alert__icon" }),
      e("h4", { className: "pf-v5-c-alert__title" }, error)
    );
  }

  return e("div", { className: "pf-v5-c-page__main-section" }, [
    e("h1", { key: "title", className: "pf-v5-c-title pf-m-xl" }, "API Keys"),
    e("p", { key: "desc", className: "pf-v5-u-mb-md" }, 
      `You have ${apiKeys.length} API key(s).`
    ),
    apiKeys.length === 0
      ? e("div", { key: "empty", className: "pf-v5-c-empty-state" },
          e("div", { className: "pf-v5-c-empty-state__content" },
            e("h2", { className: "pf-v5-c-title pf-m-lg" }, "No API keys yet"),
            e("p", { className: "pf-v5-c-empty-state__body" }, 
              "Create an API key to access the API programmatically."
            )
          )
        )
      : e("ul", { key: "list", className: "pf-v5-c-list" },
          apiKeys.map((key) =>
            e("li", { key: key.id },
              e("strong", null, key.name || "Unnamed key"),
              " — ",
              e("code", null, key.keyPrefix + "..."),
              key.expiresAt && ` (expires: ${new Date(key.expiresAt).toLocaleDateString()})`
            )
          )
        )
  ]);
};

export default ApiKeysPage;
