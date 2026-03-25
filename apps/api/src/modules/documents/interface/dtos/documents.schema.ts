import {
  IsEnum,
  IsString,
  IsNotEmpty,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@repo/types';

export class CreateDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'The type of the document',
    example: DocumentType.PDF,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type!: DocumentType;

  @ApiProperty({
    description: 'The source URL or storage path of the document',
    example: 'uploads/test.pdf',
  })
  @IsString()
  @IsNotEmpty()
  source!: string;

  @ApiPropertyOptional({
    description: 'Optional title of the document',
    example: 'Annual Report',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    enum: DocumentStatus,
    description: 'Initial status of the document',
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

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
    description: 'Additional metadata for the document',
    example: { project: 'X' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
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

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Title of the uploaded file' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Folder IDs to place the file in',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Invalid folder ID format',
  })
  folderIds?: string[];

  @ApiPropertyOptional({
    description: 'Tag IDs to associate with the file',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata as JSON string' })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  })
  @IsObject()
  metadata?: Record<string, unknown>;
}
