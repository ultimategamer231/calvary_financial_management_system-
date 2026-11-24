import base from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
const config = [
  ...base,
  ...ts,
  { ignores: [".next/**", "next-env.d.ts", "test-results/**"] },
];
export default config;
