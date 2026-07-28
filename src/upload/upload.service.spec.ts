import { AppUploadService } from "./upload.service";

describe("AppUploadService", () => {
  it("instantiates without error", () => {
    const service = new AppUploadService();
    expect(service).toBeInstanceOf(AppUploadService);
  });
});
