import swaggerJsdoc from "swagger-jsdoc"

export const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Tchap Bot Webhooks API with Swagger",
            version: "1.0.0",
            description:
                "Simple Tchap Bot webhook application documented with Swagger",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Ministère de l'Écologie",
                url: "https://www.ecologie.gouv.fr/",
                email: "thomas.bouchardon@developpement-durable.gouv.fr",
            },
        },
        servers: [
            {
                url: "https://tchap-bot.mel.e2.rie.gouv.fr/",
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};

export const specs = swaggerJsdoc(options);
