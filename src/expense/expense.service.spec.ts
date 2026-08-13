/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ExpenseService } from "./expense.service";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ExpenseQueryDto } from "./dto/expense-query.dto";

describe("ExpenseService", () => {
  let service: ExpenseService;
  let prismaService: jest.Mocked<PrismaService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockExpense = {
    id: 1,
    category: "Rent",
    amount: 500,
    expenseDate: new Date("2026-01-15"),
    description: null,
    recordedById: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    recordedBy: { id: 10, fullName: "Manager", fullNameAr: null, email: "manager@test.com" },
  };

  const recordedBySelect = { select: { id: true, fullName: true, fullNameAr: true, email: true } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              expense: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                findUniqueOrThrow: jest.fn(),
                update: jest.fn(),
              },
            },
          },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockImplementation((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(ExpenseService);
    prismaService = module.get(PrismaService);
    i18nService = module.get(I18nService);
  });

  describe("create", () => {
    it("creates an expense with the recordedBy user id", async () => {
      const dto: CreateExpenseDto = { category: "Rent", amount: 500, expenseDate: new Date("2026-01-15") };
      jest.mocked(prismaService.client.expense.create).mockResolvedValue(mockExpense as never);

      const result = await service.create(10, dto);

      expect(result).toStrictEqual(mockExpense);
      expect(prismaService.client.expense.create).toHaveBeenCalledWith({
        data: { ...dto, recordedById: 10 },
        include: { recordedBy: recordedBySelect },
      });
    });
  });

  describe("findAll", () => {
    it("returns paginated expenses without filters", async () => {
      const query: ExpenseQueryDto = { limit: 10, offset: 0 };
      jest.mocked(prismaService.client.expense.findMany).mockResolvedValue([mockExpense] as never);
      jest.mocked(prismaService.client.expense.count).mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result).toStrictEqual({
        data: [mockExpense],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(prismaService.client.expense.findMany).toHaveBeenCalledWith({
        where: {},
        include: { recordedBy: recordedBySelect },
        skip: 0,
        take: 10,
        orderBy: { expenseDate: "desc" },
      });
    });

    it("filters by category with case-insensitive contains", async () => {
      const query: ExpenseQueryDto = { limit: 10, offset: 0, category: "rent" };
      jest.mocked(prismaService.client.expense.findMany).mockResolvedValue([] as never);
      jest.mocked(prismaService.client.expense.count).mockResolvedValue(0);

      await service.findAll(query);

      expect(prismaService.client.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: { contains: "rent", mode: "insensitive" } } }),
      );
    });

    it("filters by date range from and to", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");
      const query: ExpenseQueryDto = { limit: 10, offset: 0, from, to };
      jest.mocked(prismaService.client.expense.findMany).mockResolvedValue([] as never);
      jest.mocked(prismaService.client.expense.count).mockResolvedValue(0);

      await service.findAll(query);

      expect(prismaService.client.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { expenseDate: { gte: from, lte: to } } }),
      );
    });

    it("filters only by from when to is not provided", async () => {
      const from = new Date("2026-01-01");
      const query: ExpenseQueryDto = { limit: 10, offset: 0, from };
      jest.mocked(prismaService.client.expense.findMany).mockResolvedValue([] as never);
      jest.mocked(prismaService.client.expense.count).mockResolvedValue(0);

      await service.findAll(query);

      expect(prismaService.client.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { expenseDate: { gte: from } } }),
      );
    });
  });

  describe("findOne", () => {
    it("returns the expense with recordedBy included", async () => {
      jest.mocked(prismaService.client.expense.findUniqueOrThrow).mockResolvedValue(mockExpense as never);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(mockExpense);
      expect(prismaService.client.expense.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { recordedBy: recordedBySelect },
      });
    });
  });

  describe("update", () => {
    it("updates the expense and includes recordedBy", async () => {
      const updated = { ...mockExpense, amount: 750 };
      jest.mocked(prismaService.client.expense.update).mockResolvedValue(updated as never);

      const result = await service.update(1, { amount: 750 });

      expect(result).toStrictEqual(updated);
      expect(prismaService.client.expense.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { amount: 750 },
        include: { recordedBy: recordedBySelect },
      });
    });

    it("throws NotFoundException when the expense does not exist", async () => {
      jest.mocked(prismaService.client.expense.update).mockRejectedValue(new Error("P2025"));

      await expect(service.update(999, { amount: 1 })).rejects.toThrow(NotFoundException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.expense.notFound", { args: { id: 999 } });
    });
  });
});
