import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsInt,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@repo/types';

export enum SearchMode {
  NORMAL = 'normal',
  AI = 'ai',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search keywords or phrase',
    example: 'What is neuroplasticity?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Query is required' })
  q!: string;

  @ApiPropertyOptional({
    enum: SearchMode,
    description: 'Search execution mode',
    default: SearchMode.NORMAL,
  })
  @IsEnum(SearchMode)
  @IsOptional()
  mode?: SearchMode = SearchMode.NORMAL;

  @ApiPropertyOptional({
    enum: DocumentStatus,
    description: 'Filter by document status',
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({
    enum: DocumentType,
    description: 'Filter by document type',
  })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Filter results by folder IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Invalid folder ID format',
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  folderIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter results by tag IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tagIds?: string[];

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
    description: 'Items per page limit',
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

export class AskQueryDto {
  @ApiProperty({
    description: 'Question to ask the AI',
    example: 'Explain the core concepts of this project.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Optional subset of document IDs to context-limit the AI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Invalid document ID format',
  })
  documentIds?: string[];

  @ApiPropertyOptional({
    description: 'Continue an existing conversation',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid conversation ID format',
  })
  conversationId?: string;
}

export class SemanticSearchResultDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: DocumentType })
  type!: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status!: DocumentStatus;

  @ApiProperty()
  score!: number;

  @ApiProperty()
  preview!: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  createdAt!: Date;
}

export class SourceRefDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  author!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  originalSource!: string | null;
}

export class AskResultDto {
  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ description: 'The generated AI answer' })
  answer!: string;

  @ApiProperty({
    type: [SourceRefDto],
    description: 'List of documents cited in the answer',
  })
  sources!: SourceRefDto[];

  @ApiProperty()
  tokensUsed!: number;
}

export class ChatMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['user', 'assistant'] })
  role!: 'user' | 'assistant';

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ['completed', 'error'] })
  status!: 'completed' | 'error';

  @ApiProperty({ type: [SourceRefDto] })
  sources!: SourceRefDto[];

  @ApiProperty()
  tokensUsed!: number;

  @ApiProperty()
  createdAt!: string;
}

export class ChatConversationSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [String] })
  documentIds!: string[];

  @ApiProperty()
  messageCount!: number;

  @ApiPropertyOptional({ nullable: true })
  lastMessagePreview!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ChatConversationDto extends ChatConversationSummaryDto {
  @ApiProperty({ type: [ChatMessageDto] })
  messages!: ChatMessageDto[];
}

export class ChatConversationListDto {
  @ApiProperty({ type: [ChatConversationSummaryDto] })
  conversations!: ChatConversationSummaryDto[];
}
