import { Module } from "@nestjs/common";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import { NotificationsModule } from "@/notification/notification.module";
import { HashingModule } from "@/hashing/hashing.module";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { ManagerAuthenticationService } from "./manager.authentication.service";
import { EmployeeAuthenticationService } from "./admin.authentication.service";
import { AdminAuthenticationService } from "./employee.authentication.service";

@Module({
  controllers: [AuthenticationController],
  providers: [
    RefreshTokenIdsStorage,
    CustomerAuthenticationService,
    AuthenticationService,
    ManagerAuthenticationService,
    EmployeeAuthenticationService,
    AdminAuthenticationService,
  ],
  imports: [HashingModule, NotificationsModule],
  exports: [HashingModule],
})
export class AuthenticationModule {}
