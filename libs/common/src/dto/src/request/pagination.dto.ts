import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PaginationDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Halaman saat ini (default: 1)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Jumlah item per halaman (default: 10)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "john",
    description: "Kata kunci untuk pencarian",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    description: "Field untuk sorting",
  })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({
    example: "desc",
    enum: ["asc", "desc"],
    description: "Arah urutan data",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc" = "desc";
}
