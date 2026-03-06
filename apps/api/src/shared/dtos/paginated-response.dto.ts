import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@repo/types';

export class PaginatedResponseDto<T> implements PaginatedResponse<T> {
  items: T[];

  @ApiProperty({ description: 'Total number of items across all pages', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
