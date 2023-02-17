/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  bind,
  ModelContext,
  ContextKeyTransforms as T,
  ModelContextProvider,
  ContextValidation as V,
  validateContext,
} from '../../lib/context';

export class SupplicantInfo implements ModelContextProvider {
  @bind([V.isAccessType], T.snakeCase)
  accessType: string | undefined;

  @bind([V.isClientId], T.snakeCase)
  clientId: string | undefined;

  @bind([V.isCodeChallenge], T.snakeCase)
  codeChallenge: string | undefined;

  @bind([V.isCodeChallengeMethod], T.snakeCase)
  codeChallengeMethod: string | undefined;

  @bind([V.isNonEmptyString])
  scope: string | undefined;

  @bind([V.isString], T.snakeCase)
  state: string | undefined;

  constructor(protected readonly context: ModelContext) {}

  getModelContext(): ModelContext {
    return this.context;
  }

  validate(): void {
    return validateContext(this);
  }
}