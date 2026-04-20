import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getModelToken } from '@nestjs/mongoose';
import { Category } from './schemas/category.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockCategory = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Electronics',
  description: 'Electronic devices',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCategoryModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if name already exists', async () => {
      mockCategoryModel.findOne.mockResolvedValue(mockCategory);

      await expect(
        service.create({ name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return a category', async () => {
      mockCategoryModel.findOne.mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(mockCategory);
      const originalModel = service['categoryModel'];

      const CategoryModelMock = Object.assign(
        jest.fn().mockImplementation(() => ({ save: saveMock })),
        originalModel,
      );

      (service as any).categoryModel = CategoryModelMock;

      const result = await service.create({ name: 'Electronics' });
      expect(result).toBeDefined();

      (service as any).categoryModel = originalModel;
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockCategoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockCategory]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      mockCategoryModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCategory),
        }),
      });

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCategoryModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.findById('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return category', async () => {
      mockCategoryModel.findOne.mockResolvedValue(null);
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
        }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryModel.findOne.mockResolvedValue(null);
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if name already taken', async () => {
      mockCategoryModel.findOne.mockResolvedValue(mockCategory);

      await expect(
        service.update('different-id', { name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockCategoryModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCategoryModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true if category exists', async () => {
      mockCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      const result = await service.exists('507f1f77bcf86cd799439011');
      expect(result).toBe(true);
    });

    it('should return false if category does not exist', async () => {
      mockCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.exists('507f1f77bcf86cd799439011');
      expect(result).toBe(false);
    });
  });
});