module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Bí kíp: Ép TypeScript biên dịch ngầm sang CommonJS cho Jest dễ đọc
        tsconfig: {
          module: 'CommonJS',
        },
      },
    ],
  },
  moduleNameMapper: {
    // Tự động xử lý các đường dẫn import có đuôi .js hoặc .ts trong code của ông
    '^(\\.{1,2}/.*)\\.(js|ts)$': '$1',
  },
};