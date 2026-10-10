export const seoAnalysisSchema = {
    type: "OBJECT",
    properties: {
        overallScore: { type: "INTEGER" },
        categories: {
            type: "OBJECT",
            properties: {
                seo: { type: "INTEGER" },
                performance: { type: "INTEGER" },
                accessibility: { type: "INTEGER" },
                bestPractices: { type: "INTEGER" },
            },
            required: ["seo", "performance", "accessibility", "bestPractices"],
        },
        keywords: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    word: { type: "STRING" },
                    count: { type: "INTEGER" },
                    density: { type: "NUMBER" },
                },
                required: ["word", "count", "density"],
            },
        },
        issues: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    severity: {
                        type: "STRING",
                        enum: ["critical", "warning", "info"],
                    },
                    category: { type: "STRING" },
                    message: { type: "STRING" },
                    recommendation: { type: "STRING" },
                },
                required: ["severity", "category", "message", "recommendation"],
            },
        },
    },
    required: ["overallScore", "categories", "keywords", "issues"],
};