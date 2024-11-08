import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Network } from "./constructs/Network";
import { EC2 } from "./constructs/EC2";

/**
 * スタック
 */
export class SandboxEc2 extends cdk.Stack {
  private ec2: EC2;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const network = new Network(this, "Network");
    this.ec2 = new EC2(this, "EC2", { vpc: network.vpc });
  }

  /**
   * NAGのチェックを抑制する
   */
  public addCdkNagSuppressions() {
    this.ec2.addCdkNagSuppressions(this);
  }
}
