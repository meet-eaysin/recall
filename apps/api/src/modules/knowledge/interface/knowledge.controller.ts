import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CreateFolderUseCase } from '../application/use-cases/create-folder.usecase';
import { GetFolderUseCase } from '../application/use-cases/get-folder.usecase';
import { ListFoldersUseCase } from '../application/use-cases/list-folders.usecase';
import { UpdateFolderUseCase } from '../application/use-cases/update-folder.usecase';
import { DeleteFolderUseCase } from '../application/use-cases/delete-folder.usecase';
import { ListFolderDocumentsUseCase } from '../application/use-cases/list-folder-documents.usecase';
import { CreateTagUseCase } from '../application/use-cases/create-tag.usecase';
import { ListTagsUseCase } from '../application/use-cases/list-tags.usecase';
import { UpdateTagUseCase } from '../application/use-cases/update-tag.usecase';
import { DeleteTagUseCase } from '../application/use-cases/delete-tag.usecase';
import { ListTagDocumentsUseCase } from '../application/use-cases/list-tag-documents.usecase';
import { CreateNoteUseCase } from '../application/use-cases/create-note.usecase';
import { ListNotesUseCase } from '../application/use-cases/list-notes.usecase';
import { GetNoteUseCase } from '../application/use-cases/get-note.usecase';
import { UpdateNoteUseCase } from '../application/use-cases/update-note.usecase';
import { DeleteNoteUseCase } from '../application/use-cases/delete-note.usecase';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderPaginationDto,
} from './schemas/folder.schema';
import { CreateTagDto, UpdateTagDto } from './schemas/tag.schema';
import {
  CreateNoteDto,
  UpdateNoteDto,
  ListNotesDto,
} from './schemas/note.schema';
import {
  FolderViewDto,
  FolderResponseDto,
  FoldersResponseDto,
  TagResponseDto,
  TagsResponseDto,
  NoteViewDto,
  NoteResponseDto,
  NotesResponseDto,
} from './dtos/knowledge.response.dto';
import { DocumentPublicViewDto } from '../../documents/interface/dtos/documents.response.dto';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { User } from '../../../shared/decorators/user.decorator';
import { ApiPaginatedResponse } from '../../../shared/decorators/api-paginated-response.decorator';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Knowledge Base')
@ApiBearerAuth('bearerAuth')
@Controller('knowledge')
@UseGuards(DevUserGuard)
export class KnowledgeController {
  constructor(
    private readonly listFoldersUseCase: ListFoldersUseCase,
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly getFolderUseCase: GetFolderUseCase,
    private readonly updateFolderUseCase: UpdateFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
    private readonly listFolderDocsUseCase: ListFolderDocumentsUseCase,
    private readonly listTagsUseCase: ListTagsUseCase,
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
    private readonly listTagDocsUseCase: ListTagDocumentsUseCase,
    private readonly listNotesUseCase: ListNotesUseCase,
    private readonly createNoteUseCase: CreateNoteUseCase,
    private readonly getNoteUseCase: GetNoteUseCase,
    private readonly updateNoteUseCase: UpdateNoteUseCase,
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
  ) {}

  // Folders
  @Get('folders')
  @ApiOperation({ summary: 'List all folders for the user' })
  @ApiSuccessResponse(FoldersResponseDto)
  async listFolders(@User('userId') userId: string) {
    const folders = await this.listFoldersUseCase.execute(userId);
    return { folders };
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiSuccessResponse(FolderResponseDto, 'Folder created')
  @HttpCode(HttpStatus.CREATED)
  async createFolder(
    @User('userId') userId: string,
    @Body() data: CreateFolderDto,
  ) {
    const folder = await this.createFolderUseCase.execute({
      userId,
      ...data,
    });
    return { folder };
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get folder details by ID' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiSuccessResponse(FolderViewDto)
  async getFolder(@User('userId') userId: string, @Param('id') id: string) {
    const result = await this.getFolderUseCase.execute(id, userId);
    return result;
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Update folder properties' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiSuccessResponse(FolderResponseDto)
  async updateFolder(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateFolderDto,
  ) {
    const folder = await this.updateFolderUseCase.execute({
      id,
      userId,
      data,
    });
    return { folder };
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFolder(@User('userId') userId: string, @Param('id') id: string) {
    await this.deleteFolderUseCase.execute(id, userId);
  }

  @Get('folders/:id/documents')
  @ApiOperation({ summary: 'List documents within a specific folder' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiPaginatedResponse(DocumentPublicViewDto)
  async listFolderDocuments(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Query() query: FolderPaginationDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.listFolderDocsUseCase.execute({
      folderId: id,
      userId,
      page,
      limit,
    });
    return result;
  }

  // Tags
  @Get('tags')
  @ApiOperation({ summary: 'List all tags created by the user' })
  @ApiSuccessResponse(TagsResponseDto)
  async listTags(@User('userId') userId: string) {
    const tags = await this.listTagsUseCase.execute(userId);
    return { tags };
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a new organizational tag' })
  @ApiSuccessResponse(TagResponseDto, 'Tag created')
  @HttpCode(HttpStatus.CREATED)
  async createTag(@User('userId') userId: string, @Body() data: CreateTagDto) {
    const tag = await this.createTagUseCase.execute({
      userId,
      ...data,
    });
    return { tag };
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: 'Update tag details' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiSuccessResponse(TagResponseDto)
  async updateTag(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateTagDto,
  ) {
    const tag = await this.updateTagUseCase.execute({
      id,
      userId,
      data,
    });
    return { tag };
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTag(@User('userId') userId: string, @Param('id') id: string) {
    await this.deleteTagUseCase.execute(id, userId);
  }

  @Get('tags/:id/documents')
  @ApiOperation({ summary: 'List documents associated with a tag' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiPaginatedResponse(DocumentPublicViewDto)
  async listTagDocuments(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Query() query: FolderPaginationDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.listTagDocsUseCase.execute({
      tagId: id,
      userId,
      page,
      limit,
    });
    return result;
  }

  // Notes
  @Get('notes')
  @ApiOperation({ summary: 'List all notes for a specific document' })
  @ApiSuccessResponse(NotesResponseDto)
  async listNotes(
    @User('userId') userId: string,
    @Query() query: ListNotesDto,
  ) {
    const notes = await this.listNotesUseCase.execute(query.documentId, userId);
    return { notes };
  }

  @Post('notes')
  @ApiOperation({ summary: 'Create a new note attached to a document' })
  @ApiSuccessResponse(NoteResponseDto, 'Note created')
  @HttpCode(HttpStatus.CREATED)
  async createNote(
    @User('userId') userId: string,
    @Body() data: CreateNoteDto,
  ) {
    const note = await this.createNoteUseCase.execute({
      userId,
      ...data,
    });
    return { note };
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiSuccessResponse(NoteViewDto)
  async getNote(@User('userId') userId: string, @Param('id') id: string) {
    const note = await this.getNoteUseCase.execute(id, userId);
    return note;
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update note content' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiSuccessResponse(NoteResponseDto)
  async updateNote(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateNoteDto,
  ) {
    const note = await this.updateNoteUseCase.execute(id, userId, data.content);
    return { note };
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@User('userId') userId: string, @Param('id') id: string) {
    await this.deleteNoteUseCase.execute(id, userId);
  }
}
