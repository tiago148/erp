import { IsArray, IsBoolean, IsIn, IsNumber, IsString } from 'class-validator';

export class UpsertBudgetRoteiroDto {
  @IsArray() @IsString({ each: true }) checkedKeys: string[];
  @IsIn(['exec', 'basico', 'croqui']) infoLevel: string;
  @IsBoolean() siteVisitDone: boolean;
  @IsNumber() completionPct: number;
  @IsNumber() suggestedContingencyPct: number;
}
