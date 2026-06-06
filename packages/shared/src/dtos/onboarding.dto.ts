import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  STUDIO_ONBOARDING_STEPS,
  type StudioOnboardingStep,
} from '../constants/studio-onboarding';

export class UpdateStudioOnboardingDto {
  /** Mark a wizard step complete and advance. */
  @IsOptional()
  @IsIn(STUDIO_ONBOARDING_STEPS)
  completeStep?: StudioOnboardingStep;

  /** Skip the wizard (marks onboarding finished). */
  @IsOptional()
  @IsBoolean()
  skip?: boolean;

  /** Mark all steps complete without visiting each screen. */
  @IsOptional()
  @IsBoolean()
  complete?: boolean;
}
