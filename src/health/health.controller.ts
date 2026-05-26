import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/public.decorator";
import { DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { HealthResponseDto } from "@/openapi/dto/responses.dto";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  @DocumentOperation("Health check")
  @DocumentOkResponse("Service is running", HealthResponseDto)
  check() {
    return { status: "ok" };
  }
}
