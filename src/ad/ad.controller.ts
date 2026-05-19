import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdService } from "./ad.service";
import { CreateAdDto } from "./dto/create-ad.dto";
import { UpdateAdDto } from "./dto/update-ad.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { FindAllAdQueryDto } from "./dto/find-all-query.dto";

@ApiTags("Advertisements")
@Controller("ads")
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post()
  @setPermissions(Permissions.manageAds)
  @ApiOperation({ summary: "Create an advertisement" })
  create(@Body() dto: CreateAdDto) {
    return this.adService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List advertisements" })
  findAll(@Query() { activeOnly, ...paginationQuery }: FindAllAdQueryDto) {
    return this.adService.findAll(paginationQuery, activeOnly);
  }

  @Get(":id")
  @setPermissions(Permissions.manageAds)
  @ApiOperation({ summary: "Get advertisement by ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.adService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageAds)
  @ApiOperation({ summary: "Update an advertisement" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAdDto) {
    return this.adService.update(id, dto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageAds)
  @ApiResponse({ status: 200, description: "Advertisement deleted" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.adService.remove(id);
  }
}
