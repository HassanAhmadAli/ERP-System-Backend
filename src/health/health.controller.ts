import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/public.decorator";
import { DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { HealthResponseDto } from "@/openapi/dto/responses.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@/prisma/client";
@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}
  @Public()
  @Get()
  @DocumentOperation("Health check")
  @DocumentOkResponse("Service is running", HealthResponseDto)
  async check() {
    await this.prismaService.client.$executeRaw(Prisma.sql`SELECT 1`);
    return { status: "ok" };
  }
}
