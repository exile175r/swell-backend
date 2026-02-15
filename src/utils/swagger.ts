import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Swell API Documentation',
      version: '1.0.0',
      description: 'Swell 애플리케이션의 백엔드 API 문서입니다.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: '로컬 개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // 라우트와 컨트롤러에서 문서를 추출합니다.
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  const port = process.env.PORT || 8080;
  console.log(`Swagger UI is available at http://localhost:${port}/api-docs`);
};
