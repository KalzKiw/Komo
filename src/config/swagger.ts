import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "CafES APP API",
    version: "1.0.0",
    description: "API para digitalizacion de cafeterias escolares"
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local"
    }
  ],
  components: {
    securitySchemes: {
      roleHeaderAuth: {
        type: "apiKey",
        in: "header",
        name: "x-user-role",
        description:
          "Cabecera obligatoria para endpoints protegidos. Valores validos: ADMIN, STAFF, STUDENT, DELEGATE, PARENT."
      }
    }
  }
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ["src/routes/*.ts", "src/docs/*.ts"]
});
