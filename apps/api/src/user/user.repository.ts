import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserData, UpdateUserData } from './user.service';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * soft delete된 사용자를 포함하여 이메일로 조회
   * Auth Hook에서 탈퇴한 사용자 복구 시 사용
   */
  async findByEmailWithDeleted(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email }, withDeleted: true });
  }

  /**
   * email + oauthProvider 조합으로 사용자 조회
   */
  async findByEmailAndProvider(email: string, provider: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        email,
        oauthProvider: provider,
      },
    });
  }

  /**
   * OAuth ID로 사용자 조회
   */
  async findByOAuthId(oauthId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        oauthId,
      },
    });
  }

  async create(userData: CreateUserData): Promise<UserEntity> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, updateData: UpdateUserData): Promise<UserEntity> {
    // First, find the user to ensure it exists
    const _user = await this.findOne(id);

    // Create sanitized data without null values for TypeORM compatibility
    const sanitizedData: any = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== null) {
        sanitizedData[key] = value;
      }
    }

    // Update the user
    await this.userRepository.update(id, sanitizedData);

    // Return the updated user
    return this.findOne(id);
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: dayjs.utc().toDate(),
    });
  }

  async delete(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async findAll(limit?: number, offset?: number): Promise<UserEntity[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (limit) {
      query.limit(limit);
    }

    if (offset) {
      query.offset(offset);
    }

    return query.getMany();
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
