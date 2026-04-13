import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import { ComplaintsService } from "./complaints.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";

import { ActiveUser, type ActiveUserType } from "@/iam/decorators/ActiveUser.decorator";
import { UpdateComplaintDto } from "./dto/update-complaint.dto";
import { SetAllowedRoles } from "@/iam/authorization/decorators/roles.decorator";
import { Role } from "@/prisma";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileMimeStandarizingPipe } from "@/attachment/pipe/file-mime-standarnizing.pipe";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { type Response } from "express";
@Controller("complaints")
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @SetAllowedRoles(Role.Citizen)
  @Post("raise")
  async raiseComplaint(
    @Body() createComplaintDto: CreateComplaintDto,
    @ActiveUser("sub") citizenId: ActiveUserType["sub"],
  ) {
    return await this.complaintsService.raiseComplaint(createComplaintDto, citizenId);
  }

  @SetAllowedRoles(Role.Citizen)
  @Post(":id/attachment")
  @UseInterceptors(FileInterceptor("file"))
  async citizenAttachFileToComplaint(
    @Param("id") complaintId: string,
    @ActiveUser() { sub: citizenId, email }: ActiveUserType,
    @UploadedFile(new FileMimeStandarizingPipe())
    file: Express.Multer.File,
  ) {
    console.log({ complaintId, citizenId, file });
    return await this.complaintsService.citizenAttachFileToComplaint(citizenId, email, complaintId, file);
  }
  @SetAllowedRoles(Role.Citizen)
  @Get(":id/attachment")
  async getComplaintsAttachments(@Param("id") complaintId: string, @Query() paginationQueryDto: PaginationQueryDto) {
    return await this.complaintsService.getComplaintsAttachments(complaintId, paginationQueryDto);
  }

  @SetAllowedRoles(Role.Citizen)
  @Get("citizen-complaints")
  async getCitizenComplaints(@ActiveUser("sub") citizenId: number) {
    return await this.complaintsService.getCitizenComplaints(citizenId);
  }

  @SetAllowedRoles(Role.Employee)
  @Get("employee/assigned-complaints")
  async getEmployeeComplaints(@ActiveUser("sub") employeeId: number) {
    return await this.complaintsService.getEmployeeComplaints(employeeId);
  }

  @SetAllowedRoles(Role.Employee)
  @Get("employee/department-complaints")
  async getDepartmentComplaints(@ActiveUser("sub") employeeId: number) {
    return await this.complaintsService.getDepartmentComplaints(employeeId);
  }

  @SetAllowedRoles(Role.Employee)
  @Patch("employee/:id/assign")
  async assignComplaint(@Param("id") complaintId: string, @ActiveUser("sub") employeeId: number) {
    return await this.complaintsService.assignComplaint(complaintId, employeeId);
  }

  @SetAllowedRoles(Role.Employee)
  @Patch("employee/:id/status")
  async updateStatus(
    @Param("id") complaintId: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
    @ActiveUser("sub") employeeId: number,
  ) {
    return await this.complaintsService.updateStatus(complaintId, employeeId, updateComplaintDto);
  }

  @SetAllowedRoles(Role.Employee)
  @Delete("employee/:id/archive")
  async archiveComplaint(@Param("id") complaintId: string, @ActiveUser("sub") employeeId: number) {
    return await this.complaintsService.archiveComplaint(complaintId, employeeId);
  }

  @Get("history/complaint/:id")
  async getComplaintHistory(
    @Param("id") complaintId: string,
    @ActiveUser() user: ActiveUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sub: userId, role } = user;
    const csv = await this.complaintsService.getComplaintHistory(complaintId, userId, role);
    res
      .setHeader("Content-Type", "text/csv")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="complaint_${complaintId}_complaint_history_${Date.now()}.csv"`,
      )
      .send(csv);
  }

  @SetAllowedRoles(Role.Employee, Role.Admin, Role.Debugging)
  @Get("history/department/:id")
  async getDepartmentHistory(
    @Param("id", ParseIntPipe) departmentId: number,
    @ActiveUser() user: ActiveUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sub: userId, role } = user;
    const csv = await this.complaintsService.getDepartmentHistory(departmentId, userId, role);
    res
      .setHeader("Content-Type", "text/csv")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="department_${departmentId}_complaints_history_${Date.now()}.csv"`,
      )
      .send(csv);
  }
}
