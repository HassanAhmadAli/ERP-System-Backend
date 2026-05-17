import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseQueryDto } from "./dto/expense-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { Prisma } from "@/prisma";

@Injectable()
export class ExpenseService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(userId: number, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...dto,
        recordedById: userId,
      },
      include: {
        recordedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findAll(query: ExpenseQueryDto) {
    const where: Prisma.ExpenseWhereInput = {};

    if (query.category != undefined) {
      where.category = { contains: query.category, mode: "insensitive" };
    }
    if (query.from != undefined || query.to != undefined) {
      where.expenseDate = {};
      if (query.from != undefined) {
        where.expenseDate.gte = query.from;
      }
      if (query.to != undefined) {
        where.expenseDate.lte = query.to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          recordedBy: { select: { id: true, fullName: true, email: true } },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { expenseDate: "desc" },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return paginated(data, total);
  }

  async findOne(id: number) {
    return this.prisma.expense.findUniqueOrThrow({
      where: { id },
      include: {
        recordedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async update(id: number, dto: UpdateExpenseDto) {
    try {
      return await this.prisma.expense.update({
        where: { id },
        data: dto,
        include: {
          recordedBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    } catch {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
  }
}
