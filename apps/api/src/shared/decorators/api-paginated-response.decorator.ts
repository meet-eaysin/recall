import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/api-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';

/**
 * PRODUCTION-GRADE PAGINATION DECORATOR
 *
 * Generates an explicit Swagger schema for a paginated result.
 * This ensures full response consistency and standard-compliant OpenAPI documentation.
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Successful paginated response',
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, PaginatedResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginatedResponseDto) },
                  {
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );
};
