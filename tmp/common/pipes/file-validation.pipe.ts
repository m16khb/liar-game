/**
 * File Validation Pipe
 *
 * Validates uploaded files for:
 * - File existence
 * - MIME type (CSV files only)
 * - File extension (.csv)
 * - File size (handled by Fastify multipart plugin)
 */

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { MultipartFile } from '@fastify/multipart';

/**
 * 허용되는 CSV MIME 타입
 */
const ALLOWED_CSV_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'text/x-csv',
  'application/x-csv',
  'text/comma-separated-values',
  'text/x-comma-separated-values',
  'application/vnd.ms-excel', // Windows Excel CSV
];

/**
 * CSV 파일 검증 파이프
 */
@Injectable()
export class CsvFileValidationPipe implements PipeTransform {
  async transform(file: MultipartFile | undefined): Promise<MultipartFile> {
    // 파일 존재 여부 확인
    if (!file) {
      throw new BadRequestException(
        '파일이 업로드되지 않았습니다. "file" 필드로 CSV 파일을 업로드하세요.'
      );
    }

    // MIME 타입 검증
    const mimeType = file.mimetype.toLowerCase();
    if (!ALLOWED_CSV_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `잘못된 파일 형식입니다. CSV 파일만 업로드 가능합니다. (현재: ${file.mimetype})`
      );
    }

    // 파일 확장자 검증
    const filename = file.filename.toLowerCase();
    if (!filename.endsWith('.csv')) {
      throw new BadRequestException(
        `잘못된 파일 확장자입니다. .csv 파일만 업로드 가능합니다. (현재: ${file.filename})`
      );
    }

    // 파일 이름 검증 (보안 체크)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('잘못된 파일 이름입니다.');
    }

    return file;
  }
}
