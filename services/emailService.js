const nodemailer = require('nodemailer');

// Configurar el transporte de email
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar email de donación
async function enviarEmailDonacion(datosDonacion) {
    try {
        const { emailUsuario, nombreUsuario, monto, fecha } = datosDonacion;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: emailUsuario,
            subject: '¡Gracias por tu donación a DreamPlay! 🎬',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                        .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 20px; }
                        .amount { font-size: 24px; color: #27ae60; font-weight: bold; text-align: center; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎬 DreamPlay</h1>
                            <p>¡Gracias por tu apoyo!</p>
                        </div>
                        <div class="content">
                            <h2>Hola ${nombreUsuario},</h2>
                            <p>Tu donación ha sido procesada exitosamente.</p>
                            <div class="amount">$${monto} USD</div>
                            <p>Con tu apoyo podemos seguir mejorando nuestra plataforma de streaming y agregar más contenido exclusivo.</p>
                            <p><strong>Fecha:</strong> ${fecha}</p>
                            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 DreamPlay. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de donación enviado a: ${emailUsuario}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return false;
    }
}

// Función para enviar email de bienvenida
async function enviarEmailBienvenida(datosUsuario) {
    try {
        const { email, nombre } = datosUsuario;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: '¡Bienvenido a DreamPlay! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                        .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 20px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎬 DreamPlay</h1>
                            <p>¡Bienvenido a nuestra comunidad!</p>
                        </div>
                        <div class="content">
                            <h2>Hola ${nombre},</h2>
                            <p>¡Estamos emocionados de tenerte en DreamPlay!</p>
                            <p>Ahora puedes:</p>
                            <ul>
                                <li>📺 Acceder a nuestro contenido exclusivo</li>
                                <li>💳 Realizar donaciones para apoyar el proyecto</li>
                                <li>👥 Compartir tus experiencias con la comunidad</li>
                            </ul>
                            <p>Explora todas las funciones y disfruta de la mejor experiencia de streaming.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 DreamPlay. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de bienvenida enviado a: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
        return false;
    }
}

module.exports = {
    enviarEmailDonacion,
    enviarEmailBienvenida
};