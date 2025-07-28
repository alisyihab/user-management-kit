import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[] = [];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto = new PaginationMetaDto();
}
