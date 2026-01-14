import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for the shell (host) application
    const shellBucket = new s3.Bucket(this, 'ShellBucket', {
      bucketName: `mfe-shell-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // S3 bucket for MFE1 microfrontend
    const mfe1Bucket = new s3.Bucket(this, 'Mfe1Bucket', {
      bucketName: `mfe-mfe1-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          exposedHeaders: [],
        },
      ],
    });

    // S3 bucket for MFE2 microfrontend
    const mfe2Bucket = new s3.Bucket(this, 'Mfe2Bucket', {
      bucketName: `mfe-mfe2-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          exposedHeaders: [],
        },
      ],
    });

    // Origin Access Control for CloudFront to access S3
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // S3 origins using OAC
    const shellOrigin = origins.S3BucketOrigin.withOriginAccessControl(shellBucket, {
      originAccessControl: oac,
    });

    const mfe1Origin = origins.S3BucketOrigin.withOriginAccessControl(mfe1Bucket, {
      originAccessControl: oac,
    });

    const mfe2Origin = origins.S3BucketOrigin.withOriginAccessControl(mfe2Bucket, {
      originAccessControl: oac,
    });

    // CloudFront distribution with multiple origins
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: shellOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      additionalBehaviors: {
        '/mfe1/*': {
          origin: mfe1Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        '/mfe2/*': {
          origin: mfe2Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
      },
    });

    // Deploy shell app to S3
    new s3deploy.BucketDeployment(this, 'DeployShell', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../apps/shell/dist'))],
      destinationBucket: shellBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Deploy mfe1 app to S3 with /mfe1 prefix
    new s3deploy.BucketDeployment(this, 'DeployMfe1', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../apps/mfe1/dist'))],
      destinationBucket: mfe1Bucket,
      destinationKeyPrefix: 'mfe1',
      distribution,
      distributionPaths: ['/mfe1/*'],
    });

    // Deploy mfe2 app to S3 with /mfe2 prefix
    new s3deploy.BucketDeployment(this, 'DeployMfe2', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../apps/mfe2/dist'))],
      destinationBucket: mfe2Bucket,
      destinationKeyPrefix: 'mfe2',
      distribution,
      distributionPaths: ['/mfe2/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'ShellBucketName', {
      value: shellBucket.bucketName,
      description: 'Shell S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'Mfe1BucketName', {
      value: mfe1Bucket.bucketName,
      description: 'MFE1 S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'Mfe2BucketName', {
      value: mfe2Bucket.bucketName,
      description: 'MFE2 S3 Bucket Name',
    });
  }
}
