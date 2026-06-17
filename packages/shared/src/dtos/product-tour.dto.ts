import { IsArray, IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  STUDIO_PRODUCT_TOUR_STEPS,
  type StudioProductTourStep,
} from '../constants/studio-product-tour';

export class UpdateStudioProductTourDto {
  @IsOptional()
  @IsIn([...STUDIO_PRODUCT_TOUR_STEPS])
  completeStep?: StudioProductTourStep;

  @IsOptional()
  @IsArray()
  @IsIn([...STUDIO_PRODUCT_TOUR_STEPS], { each: true })
  completeSteps?: StudioProductTourStep[];

  @IsOptional()
  @IsBoolean()
  dismiss?: boolean;
}
