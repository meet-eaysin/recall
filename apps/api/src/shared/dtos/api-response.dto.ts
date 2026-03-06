import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Indicates whether the API request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable message regarding the response',
    example: 'Operation successful',
  })
  message: string;

  /**
   * The actual response payload.
   */
  data: T;

  @ApiProperty({
    description: 'ISO 8601 timestamp of when the response was generated',
    example: '2026-03-06T12:00:00.000Z',
  })
  timestamp: string;

  constructor(success: boolean, statusCode: number, message: string, data: T) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
