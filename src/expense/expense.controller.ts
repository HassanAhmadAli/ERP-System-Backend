import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "./expense.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseQueryDto } from "./dto/expense-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Expenses")
@ApiAuth()
@Controller("expenses")
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @setPermissions(Permissions.manageExpenses)
  @DocumentOperation("Record an expense")
  @DocumentBody(CreateExpenseDto)
  @DocumentCreatedResponse("Expense recorded")
  create(@ActiveUser("sub") userId: number, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewExpenses)
  @DocumentOperation("List expenses")
  @DocumentOkResponse("Paginated expenses")
  findAll(@Query() query: ExpenseQueryDto) {
    return this.expenseService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewExpenses)
  @DocumentOperation("Get expense by ID")
  @DocumentParam("id", "Expense ID")
  @DocumentOkResponse("Expense")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.expenseService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageExpenses)
  @DocumentOperation("Update expense")
  @DocumentParam("id", "Expense ID")
  @DocumentBody(UpdateExpenseDto)
  @DocumentOkResponse("Expense updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(id, dto);
  }
}
