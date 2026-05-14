import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { CategoriesService } from '../categories/categories.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

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
  select: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

const mockCategoriesService = {
  exists: jest.fn(),
};

const mockRabbitMQService = {
  publish: jest.fn(),
  consume: jest.fn(),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
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
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
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

      mockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockProduct, price: 1999.99 }),
        }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { price: 1999.99 });
      expect(result.price).toBe(1999.99);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', { price: 1999.99 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should publish product.price.changed when price is changed', async () => {
      mockCategoriesService.exists.mockResolvedValue(true);
      mockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockProduct, price: 1999.99 }),
        }),
      });

      await service.update('507f1f77bcf86cd799439011', { price: 1999.99 });
      expect(mockRabbitMQService.publish).toHaveBeenCalled();
    });

    it('should NOT publish product.price.changed when price is unchanged', async () => {
      mockCategoriesService.exists.mockResolvedValue(true);
      mockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      await service.update('507f1f77bcf86cd799439011', { price: 2499.99 });
      expect(mockRabbitMQService.publish).not.toHaveBeenCalled();
    });

    it('should NOT publish product.price.changed when dto.price is undefined', async () => {
      mockCategoriesService.exists.mockResolvedValue(true);
      mockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      await service.update('507f1f77bcf86cd799439011', { name: 'Test' });
      expect(mockRabbitMQService.publish).not.toHaveBeenCalled();
    });
  });


  describe('decrementStock', () => {
    it('should decrement stock and publish product.out.of.stock if stock is 0', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 0 }),
      });

      await service.decrementStock('507f1f77bcf86cd799439011', 1);
      expect(mockRabbitMQService.publish).toHaveBeenCalled();
    });

    it('should NOT publish product.out.of.stock if stock is not 0', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 1 }),
      });

      await service.decrementStock('507f1f77bcf86cd799439011', 1);
      expect(mockRabbitMQService.publish).not.toHaveBeenCalled();
    });

    it('should log and return when product not found', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.decrementStock('507f1f77bcf86cd799439011', 5),
      ).resolves.toBeUndefined();

      expect(mockRabbitMQService.publish).not.toHaveBeenCalled();
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