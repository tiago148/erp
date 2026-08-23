import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonLearnedDto } from './create-lesson-learned.dto';

export class UpdateLessonLearnedDto extends PartialType(
  CreateLessonLearnedDto,
) {}
