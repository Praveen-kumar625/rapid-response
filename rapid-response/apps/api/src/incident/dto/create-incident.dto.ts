import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Incident as IIncident } from '@rapid-response/contracts';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}
