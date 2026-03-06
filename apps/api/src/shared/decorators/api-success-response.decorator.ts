import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

/**
 * Custom decorator to automatically construct a Swagger schema
 * that wraps a given DTO model inside the standard ApiResponseDto.
 */
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  description: string = 'Successful response',
  isArray: boolean = false,
) => {
  const dataProperty = model
    ? isArray
      ? {
          type: 'array',
          items: { $ref: getSchemaPath(model) },
        }
      : {
          $ref: getSchemaPath(model),
        }
    : { type: 'object', nullable: true };

  const models = model ? [ApiResponseDto, model] : [ApiResponseDto];

  return applyDecorators(
    ApiExtraModels(...models),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: dataProperty,
            },
          },
        ],
      },
    }),
  );
};
