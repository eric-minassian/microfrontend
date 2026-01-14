# Gradual Deployment Strategies

This document outlines strategies for implementing gradual (canary) deployments for both the shell application and individual microfrontends (MFEs) in our platform.

## Overview

Gradual deployments allow us to:
- Roll out changes incrementally to a subset of users
- Monitor error rates and performance metrics during rollout
- Automatically or manually rollback if issues are detected
- Reduce blast radius of potential bugs

## Current Architecture

Our platform uses:
- **CloudFront** as the CDN and entry point
- **S3 buckets** for hosting static assets (one per MFE)
- **Module Federation** for runtime module loading
- **Path-based routing** (`/mfe1/*`, `/mfe2/*`, etc.)

This architecture naturally supports independent MFE deployments, which we can leverage for gradual rollouts.

---

## Strategy 1: CloudFront Continuous Deployment (Recommended for Shell)

AWS CloudFront natively supports staged rollouts through Continuous Deployment Policies.

### How It Works

1. Create a staging distribution that mirrors production
2. Configure a continuous deployment policy with traffic weighting
3. Gradually shift traffic from production to staging
4. Promote staging to production when confident

### CDK Implementation

```typescript
import { Distribution, CfnContinuousDeploymentPolicy } from 'aws-cdk-lib/aws-cloudfront';

// Staging distribution (same config as production, different S3 source)
const stagingDistribution = new Distribution(this, 'StagingDistribution', {
  defaultBehavior: {
    origin: new S3Origin(stagingBucket),
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
});

// Continuous deployment policy for gradual traffic shifting
const policy = new CfnContinuousDeploymentPolicy(this, 'GradualRollout', {
  continuousDeploymentPolicyConfig: {
    enabled: true,
    stagingDistributionDnsNames: [stagingDistribution.distributionDomainName],
    trafficConfig: {
      type: 'SingleWeight',
      singleWeightConfig: {
        weight: 0.05, // Start with 5% of traffic
      },
    },
  },
});
```

### Traffic Ramping Schedule

| Stage | Traffic % | Duration | Action if Alarm |
|-------|-----------|----------|-----------------|
| 1 | 5% | 15 min | Rollback |
| 2 | 25% | 30 min | Rollback |
| 3 | 50% | 30 min | Rollback |
| 4 | 100% | - | Full promotion |

---

## Strategy 2: Lambda@Edge for MFE Version Routing

Use Lambda@Edge to route requests to different MFE versions based on cookies, headers, or weighted random selection.

### How It Works

1. Deploy new MFE version to a versioned path (e.g., `/mfe1-v2/`)
2. Lambda@Edge intercepts requests and routes based on criteria
3. Gradually increase percentage routed to new version
4. Remove old version after full rollout

### Lambda@Edge Function

```typescript
// Origin request handler
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Check for explicit canary opt-in via cookie
  const cookies = headers.cookie || [];
  const isCanaryUser = cookies.some(c => c.value.includes('canary=true'));

  // Weighted random selection for gradual rollout
  const rolloutPercent = 10; // Configure via environment or fetch from S3
  const selectedForCanary = Math.random() * 100 < rolloutPercent;

  const useNewVersion = isCanaryUser || selectedForCanary;

  // Route MFE requests to appropriate version
  if (useNewVersion && request.uri.startsWith('/mfe1/')) {
    request.uri = request.uri.replace('/mfe1/', '/mfe1-v2/');

    // Set cookie to maintain session consistency
    request.headers['set-cookie'] = [{
      key: 'Set-Cookie',
      value: 'mfe1-version=v2; Path=/; Max-Age=3600'
    }];
  }

  return request;
};
```

### CDK Setup

```typescript
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const versionRouter = new cloudfront.experimental.EdgeFunction(this, 'MfeVersionRouter', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda/version-router'),
});

// Attach to CloudFront behavior
const distribution = new Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new S3Origin(shellBucket),
    edgeLambdas: [{
      functionVersion: versionRouter.currentVersion,
      eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
    }],
  },
});
```

---

## Strategy 3: Versioned MFE Manifests (Simplest Approach)

Store multiple versions in S3 and let the shell dynamically resolve which version to load.

### S3 Structure

```
s3://mfe-mfe1-bucket/
├── v1.0.0/
│   ├── mf-manifest.json
│   ├── remoteEntry.js
│   └── assets/
├── v1.1.0/
│   ├── mf-manifest.json
│   ├── remoteEntry.js
│   └── assets/
├── active-version.json      # Version configuration
└── version-history.json     # Deployment history for rollbacks
```

### Version Configuration Schema

```json
{
  "version": "v1.0.0",
  "canaryVersion": "v1.1.0",
  "canaryPercent": 10,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "metadata": {
    "commitSha": "abc123",
    "deployedBy": "ci-pipeline"
  }
}
```

### Shell-Side Version Resolution

```typescript
// apps/shell/src/mfe-version-resolver.ts

interface VersionConfig {
  version: string;
  canaryVersion: string | null;
  canaryPercent: number;
}

const versionCache = new Map<string, VersionConfig>();

export async function getMfeManifestUrl(mfeName: string): Promise<string> {
  // Fetch version config (with caching)
  let config = versionCache.get(mfeName);
  if (!config) {
    const response = await fetch(`/${mfeName}/active-version.json`);
    config = await response.json();
    versionCache.set(mfeName, config);
  }

  // Determine if user should get canary version
  const isCanaryUser = shouldUseCanary(mfeName, config);
  const version = isCanaryUser && config.canaryVersion
    ? config.canaryVersion
    : config.version;

  return `/${mfeName}/${version}/mf-manifest.json`;
}

function shouldUseCanary(mfeName: string, config: VersionConfig): boolean {
  // Check for explicit opt-in
  if (document.cookie.includes('canary=true')) {
    return true;
  }

  // Check for stored assignment (session consistency)
  const stored = sessionStorage.getItem(`canary-${mfeName}`);
  if (stored !== null) {
    return stored === 'true';
  }

  // Random assignment based on percentage
  const isCanary = Math.random() * 100 < config.canaryPercent;
  sessionStorage.setItem(`canary-${mfeName}`, String(isCanary));

  return isCanary;
}
```

### Updating Module Federation Config

```typescript
// apps/shell/vite.config.ts
import { getMfeManifestUrl } from './src/mfe-version-resolver';

export default defineConfig(async () => {
  // Dynamically resolve MFE versions at build time (for SSR)
  // Or use runtime resolution in the browser

  return {
    plugins: [
      federation({
        name: 'shell',
        remotes: {
          mfe1: {
            type: 'module',
            name: 'mfe1',
            // Runtime resolution - manifest URL determined at load time
            entry: async () => getMfeManifestUrl('mfe1'),
          },
        },
      }),
    ],
  };
});
```

---

## Strategy 4: Feature Flags with AWS AppConfig

For fine-grained control over deployments and feature releases.

### AppConfig Structure

```json
{
  "deployments": {
    "mfe1": {
      "activeVersion": "v1.2.0",
      "canaryVersion": "v1.3.0",
      "canaryPercent": 5,
      "enabledRegions": ["us-east-1", "us-west-2"]
    },
    "mfe2": {
      "activeVersion": "v2.0.0",
      "canaryVersion": null,
      "canaryPercent": 0
    },
    "shell": {
      "activeVersion": "v3.1.0"
    }
  },
  "featureFlags": {
    "newCheckoutFlow": {
      "enabled": true,
      "percentage": 25,
      "allowList": ["user-123", "user-456"]
    }
  }
}
```

### Client-Side Integration

```typescript
// packages/platform/src/feature-flags.ts
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand
} from '@aws-sdk/client-appconfigdata';

class FeatureFlagService {
  private client: AppConfigDataClient;
  private token: string | null = null;
  private config: any = null;

  constructor() {
    this.client = new AppConfigDataClient({ region: 'us-east-1' });
  }

  async initialize() {
    const session = await this.client.send(new StartConfigurationSessionCommand({
      ApplicationIdentifier: 'mfe-platform',
      EnvironmentIdentifier: 'production',
      ConfigurationProfileIdentifier: 'deployment-config',
    }));
    this.token = session.InitialConfigurationToken!;
    await this.refresh();
  }

  async refresh() {
    const response = await this.client.send(new GetLatestConfigurationCommand({
      ConfigurationToken: this.token!,
    }));
    this.token = response.NextPollConfigurationToken!;

    if (response.Configuration) {
      this.config = JSON.parse(new TextDecoder().decode(response.Configuration));
    }
  }

  getMfeVersion(mfeName: string): string {
    const deployment = this.config.deployments[mfeName];
    if (!deployment) return 'latest';

    if (deployment.canaryVersion && this.isInCanary(deployment.canaryPercent)) {
      return deployment.canaryVersion;
    }
    return deployment.activeVersion;
  }

  private isInCanary(percent: number): boolean {
    return Math.random() * 100 < percent;
  }
}

export const featureFlags = new FeatureFlagService();
```

---

## Monitoring and Alarms

### CloudWatch Alarms

```typescript
// infra/lib/monitoring.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';

// SNS topic for alerts
const alertTopic = new sns.Topic(this, 'DeploymentAlerts', {
  topicName: 'mfe-deployment-alerts',
});

// Error rate alarm per MFE
const createMfeAlarms = (mfeName: string) => {
  // JavaScript error rate (from RUM or custom metrics)
  new cloudwatch.Alarm(this, `${mfeName}ErrorRate`, {
    alarmName: `${mfeName}-error-rate`,
    metric: new cloudwatch.Metric({
      namespace: 'MFE/ClientErrors',
      metricName: 'ErrorCount',
      dimensionsMap: { MFE: mfeName },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 10,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarmDescription: `Error rate exceeded for ${mfeName}`,
    actionsEnabled: true,
  }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

  // Load time degradation
  new cloudwatch.Alarm(this, `${mfeName}LoadTime`, {
    alarmName: `${mfeName}-load-time`,
    metric: new cloudwatch.Metric({
      namespace: 'MFE/Performance',
      metricName: 'LoadTime',
      dimensionsMap: { MFE: mfeName },
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: 3000, // 3 seconds
    evaluationPeriods: 3,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
};

// CloudFront distribution alarms
new cloudwatch.Alarm(this, 'CloudFront5xxRate', {
  alarmName: 'cloudfront-5xx-rate',
  metric: distribution.metricOrigin5xxErrorRate({
    period: Duration.minutes(1),
  }),
  threshold: 5, // 5% error rate
  evaluationPeriods: 3,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
}).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

new cloudwatch.Alarm(this, 'CloudFront4xxRate', {
  alarmName: 'cloudfront-4xx-rate',
  metric: distribution.metric4xxErrorRate({
    period: Duration.minutes(1),
  }),
  threshold: 10, // 10% error rate
  evaluationPeriods: 3,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
}).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
```

### Client-Side Error Reporting

```typescript
// packages/platform/src/monitoring.ts
export function reportError(mfeName: string, error: Error, context?: Record<string, any>) {
  // Send to CloudWatch via API Gateway or direct put
  const metric = {
    Namespace: 'MFE/ClientErrors',
    MetricData: [{
      MetricName: 'ErrorCount',
      Dimensions: [
        { Name: 'MFE', Value: mfeName },
        { Name: 'ErrorType', Value: error.name },
      ],
      Value: 1,
      Unit: 'Count',
    }],
  };

  // Fire and forget
  navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
}

// Integration with MFE error boundary
export function createMfeErrorBoundary(mfeName: string) {
  return class MfeErrorBoundary extends React.Component {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      reportError(mfeName, error, { componentStack: errorInfo.componentStack });
    }
    // ...
  };
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/gradual-deploy.yml
name: Gradual Deployment

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      mfe:
        description: 'MFE to deploy (mfe1, mfe2, shell, or all)'
        required: true
        default: 'all'
      skip_canary:
        description: 'Skip canary and deploy to 100%'
        type: boolean
        default: false

env:
  AWS_REGION: us-east-1

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      shell: ${{ steps.changes.outputs.shell }}
      mfe1: ${{ steps.changes.outputs.mfe1 }}
      mfe2: ${{ steps.changes.outputs.mfe2 }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            shell:
              - 'apps/shell/**'
            mfe1:
              - 'apps/mfe1/**'
            mfe2:
              - 'apps/mfe2/**'

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build all
        run: pnpm build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: |
            apps/*/dist
            packages/*/dist

  deploy-canary:
    needs: [detect-changes, build]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - mfe: mfe1
            bucket: mfe-mfe1-bucket
          - mfe: mfe2
            bucket: mfe-mfe2-bucket
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy new version
        run: |
          VERSION="v${{ github.sha }}"
          aws s3 sync apps/${{ matrix.mfe }}/dist s3://${{ matrix.bucket }}/${VERSION}/

      - name: Set canary (5%)
        if: ${{ !inputs.skip_canary }}
        run: |
          VERSION="v${{ github.sha }}"
          CURRENT=$(aws s3 cp s3://${{ matrix.bucket }}/active-version.json - | jq -r '.version')

          echo "{
            \"version\": \"${CURRENT}\",
            \"canaryVersion\": \"${VERSION}\",
            \"canaryPercent\": 5,
            \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"metadata\": {
              \"commitSha\": \"${{ github.sha }}\",
              \"deployedBy\": \"github-actions\"
            }
          }" | aws s3 cp - s3://${{ matrix.bucket }}/active-version.json

  monitor-canary:
    needs: deploy-canary
    runs-on: ubuntu-latest
    if: ${{ !inputs.skip_canary }}
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Monitor for 15 minutes
        run: |
          echo "Monitoring canary deployment for 15 minutes..."
          for i in {1..15}; do
            echo "Check $i/15..."

            ALARMS=$(aws cloudwatch describe-alarms \
              --alarm-name-prefix "mfe" \
              --state-value ALARM \
              --query 'MetricAlarms[].AlarmName' \
              --output text)

            if [ -n "$ALARMS" ]; then
              echo "::error::Alarms triggered: $ALARMS"
              echo "ROLLBACK_NEEDED=true" >> $GITHUB_ENV
              exit 1
            fi

            sleep 60
          done
          echo "Canary monitoring passed!"

  rollback:
    needs: monitor-canary
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Rollback canary
        run: |
          for BUCKET in mfe-mfe1-bucket mfe-mfe2-bucket; do
            CURRENT=$(aws s3 cp s3://${BUCKET}/active-version.json - | jq -r '.version')

            echo "{
              \"version\": \"${CURRENT}\",
              \"canaryVersion\": null,
              \"canaryPercent\": 0,
              \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
              \"metadata\": {
                \"rollbackReason\": \"Alarm triggered during canary\",
                \"rolledBackFrom\": \"${{ github.sha }}\"
              }
            }" | aws s3 cp - s3://${BUCKET}/active-version.json
          done

          echo "::error::Deployment rolled back due to alarm"

  promote:
    needs: monitor-canary
    runs-on: ubuntu-latest
    strategy:
      matrix:
        stage:
          - percent: 25
            duration: 30
          - percent: 50
            duration: 30
          - percent: 100
            duration: 0
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Increase to ${{ matrix.stage.percent }}%
        run: |
          VERSION="v${{ github.sha }}"

          for BUCKET in mfe-mfe1-bucket mfe-mfe2-bucket; do
            if [ "${{ matrix.stage.percent }}" == "100" ]; then
              # Full promotion - new version becomes active
              echo "{
                \"version\": \"${VERSION}\",
                \"canaryVersion\": null,
                \"canaryPercent\": 0,
                \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
              }" | aws s3 cp - s3://${BUCKET}/active-version.json
            else
              # Increase canary percentage
              CURRENT=$(aws s3 cp s3://${BUCKET}/active-version.json - | jq -r '.version')
              echo "{
                \"version\": \"${CURRENT}\",
                \"canaryVersion\": \"${VERSION}\",
                \"canaryPercent\": ${{ matrix.stage.percent }},
                \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
              }" | aws s3 cp - s3://${BUCKET}/active-version.json
            fi
          done

      - name: Monitor for ${{ matrix.stage.duration }} minutes
        if: ${{ matrix.stage.duration > 0 }}
        run: |
          for i in $(seq 1 ${{ matrix.stage.duration }}); do
            ALARMS=$(aws cloudwatch describe-alarms \
              --alarm-name-prefix "mfe" \
              --state-value ALARM \
              --query 'MetricAlarms[].AlarmName' \
              --output text)

            if [ -n "$ALARMS" ]; then
              echo "::error::Alarms triggered at ${{ matrix.stage.percent }}%: $ALARMS"
              exit 1
            fi
            sleep 60
          done
```

---

## Rollback Procedures

### Automatic Rollback (via CI/CD)

The CI/CD pipeline automatically rolls back when CloudWatch alarms trigger during the monitoring phase.

### Manual Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

MFE_NAME=$1
BUCKET="mfe-${MFE_NAME}-bucket"

if [ -z "$MFE_NAME" ]; then
  echo "Usage: ./rollback.sh <mfe-name>"
  exit 1
fi

# Get version history
HISTORY=$(aws s3 cp s3://${BUCKET}/version-history.json -)
PREVIOUS_VERSION=$(echo $HISTORY | jq -r '.[-2]')

if [ "$PREVIOUS_VERSION" == "null" ]; then
  echo "No previous version found to rollback to"
  exit 1
fi

echo "Rolling back ${MFE_NAME} to ${PREVIOUS_VERSION}..."

# Update active version
echo "{
  \"version\": \"${PREVIOUS_VERSION}\",
  \"canaryVersion\": null,
  \"canaryPercent\": 0,
  \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"metadata\": {
    \"rollbackReason\": \"Manual rollback\",
    \"rolledBackBy\": \"$(whoami)\"
  }
}" | aws s3 cp - s3://${BUCKET}/active-version.json

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='MFE Platform'].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/${MFE_NAME}/*"

echo "Rollback complete!"
```

### Instant Rollback (Version Switch)

Since we use versioned paths, rollback is instant - just update the `active-version.json` file. No need to redeploy code.

---

## Recommendations by Component

| Component | Recommended Strategy | Rollback Time | Complexity |
|-----------|---------------------|---------------|------------|
| **Shell** | CloudFront Continuous Deployment | ~5 minutes | Medium |
| **MFEs** | Versioned Manifests + Shell Resolution | Instant | Low |
| **Feature Flags** | AWS AppConfig | Instant | Medium |
| **Full Platform** | Lambda@Edge Routing | Instant | High |

## Getting Started

1. **Start Simple**: Implement versioned manifests (Strategy 3) first
2. **Add Monitoring**: Set up CloudWatch alarms before enabling canary
3. **Automate**: Add CI/CD pipeline for consistent deployments
4. **Iterate**: Add Lambda@Edge or AppConfig as needs grow

## Related Documents

- [MFE Architecture Overview](./architecture.md)
- [CI/CD Pipeline Setup](./ci-cd.md)
- [Monitoring and Observability](./monitoring.md)
