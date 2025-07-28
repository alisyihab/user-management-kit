import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private _rolePermission: any;
  public get rolePermission(): any {
    return this._rolePermission;
  }

  public set rolePermission(value: any) {
    this._rolePermission = value;
  }

  private _role: any;
  public get role(): any {
    return this._role;
  }

  public set role(value: any) {
    this._role = value;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
