/* eslint-disable @typescript-eslint/unbound-method */
import { existsSync } from "node:fs";
import { resolveUploadPath, normalizeUploadPath } from "./resolve-upload-path";

jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
}));

const mockedExistsSync = jest.mocked(existsSync);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("resolveUploadPath", () => {
  it("returns absolute path if it exists", () => {
    mockedExistsSync.mockImplementation((p) => p === "/absolute/path/file.txt");
    expect(resolveUploadPath("/absolute/path/file.txt")).toBe("/absolute/path/file.txt");
  });

  it("returns cwd-relative absolute path if direct absolute does not exist", () => {
    mockedExistsSync.mockImplementation((p) => p === `${process.cwd()}/some/path`);
    expect(resolveUploadPath("/some/path")).toBe(`${process.cwd()}/some/path`);
  });

  it("returns relative path if it exists under cwd", () => {
    mockedExistsSync.mockImplementation((p) => p === `${process.cwd()}/relative/path`);
    expect(resolveUploadPath("relative/path")).toBe(`${process.cwd()}/relative/path`);
  });

  it("returns the relative path literal as fallback", () => {
    mockedExistsSync.mockImplementation((p) => p === "relative/path");
    expect(resolveUploadPath("relative/path")).toBe("relative/path");
  });

  it("returns undefined when no candidate exists", () => {
    mockedExistsSync.mockReturnValue(false);
    expect(resolveUploadPath("/nonexistent")).toBeUndefined();
  });
});

describe("normalizeUploadPath", () => {
  const originalCwd = process.cwd;

  afterAll(() => {
    process.cwd = originalCwd;
  });

  it("returns relative posix path when absolute path is inside cwd", () => {
    process.cwd = jest.fn().mockReturnValue("/app");
    mockedExistsSync.mockReturnValue(true);
    const result = normalizeUploadPath("/app/uploads/img.jpg", "img.jpg");
    expect(result).toBe("uploads/img.jpg");
  });

  it("returns uploads/filename when relative path does not exist", () => {
    process.cwd = jest.fn().mockReturnValue("/app");
    mockedExistsSync.mockReturnValue(false);
    const result = normalizeUploadPath("some/path", "img.jpg");
    expect(result).toBe("uploads/img.jpg");
  });

  it("returns relative posix path when relative path exists", () => {
    process.cwd = jest.fn().mockReturnValue("/app");
    mockedExistsSync.mockImplementation((p) => p === `${process.cwd()}/data/files`);
    const result = normalizeUploadPath("data/files", "img.jpg");
    expect(result).toBe("data/files");
  });
});
