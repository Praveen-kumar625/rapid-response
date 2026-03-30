import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status!: string;
}
