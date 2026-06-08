import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals")];

// Workaround: strip non-serializable Function values from parser objects
// to prevent "Cannot serialize key 'parse'" errors during Next.js build.
const cleanConfig = eslintConfig.map((config) => {
    if (config.languageOptions ? .parser) {
        const { parse, parseForESLint, ...rest } = config.languageOptions.parser;
        return {
            ...config,
            languageOptions: {
                ...config.languageOptions,
                parser: rest,
            },
        };
    }
    return config;
});

export default cleanConfig;