import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-123',
  email: 'victor@test.com',
  password: 'hashedpassword',
  name: 'Victor',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await authService.register(
        'victor@test.com',
        'password123',
        'Victor',
      );

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('victor@test.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register('victor@test.com', 'password123', 'Victor'),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password before saving', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      await authService.register('victor@test.com', 'password123', 'Victor');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should not return password in response', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await authService.register(
        'victor@test.com',
        'password123',
        'Victor',
      );

      expect(result.user).not.toHaveProperty('password');
    });

    it('should call jwt.sign with correct payload on register', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      await authService.register('victor@test.com', 'password123', 'Victor');

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-123',
        email: 'victor@test.com',
      });
    });
  });

  describe('login', () => {
    it('should login and return token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('victor@test.com', 'password123');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('victor@test.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('ghost@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('victor@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call bcrypt.compare with correct arguments', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('victor@test.com', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should call jwt.sign with correct payload', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('victor@test.com', 'password123');

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-123',
        email: 'victor@test.com',
      });
    });

    it('should return access_token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('victor@test.com', 'password123');

      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should return user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('victor@test.com', 'password123');

      expect(result.user).toEqual({
        id: 'uuid-123',
        email: 'victor@test.com',
        name: 'Victor',
      });
    });
  });
});