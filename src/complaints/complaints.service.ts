import { ConflictException, Injectable, StreamableFile, UnauthorizedException } from "@nestjs/common";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { ComplaintUpdateOperation, Prisma, PrismaService, Role } from "@/prisma";
import { UpdateComplaintDto } from "./dto/update-complaint.dto";
import { getEntriesOfTrue, getKeyOf } from "@/utils";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { Notification } from "@/notifications/notification.interface";
import { CachingService } from "@/common/caching/caching.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { Queue } from "bullmq";
// todo: move away from this package , it is abandoned
import { parse } from "json2csv";
@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cachingService: CachingService,
    @InjectQueue(Keys.notification) private readonly notificationQueue: Queue<Notification>,
  ) {}
  private get prisma() {
    return this.prismaService.client;
  }

  private async notifyUser(
    notification: {
      userId: number;
      title: Notification["title"];
      message: Notification["message"];
      email: Notification["email"];
    },
    type: Notification["type"] = "info",
  ) {
    await this.notificationQueue.add("send-notification", {
      ...notification,
      type,
      createdAt: new Date(),
    });
  }
  async raiseComplaint(createComplaintDto: CreateComplaintDto, citizenId: number) {
    const res = await this.prisma.complaint.create({
      data: {
        ...createComplaintDto,
        citizenId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assignedEmployeeId: true,
      },
    });
    await this.notifyUser({
      userId: citizenId,
      title: "complaint raised",
      message: "your complaint was successfully raised",
      email: null,
    });
    await this.prisma.complaintUpdateHistory.create({
      data: {
        message: `Complaint created with status ${res.status}`,
        operationType: ComplaintUpdateOperation.CREATE,
        complaintId: res.id,
        departmentId: createComplaintDto.departmentId,
        userId: citizenId,
      },
    });
    return res;
  }
  async citizenAttachFileToComplaint(citizenId: number, email: string, complaintId: string, file: Express.Multer.File) {
    const storedFile = await this.prisma.storedFile.create({
      data: {
        id: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
      },
    });
    const { id: attachmentId, ...attachment } = await this.prisma.attachment.create({
      data: {
        storedFileId: storedFile.id,
        complaintId,
        creatorId: citizenId,
      },
      select: {
        createdAt: true,
        storedFileId: true,
        id: true,
      },
    });
    await this.notifyUser({
      userId: citizenId,
      title: "attachment upload",
      message: "attachment was successfully uploaded",
      email,
    });
    //todo: make enum for operation type
    //todo: save complaint to redis
    const { departmentId } = await this.prisma.complaint.findUniqueOrThrow({
      where: { id: complaintId },
      select: { departmentId: true },
    });
    await this.prisma.complaintUpdateHistory.create({
      data: {
        message: `Citizen provided an attachment to complaint , with attachment id ${attachmentId}`,
        operationType: ComplaintUpdateOperation.ADD_ATTACHMENT,
        complaintId,
        departmentId,
        userId: citizenId,
      },
    });
    return attachment;
  }

  async getComplaintsAttachments(complaintId: string, { limit, offset, deleted, deletedAt }: PaginationQueryDto) {
    return await this.prisma.attachment.findMany({
      where: {
        complaintId,
        deletedAt,
      },
      skip: offset,
      take: limit,
      select: {
        storedFile: {
          select: {
            id: true,
            originalname: true,
            size: true,
            mimetype: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        updatedAt: deleted,
        deletedAt: deleted,
      },
    });
  }

  async getDepartmentComplaints(employeeId: number) {
    const emp = await this.prisma.user.findUniqueOrThrow({
      where: { id: employeeId },
    });
    return await this.prisma.complaint.findMany({
      where: {
        departmentId: emp.departmentId!,
      },
    });
  }
  async getComplaintAndLockOrThrow({ complaintId, employeeId }: { complaintId: string; employeeId: number }) {
    try {
      const complaint = await this.prisma.complaint.update({
        where: {
          id: complaintId,
          lockedAt: null,
          lockedById: null,
        },
        data: {
          lockedById: employeeId,
          lockedAt: new Date(),
        },
      });
      return complaint;
    } catch {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
      });
      if (complaint == undefined) {
        throw new ConflictException("Complaint does not exist");
      }
      // todo: unlock if necessary
      throw new ConflictException("Complaint is already Being processed by another employee");
    }
  }

  async assignComplaint(complaintId: string, employeeId: number) {
    let complaint = await this.getComplaintAndLockOrThrow({ complaintId, employeeId });
    try {
      const employee = await this.prisma.user.findUnique({
        where: {
          id: employeeId,
          departmentId: { not: null },
        },
        select: {
          departmentId: true,
        },
      });
      if (employee == undefined) {
        throw new UnauthorizedException("Employee does not belong to any department");
      }
      if (complaint.departmentId != employee.departmentId) {
        throw new UnauthorizedException("You does not belone to the same department of this complaint");
      }
      complaint = await this.prisma.complaint.update({
        where: {
          id: complaintId,
        },
        data: {
          assignedEmployeeId: employeeId,
        },
      });
      const { email } = await this.cachingService.users.getCachedUserData(complaint.citizenId);
      await this.notifyUser({
        userId: complaint.citizenId,
        title: "complaint update",
        message: "an employee was assigned to your complaint, a response will be given soon",
        email,
      });
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: { lockedById: null, lockedAt: null },
      });
      // todo: make enum for operation type
      await this.prisma.complaintUpdateHistory.create({
        data: {
          message: `an employee was assigned to the complaint`,
          operationType: ComplaintUpdateOperation.EMPLOYEE_ASSIGNED,
          complaintId,
          departmentId: complaint.departmentId,
          userId: employeeId,
        },
      });
      return complaint;
    } catch (e) {
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: { lockedById: null, lockedAt: null },
      });
      throw e;
    }
  }
  async getEmployeeComplaints(employeeId: number) {
    return await this.prisma.complaint.findMany({
      where: {
        assignedEmployeeId: employeeId,
      },
    });
  }
  async getCitizenComplaints(citizenId: number) {
    return await this.prisma.complaint.findMany({
      where: {
        citizenId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assignedEmployeeId: true,
      } satisfies Prisma.ComplaintSelect,
    });
  }

  async updateStatus(complaintId: string, employeeId: number, updateComplaintDto: UpdateComplaintDto) {
    return await this.prisma.$transaction(async (tx) => {
      const complaint = await this.prismaService.complaint.findForUpdate(tx, complaintId);
      const oldStatus = complaint.status;
      if (complaint?.assignedEmployeeId !== employeeId) {
        throw new ConflictException("Employee does not have permissions on this complaint");
      }
      const updatedComplaint = await tx.complaint.update({
        where: {
          id: complaintId,
          assignedEmployeeId: employeeId,
        },
        data: updateComplaintDto,
        select: {
          ...getEntriesOfTrue(updateComplaintDto),
          id: true,
        } satisfies Prisma.ComplaintSelect,
      });
      const { email } = await this.cachingService.users.getCachedUserData(complaint.citizenId);
      await this.notifyUser({
        userId: complaint.citizenId,
        title: "complaint status update",
        message: `the status of your complaint was updated to ${updateComplaintDto.status}`,
        email,
      });
      // todo: enum
      await this.prisma.complaintUpdateHistory.create({
        data: {
          message: `An Emplyee Updated the status of the complaint from ${oldStatus} to ${complaint.status}`,
          operationType: ComplaintUpdateOperation.UPDATE,
          complaintId,
          departmentId: complaint.departmentId,
          userId: employeeId,
        },
      });
      return updatedComplaint;
    });
  }

  async archiveComplaint(complaintId: string, employeeId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const complaint = await this.prismaService.complaint.findForUpdate(tx, complaintId);
      if (complaint.isArchived === true) {
        throw new ConflictException("Complaint already archived");
      }
      if (complaint.assignedEmployeeId !== employeeId) {
        throw new ConflictException("Employee does not have permissions to archive this Complaint");
      }
      const res = await tx.complaint.update({
        where: {
          id: complaintId,
        },
        data: {
          isArchived: true,
        },
      });
      const { email } = await this.cachingService.users.getCachedUserData(res.citizenId);
      await this.notifyUser({
        userId: res.citizenId,
        title: "complaint archived",
        message: "your complaint was archived by the assigned employee",
        email,
      });
      // todo: enum
      await this.prisma.complaintUpdateHistory.create({
        data: {
          message: `Complaint Archived by the assigned employee`,
          operationType: ComplaintUpdateOperation.ARCHIVING,
          complaintId: res.id,
          departmentId: res.departmentId,
          userId: employeeId,
        },
      });
      return res;
    });
  }
  async getComplaintHistory(complaintId: string, userId: number, role: Role) {
    // todo:
    const complaint = await this.prisma.complaint.findUniqueOrThrow({
      where: {
        id: complaintId,
      },
      select: {
        departmentId: true,
        citizenId: true,
      },
    });
    switch (role) {
      case Role.Citizen: {
        if (complaint.citizenId === userId) {
          break;
        }
        throw new ConflictException("the complaint was not submited by this citizin");
      }
      case Role.Employee: {
        const emp = await this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { departmentId: true },
        });
        if (emp.departmentId === complaint.departmentId) {
          break;
        }
        throw new ConflictException("the complaint was not submited by this employee");
      }
      default:
        break;
    }
    const res = await this.prisma.complaintUpdateHistory.findMany({
      where: {
        complaintId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const fields = getKeyOf(res[0]!);
    // todo: move away from this package , it is abandoned
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return parse(res, { fields }) as string;
  }
  async getDepartmentHistory(departmentId: number, userId: number, role: Role) {
    // todo:
    switch (role) {
      case Role.Employee: {
        const emp = await this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { departmentId: true },
        });
        if (emp.departmentId === departmentId) {
          break;
        }
        throw new ConflictException("the complaint was not submited by this employee");
      }
      default:
        break;
    }
    const res = await this.prisma.complaintUpdateHistory.findMany({
      where: {
        departmentId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const fields = getKeyOf(res[0]!);
    // todo: move away from this package , it is abandoned
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return parse(res, { fields }) as string;
  }
}
