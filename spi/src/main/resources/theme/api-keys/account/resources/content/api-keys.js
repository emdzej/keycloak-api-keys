// API Keys Page - vanilla JS without bundling
// Uses global React from Keycloak

const e = React.createElement;

class ApiKeysPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      apiKeys: [],
      isLoading: true,
      error: null
    };
  }

  componentDidMount() {
    this.fetchKeys();
  }

  getRealm() {
    const path = window.location.pathname;
    const match = path.match(/\/realms\/([^/]+)/);
    return match?.[1] ?? "master";
  }

  getToken() {
    return window.keycloak?.token;
  }

  async fetchKeys() {
    this.setState({ isLoading: true, error: null });
    try {
      const realm = this.getRealm();
      const token = this.getToken();
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
      this.setState({ 
        apiKeys: Array.isArray(data) ? data : [],
        isLoading: false 
      });
    } catch (err) {
      this.setState({ 
        error: err.message || "Failed to load API keys",
        isLoading: false 
      });
    }
  }

  render() {
    const { apiKeys, isLoading, error } = this.state;

    if (isLoading) {
      return e("div", { className: "pf-v5-l-bullseye" },
        e("span", { className: "pf-v5-c-spinner", role: "progressbar" })
      );
    }

    if (error) {
      return e("div", { className: "pf-v5-c-alert pf-m-danger" },
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
  }
}

export default ApiKeysPage;
