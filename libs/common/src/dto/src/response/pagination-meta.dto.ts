import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  total: number = 0;

  @ApiProperty()
  page: number = 1;

  @ApiProperty()
  limit: number = 10;
}
