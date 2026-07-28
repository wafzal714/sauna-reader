@description('Base name used to derive resource names.')
@minLength(3)
@maxLength(20)
param appName string = 'sauna-reader'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('App Service Plan SKU.')
@allowed([
  'B1'
  'B2'
  'S1'
  'P0v3'
  'P1v3'
])
param skuName string = 'B1'

@description('Node.js runtime version for the Linux web app.')
param nodeVersion string = '20-lts'

var uniqueSuffix = uniqueString(resourceGroup().id)
var webAppName = toLower('${appName}-${uniqueSuffix}')
var planName = '${appName}-plan'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: skuName
  }
  kind: 'linux'
  properties: {
    reserved: true // required for Linux
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appCommandLine: 'npm start'
      appSettings: [
        {
          // Tell Oryx to run `npm install` during deployment.
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          // App Service injects PORT automatically; server.js already reads it.
          name: 'WEBSITES_PORT'
          value: '3000'
        }
      ]
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
