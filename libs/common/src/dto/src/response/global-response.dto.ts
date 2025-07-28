import { ApiProperty } from "@nestjs/swagger";

export class GlobalResponse<T> {
  @ApiProperty()
  statusCode?: number;

  @ApiProperty()
  message?: string;

  @ApiProperty({ required: false, nullable: true })
  data?: T;

  @ApiProperty({ required: false, nullable: true })
  meta?: any;

  constructor(partial: Partial<GlobalResponse<T>>) {
    Object.assign(this, partial);
  }
}
