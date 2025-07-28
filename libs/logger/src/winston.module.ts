import { Global, Module } from "@nestjs/common";
import { WinstonModule as NestWinstonModule } from "nest-winston";
import { winstonTransports } from "./winston.config";

@Global()
@Module({
  imports: [NestWinstonModule.forRoot({
    transports: winstonTransports
  })],
  exports: [NestWinstonModule],
})
export class WinstonModule {}
