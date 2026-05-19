import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "./expense.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseQueryDto } from "./dto/expense-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Expenses")
@Controller("expenses")
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @setPermissions(Permissions.manageExpenses)
  @ApiOperation({ summary: "Record an expense" })
  @ApiResponse({ status: 201, description: "Expense created successfully" })
  create(@ActiveUser("sub") userId: number, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewExpenses)
  @ApiOperation({ summary: "List expenses" })
  @ApiResponse({ status: 200, description: "Expenses retrieved successfully" })
  findAll(@Query() query: ExpenseQueryDto) {
    return this.expenseService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewExpenses)
  @ApiOperation({ summary: "Get an expense by ID" })
  @ApiResponse({ status: 200, description: "Expense retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.expenseService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageExpenses)
  @ApiOperation({ summary: "Update an expense" })
  @ApiResponse({ status: 200, description: "Expense updated successfully" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(id, dto);
  }
}
