import React, { useState } from 'react';
import { Localized } from '@fluent/react';

import { isEmailValid } from '../../../../fxa-shared/email/helpers';

import shieldIcon from './images/shield.svg';

import { Form, Input, Checkbox, OnValidateFunction } from '../fields';
import {
  State as ValidatorState,
  useValidatorState,
  MiddlewareReducer as ValidatorMiddlewareReducer,
} from '../../lib/validator';

import './index.scss';

export type NewUserEmailFormProps = {
  getString: (id: string) => string;
  validatorInitialState?: ValidatorState;
  validatorMiddlewareReducer?: ValidatorMiddlewareReducer;
};

export const NewUserEmailForm = ({
  getString,
  validatorInitialState,
  validatorMiddlewareReducer,
}: NewUserEmailFormProps) => {
  const validator = useValidatorState({
    initialState: validatorInitialState,
    middleware: validatorMiddlewareReducer,
  });

  const [emailInputState, setEmailInputState] = useState<string>();

  return (
    <Form
      data-testid="new-user-email-form"
      validator={validator}
      className="new-user-email-form"
    >
      <Localized id="new-user-sign-in-link">
        <p className="sign-in-copy" data-testid="sign-in-copy">
          Already have a Firefox account? <a>Sign in</a>
        </p>
      </Localized>
      <Localized id="new-user-email" attrs={{ placeholder: true, label: true }}>
        <Input
          type="email"
          name="new-user-email"
          label="Enter your email"
          data-testid="new-user-email"
          placeholder="foxy@mozilla.com"
          required
          spellCheck={false}
          onValidate={(value, focused) => {
            return emailInputValidationAndAccountCheck(
              value,
              focused,
              setEmailInputState,
              getString
            );
          }}
        />
      </Localized>

      <Localized id="new-user-confirm-email" attrs={{ label: true }}>
        <Input
          type="email"
          name="new-user-confirm-email"
          label="Confirm your email"
          data-testid="new-user-confirm-email"
          required
          spellCheck={false}
          onValidate={(value, focused) => {
            return emailConfirmationValidation(
              value,
              focused,
              emailInputState,
              getString
            );
          }}
        />
      </Localized>

      <Localized id="new-user-subscribe-product-updates">
        <Checkbox
          data-testid="new-user-subscribe-product-updates"
          name="new-user-subscribe-product-updates"
        >
          I'd like to receive product updates from Firefox
        </Checkbox>
      </Localized>

      <div className="assurance-copy" data-testid="assurance-copy">
        <img src={shieldIcon} alt="shield" />
        <Localized id="new-user-subscribe-product-updates">
          <p>
            We only use your email to create your account. We will never sell it
            to a third party.
          </p>
        </Localized>
      </div>
    </Form>
  );
};

export function emailInputValidationAndAccountCheck(
  value: string,
  focused: boolean,
  setEmailInputState: Function,
  getString: Function
) {
  let error = null;
  let valid = false;
  setEmailInputState(value);
  if (isEmailValid(value)) {
    // check if we have an existing account here
    valid = true;
  }
  const errorMsg = getString
    ? /* istanbul ignore next - not testing l10n here */
      getString('new-user-email-validate')
    : 'Email is not valid';

  if (!valid && !focused && errorMsg) {
    error = errorMsg;
  }

  return {
    value,
    valid,
    error,
  };
}

export function emailConfirmationValidation(
  value: string,
  focused: boolean,
  emailInputState: string | undefined,
  getString: Function
) {
  let valid = false;

  valid = emailInputState === value;

  const errorMsg = getString
    ? /* istanbul ignore next - not testing l10n here */
      getString('new-user-email-validate-confirm')
    : 'Emails do not match';

  return {
    value,
    valid,
    error: !valid && !focused ? errorMsg : null,
  };
}

export default NewUserEmailForm;