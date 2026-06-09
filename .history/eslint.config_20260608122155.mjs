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

// Remove the parser so ESLint doesn't receive a non-functional parser object.
// next/core-web-vitals injects a parser via FlatCompat which can be
// non-serializable; dropping it here lets ESLint use its own default parser
// while still applying all the rule sets from next/core-web-vitals.
const cleanConfig = eslintConfig.map((config) => {
    if (config ? .languageOptions ? .parser) {
        const { parser, ...restLanguageOptions } = config.languageOptions;
        return {
            ...config,
            languageOptions: restLanguageOptions,
        };
    }
    return config;
});

export default cleanConfig;