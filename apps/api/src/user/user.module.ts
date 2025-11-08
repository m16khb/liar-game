// 사용자 모듈
// 최소 구현 원칙: 기본적인 사용자 관리 기능

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserEntity } from './entities'
import { UserRepository } from './user.repository'
import { PasswordValidationService } from './password-validation.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, UserRepository, PasswordValidationService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
