import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { CategoriesService } from '../categories/categories.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'MacBook Pro',
  description: 'Apple MacBook Pro',
  price: 2499.99,
  stock: 10,
  images: [],
  primaryCategoryId: '507f1f77bcf86cd799439012',
  categoryIds: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProductModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

const mockCategoriesService = {
  exists: jest.fn(),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if primary category does not exist', async () => {
      mockCategoriesService.exists.mockResolvedValue(false);

      await expect(
        service.create({
          name: 'MacBook Pro',
          price: 2499.99,
          stock: 10,
          primaryCategoryId: '507f1f77bcf86cd799439012',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and return a product', async () => {
      mockCategoriesService.exists.mockResolvedValue(true);

      const saveMock = jest.fn().mockResolvedValue(mockProduct);
      const originalModel = service['productModel'];

      const ProductModelMock = Object.assign(
        jest.fn().mockImplementation(() => ({ save: saveMock })),
        originalModel,
      );

      (service as any).productModel = ProductModelMock;

      const result = await service.create({
        name: 'MacBook Pro',
        price: 2499.99,
        stock: 10,
        primaryCategoryId: '507f1f77bcf86cd799439012',
      });

      expect(result).toBeDefined();
      (service as any).productModel = originalModel;
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      mockProductModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        }),
      });
      mockProductModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toEqual([mockProduct]);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      mockProductModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProduct),
          }),
        }),
      });

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        service.findById('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return a product', async () => {
      mockCategoriesService.exists.mockResolvedValue(true);
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockProduct, price: 1999.99 }),
        }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { price: 1999.99 });
      expect(result.price).toBe(1999.99);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', { price: 1999.99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});