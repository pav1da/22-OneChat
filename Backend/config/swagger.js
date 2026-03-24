const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'OneChat API',
            version: '1.0.0',
            description: 'API Documentation สำหรับระบบ OneChat — ระบบแชท Omnichannel',
        },
        servers: [
            {
                url: BASE_URL,
                description: process.env.BASE_URL ? 'Production Server (Railway)' : 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'ใส่ JWT Token ที่ได้จาก Login (ไม่ต้องใส่ Bearer นำหน้า)',
                },
            },
        },
    },
    apis: ['./routers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'OneChat API Docs',
    }));

    // Endpoint สำหรับดึง JSON spec
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`📄 Swagger UI: ${BASE_URL}/api-docs`);
};

module.exports = setupSwagger;
