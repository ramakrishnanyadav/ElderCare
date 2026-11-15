import { SetMetadata } from '@nestjs/common';
import { ActionName } from '@eldercare/domain';

export const REQUIRE_ACTION_KEY = 'require_action';
export const RequireAction = (action: ActionName) => SetMetadata(REQUIRE_ACTION_KEY, action);
