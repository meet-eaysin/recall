import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  Matches,
  Min,
  Max,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@repo/types';

export class SmartAddDocumentDto {
  @ApiPropertyOptional({
    description: 'The source URL of the document (if adding via URL)',
    example: 'https://example.com/article',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    description: 'Optional initial title of the document. If missing, it will be auto-generated.',
    example: 'Annual Report',
  })
  @IsString()
  @IsOptional()
  title?: string;
  
  @ApiPropertyOptional({
    description: 'Optional initial description/summary of the document. If missing, it will be auto-generated.',
    example: 'This report covers the Q4 financial results...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of folder IDs the document belongs to',
    example: ['65f1a2b3c4d5e6f7a8b9c0d1'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Invalid folder ID format',
  })
  @IsOptional()
  folderIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of tag IDs for the document',
    example: ['65f1a2b3c4d5e6f7a8b9c0d2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes or summary provided by the user',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    enum: DocumentStatus,
    description: 'Update document processing status',
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({
    description: 'Update document title',
    example: 'Updated Report',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Move document to a different folder ID',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid folder ID format' })
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Update tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Update document metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ListDocumentsDto {
  @ApiPropertyOptional({
    enum: DocumentStatus,
    description: 'Filter by status',
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: DocumentType, description: 'Filter by type' })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({ description: 'Filter by folders', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Invalid folder ID format',
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  folderIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Filter to unassigned documents only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unassigned?: boolean;

  @ApiPropertyOptional({ description: 'Search term for title or content' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

