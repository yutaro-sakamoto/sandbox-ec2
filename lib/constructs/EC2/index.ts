import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { StackProps } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { NagSuppressions } from "cdk-nag";
import * as cdk from "aws-cdk-lib";

/**
 * ECSのプロパティ
 */
export interface EC2Props extends StackProps {
  /**
   * ECSクラスタを作成するVPC
   */
  vpc: ec2.Vpc;
}

/**
 * VPCとVPCエンドポイントに関するリソースを定義する
 */
export class EC2 extends Construct {
  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id);
    // IAM Role for EC2 instance to allow SSM access
    const role = new iam.Role(this, "SSMRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
      ],
    });

    // Security Group for EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, "EC2SecurityGroup", {
      vpc: props.vpc,
      description: "Allow SSH and SSM access",
      allowAllOutbound: true,
    });

    // Amazon Linux 2 EC2 instance
    new ec2.Instance(this, "Instance", {
      vpc: props.vpc,
      instanceType: new ec2.InstanceType("t3.micro"),
      machineImage: ec2.MachineImage.latestAmazonLinux2({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
        edition: ec2.AmazonLinuxEdition.STANDARD,
        kernel: ec2.AmazonLinux2Kernel.DEFAULT,
        storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      }),
      detailedMonitoring: true,
      role: role,
      securityGroup: securityGroup,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: true,
          }),
        },
      ],
    });
  }
  public addCdkNagSuppressions(parentStack: cdk.Stack) {
    NagSuppressions.addResourceSuppressionsByPath(
      parentStack,
      "/SandboxEc2Stack/EC2/Instance/Resource",
      [
        {
          id: "AwsSolutions-EC29",
          reason:
            "Currently this project is under development and the termination protection is not enabled.",
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      parentStack,
      "/SandboxEc2Stack/EC2/SSMRole/Resource",
      [
        {
          id: "AwsSolutions-IAM4",
          reason: "We should research his error later.",
        },
      ],
    );
  }
}
