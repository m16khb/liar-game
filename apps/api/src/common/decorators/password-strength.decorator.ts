import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

@ValidatorConstraint({ async: false })
export class PasswordStrengthConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password) return true; // Optional field

    // 최소 4자, 최대 20자
    if (password.length < 4 || password.length > 20) {
      return false;
    }

    // XSS 및 위험한 패턴 방지
    if (/<script|javascript:|on\w+=/i.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return '비밀번호는 4-20자여야 하며, 사용할 수 없는 문자를 포함할 수 없습니다.';
  }
}

export function IsPasswordStrength(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordStrengthConstraint,
    });
  };
}