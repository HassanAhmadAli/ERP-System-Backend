import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdService } from "./ad.service";
import { CreateAdDto } from "./dto/create-ad.dto";
import { UpdateAdDto } from "./dto/update-ad.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { FindAllAdQueryDto } from "./dto/find-all-query.dto";
import {
  ApiAuth,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentParam,
  DocumentBody,
  DocumentOperation,
} from "@/openapi/decorators";
import { MessageResponseDto } from "@/openapi/dto/responses.dto";

@ApiTags("Advertisements")
@ApiAuth()
@Controller("ads")
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post()
  @setPermissions(Permissions.manageAds)
  @DocumentOperation("Create advertisement")
  @DocumentCreatedResponse("Advertisement created")
  create(@Body() dto: CreateAdDto) {
    return this.adService.create(dto);
  }

  @Get()
  @DocumentOperation("List advertisements", "Public catalog; filter activeOnly for storefront.")
  @DocumentOkResponse("Paginated advertisements")
  findAll(@Query() { activeOnly, ...paginationQuery }: FindAllAdQueryDto) {
    return this.adService.findAll(paginationQuery, activeOnly);
  }

  @Get(":id")
  @setPermissions(Permissions.manageAds)
  @DocumentOperation("Get advertisement by ID")
  @DocumentParam("id", "Advertisement ID")
  @DocumentOkResponse("Advertisement")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.adService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageAds)
  @DocumentOperation("Update advertisement")
  @DocumentParam("id", "Advertisement ID")
  @DocumentBody(UpdateAdDto)
  @DocumentOkResponse("Advertisement updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAdDto) {
    return this.adService.update(id, dto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageAds)
  @DocumentOperation("Delete advertisement")
  @DocumentParam("id", "Advertisement ID")
  @DocumentOkResponse("Advertisement deleted", MessageResponseDto)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.adService.remove(id);
  }
}
