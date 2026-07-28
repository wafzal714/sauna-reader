# 🧖 Sauna Reader

Paste a link to a blog post or article and get a clean, printable document you can read in the sauna — no phone required.

## How it works

1. Open the app in your browser.
2. Paste the URL of any blog post or web article.
3. Click **Get Article** — the app fetches the page and strips away ads, navigation, and clutter using [Mozilla Readability](https://github.com/mozilla/readability).
4. Click **🖨 Print** (or `Ctrl+P` / `Cmd+P`) to print the clean article and take it to the sauna.

## Running locally

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

The `PORT` environment variable can be used to run on a different port:

```bash
PORT=8080 npm start
```

## Tech stack

- **[Express](https://expressjs.com/)** — HTTP server
- **[@mozilla/readability](https://github.com/mozilla/readability)** — article content extraction
- **[jsdom](https://github.com/jsdom/jsdom)** — server-side DOM parsing
- **[node-fetch](https://github.com/node-fetch/node-fetch)** — fetching remote URLs

## Deploying to Azure

The `infra/` directory contains a [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview) template that provisions an **Azure App Service (Linux, Node 20)** to host the app.

### Manual deployment

```bash
# 1. Create a resource group (one-time setup)
az group create --name sauna-reader-rg --location eastus

# 2. Deploy the infrastructure
az deployment group create \
  --resource-group sauna-reader-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam.json

# The deployment outputs `webAppName` and `webAppUrl`.
# Copy the webAppName value for the next step.

# 3. Deploy the application code
az webapp deploy \
  --resource-group sauna-reader-rg \
  --name <webAppName> \
  --src-path . \
  --type zip
```

### CI/CD via GitHub Actions

The workflow at `.github/workflows/deploy-azure.yml` automatically tests, provisions, and deploys the app on every push to `main`.

#### Required GitHub secrets

| Secret | Description |
|---|---|
| `AZURE_CLIENT_ID` | Service principal / managed identity client ID |
| `AZURE_TENANT_ID` | Azure Active Directory tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_RG` | Name of the pre-created Azure resource group |

#### Optional GitHub variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `sauna-reader` | Base name for Azure resources |
| `SKU_NAME` | `B1` | App Service Plan SKU (`B1`, `B2`, `S1`, `P0v3`, `P1v3`) |

#### Setting up OIDC authentication (recommended)

Follow the [Azure OIDC federation guide](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect) to create a service principal with a federated credential for this repository. Then add the four secrets above to your repository's **Settings → Secrets and variables → Actions**.