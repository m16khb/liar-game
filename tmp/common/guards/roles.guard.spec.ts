import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@/modules/user/entities/user.entity';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user: any = null): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          url: '/test',
          method: 'GET',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is not found', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const user = { id: 1, role: UserRole.ADMIN };
    const context = createMockContext(user);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has admin role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);
    const user = { id: 1, role: UserRole.ADMIN };
    const context = createMockContext(user);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const user = { id: 1, role: UserRole.USER };
    const context = createMockContext(user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user matches one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER, UserRole.ADMIN]);
    const user = { id: 1, role: UserRole.USER };
    const context = createMockContext(user);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should call reflector with correct parameters', () => {
    const mockReflector = jest.spyOn(reflector, 'getAllAndOverride');
    const context = createMockContext();

    guard.canActivate(context);

    expect(mockReflector).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
