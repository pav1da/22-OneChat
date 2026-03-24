const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
    },
    apis: [
        './routers/usersRouter.js',
        './routers/logsRouter.js',
        './routers/notificationRouter.js',
        './routers/notificationSettingsRouter.js',
        './routers/apiKeysRouter.js',
    ],
};

try {
    const spec = swaggerJsdoc(options);
    const paths = Object.keys(spec.paths);
    console.log('Total paths:', paths.length);
    paths.forEach(p => {
        Object.keys(spec.paths[p]).forEach(m => console.log(' ', m.toUpperCase(), p));
    });
    console.log('\nSchemas:', Object.keys(spec.components.schemas).join(', '));
    console.log('\nSwagger spec generated successfully!');
} catch (e) {
    console.error('ERROR:', e.message);
}
